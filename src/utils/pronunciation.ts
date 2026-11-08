import { soundFx } from './soundEffects';

export interface AvailableVoice {
  name: string;
  friendlyName: string;
  lang: string;
  voiceURI: string;
  isBritish: boolean;
  isEnglish: boolean;
  gender: 'male' | 'female' | 'unknown';
  isLocal: boolean;
  label: string;
  category: 'british_voice' | 'english_other';
}

export function parseVoiceMetadata(
  name: string,
  lang: string,
  voiceURI?: string
): { friendlyName: string; gender: 'male' | 'female' | 'unknown' } {
  const lower = `${name} ${voiceURI || ''} ${lang}`.toLowerCase();

  if (lower.includes('en-gb-x-rjs')) return { friendlyName: 'Google UK English (Male)', gender: 'male' };
  if (lower.includes('en-gb-x-fis')) return { friendlyName: 'Google UK English (Female)', gender: 'female' };

  const maleKeywords = [
    'daniel', 'oliver', 'george', 'arthur', 'alex', 'david', 'james', 'fred', 'ryan', 'malcolm', 'brian',
    'reed', 'eddy', 'rocko', 'grandpa', '#male', 'male'
  ];
  if (maleKeywords.some(kw => lower.includes(kw))) {
    return { friendlyName: name, gender: 'male' };
  }

  const femaleKeywords = [
    'samantha', 'victoria', 'karen', 'moira', 'tessa', 'serena', 'kate', 'martha',
    'flo', 'sandy', 'shelley', 'grandma', '#female', 'female', 'woman'
  ];
  if (femaleKeywords.some(kw => lower.includes(kw))) {
    return { friendlyName: name, gender: 'female' };
  }

  return { friendlyName: name, gender: 'unknown' };
}

class SpeechManager {
  private defaultEnglishVoice: SpeechSynthesisVoice | null = null;
  private selectedVoiceURI: string | null = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.localStorage) {
      this.selectedVoiceURI = localStorage.getItem('word_runner_preferred_voice_uri');
    }
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const findVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      this.defaultEnglishVoice = this.findBestEnglishVoice(voices);
    };

    findVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = findVoices;
    }
  }

  public findBestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voices || voices.length === 0) return null;

    const enVoices = voices.filter(v => /^en([-_]|$)/i.test(v.lang || ''));
    if (enVoices.length === 0) return voices[0] || null;

    // 1. British English preferred voices (Daniel, Martha, Serena, Arthur, Kate, Oliver, George)
    const gbPreferred = enVoices.find(v =>
      /en[-_]gb/i.test(v.lang || '') &&
      /daniel|serena|martha|arthur|kate|oliver|george|uk english/i.test(v.name)
    );
    if (gbPreferred) return gbPreferred;

    // 2. Any British English voice
    const gbAny = enVoices.find(v => /en[-_]gb/i.test(v.lang || ''));
    if (gbAny) return gbAny;

    // 3. Preferred general English voices (Samantha, Karen, Alex, Victoria, Moira, Tessa)
    const generalPreferred = enVoices.find(v =>
      /samantha|karen|alex|victoria|moira|tessa/i.test(v.name)
    );
    if (generalPreferred) return generalPreferred;

    // 4. Any English voice in pool
    return enVoices[0] || null;
  }

  public getAvailableVoices(): AvailableVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];

    const rawVoices = window.speechSynthesis.getVoices();
    if (!rawVoices || rawVoices.length === 0) return [];

    const results: AvailableVoice[] = [];
    const seenURIs = new Set<string>();

    for (const v of rawVoices) {
      const uri = v.voiceURI || v.name;
      if (seenURIs.has(uri)) continue;

      const isEnglish = /^en([-_]|$)/i.test(v.lang || '');
      if (!isEnglish) continue;
      seenURIs.add(uri);

      const isBritish = /en[-_]gb/i.test(v.lang || '');
      const { friendlyName, gender } = parseVoiceMetadata(v.name, v.lang, v.voiceURI);

      const category: AvailableVoice['category'] = isBritish ? 'british_voice' : 'english_other';
      const genderTag = gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Voice';
      const label = `${friendlyName} (${v.lang || 'en'}) [${genderTag}]`;

      results.push({
        name: v.name,
        friendlyName,
        lang: v.lang,
        voiceURI: uri,
        isBritish,
        isEnglish,
        gender,
        isLocal: Boolean(v.localService),
        label,
        category
      });
    }

    return results.sort((a, b) => {
      if (a.isBritish !== b.isBritish) return a.isBritish ? -1 : 1;
      return a.friendlyName.localeCompare(b.friendlyName);
    });
  }

  public getActiveVoiceLabel(): string {
    const preferredURI = this.getSelectedVoiceURI();
    if (preferredURI && preferredURI !== 'auto') {
      const voices = this.getAvailableVoices();
      const found = voices.find(v => v.voiceURI === preferredURI);
      if (found) {
        return `${found.friendlyName} (${found.lang})`.trim();
      }
    }
    if (this.defaultEnglishVoice) {
      return `Auto (${this.defaultEnglishVoice.name})`;
    }
    return 'Auto (System Default)';
  }

  public setSelectedVoiceURI(uri: string | null): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (!uri || uri === 'auto') {
        localStorage.removeItem('word_runner_preferred_voice_uri');
        this.selectedVoiceURI = null;
      } else {
        localStorage.setItem('word_runner_preferred_voice_uri', uri);
        this.selectedVoiceURI = uri;
      }
    } else {
      this.selectedVoiceURI = uri;
    }
  }

  public getSelectedVoiceURI(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('word_runner_preferred_voice_uri');
    }
    return this.selectedVoiceURI;
  }

  public getUserPitch(): number | null {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = localStorage.getItem('word_runner_voice_pitch');
    if (raw === null) return null;
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }

  public setUserPitch(pitch: number | null): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (pitch === null) {
      localStorage.removeItem('word_runner_voice_pitch');
    } else {
      localStorage.setItem('word_runner_voice_pitch', pitch.toString());
    }
  }

  /**
   * Primes speech synthesis on the first user interaction to authorize
   * subsequent programmatic/asynchronous speech on iOS Safari.
   */
  public primeSpeech(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {
      // ignore
    }
  }

  public speechStatusText: string = 'Ready';
  public onStatusChange?: (status: string) => void;

  private setStatus(msg: string): void {
    this.speechStatusText = msg;
    if (this.onStatusChange) {
      try {
        this.onStatusChange(msg);
      } catch (err) {
        // ignore
      }
    }
  }

  public testVoice(voiceURI?: string): void {
    this.speakWord('Enjoyment', voiceURI);
  }

  public speakWord(text: string, overrideVoiceURI?: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!soundFx.isEnabled()) return;

    // Remove punctuation to prevent iOS 17/18 speech synthesis crash / silent failure
    const cleanText = text.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanText) return;

    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Clear any previous queued / stuck utterance
      window.speechSynthesis.cancel();

      this.executeSpeak(cleanText, overrideVoiceURI);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      this.setStatus('Error: ' + String(e));
    }
  }

  private executeSpeak(cleanText: string, overrideVoiceURI?: string, retryWithoutVoice: boolean = false): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const voices = window.speechSynthesis.getVoices();
      const preferredURI = overrideVoiceURI || this.getSelectedVoiceURI();

      let activeVoice: SpeechSynthesisVoice | null = null;
      if (!retryWithoutVoice) {
        if (preferredURI && preferredURI !== 'auto') {
          activeVoice = voices.find(v => (v.voiceURI || v.name) === preferredURI) || null;
        }
        if (!activeVoice) {
          activeVoice = this.findBestEnglishVoice(voices);
        }
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (activeVoice) {
        utterance.voice = activeVoice;
        utterance.lang = activeVoice.lang || 'en-GB';
      } else {
        utterance.lang = 'en-GB';
      }

      utterance.rate = 0.92;
      utterance.pitch = this.getUserPitch() ?? 1.0;
      utterance.volume = 1.0;

      // Keep strong reference on instance & window to protect against Safari GC bug
      this.activeUtterance = utterance;
      (window as unknown as { __activeUtterance?: SpeechSynthesisUtterance | null }).__activeUtterance = utterance;

      this.setStatus(`Speaking: "${cleanText}"...`);

      utterance.onstart = () => {
        this.setStatus(`Speaking: "${cleanText}"`);
      };

      utterance.onend = () => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
          (window as unknown as { __activeUtterance?: SpeechSynthesisUtterance | null }).__activeUtterance = null;
        }
        this.setStatus('Ready');
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
          (window as unknown as { __activeUtterance?: SpeechSynthesisUtterance | null }).__activeUtterance = null;
        }
        this.setStatus(`Speech error: ${e.error || 'unknown'}`);
        // If an explicit voice caused an error (e.g. uninstalled cloud voice on iOS), fallback to system default
        if (activeVoice && !retryWithoutVoice) {
          console.log('[Speech] Retrying with system default utterance fallback...');
          this.executeSpeak(cleanText, undefined, true);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('executeSpeak error:', err);
      this.setStatus('Error: ' + String(err));
    }
  }

  public stop(): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.activeUtterance = null;
      (window as unknown as { __activeUtterance?: SpeechSynthesisUtterance | null }).__activeUtterance = null;
    }
  }
}

export const speechManager = new SpeechManager();
