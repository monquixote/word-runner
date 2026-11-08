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

      const enVoices = voices.filter(v => /^en([-_]|$)/i.test(v.lang || ''));
      if (enVoices.length === 0) return;

      const localEn = enVoices.filter(v => v.localService);
      const pool = localEn.length > 0 ? localEn : enVoices;

      // Prefer British English (en-GB) such as Daniel, Martha, Serena, Arthur, or Google UK
      const gbVoice =
        pool.find(v => /en[-_]gb/i.test(v.lang || '') && /daniel|serena|martha|arthur|kate/i.test(v.name)) ||
        pool.find(v => /en[-_]gb/i.test(v.lang || '')) ||
        enVoices.find(v => /en[-_]gb/i.test(v.lang || '')) ||
        pool[0] ||
        enVoices[0] ||
        null;

      this.defaultEnglishVoice = gbVoice;
    };

    findVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = findVoices;
    }
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

  public testVoice(voiceURI?: string): void {
    this.speakWord('Enjoyment! Careful! Happiness!', voiceURI);
  }

  public speakWord(text: string, overrideVoiceURI?: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!soundFx.isEnabled()) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      if (!this.defaultEnglishVoice) {
        this.initVoices();
      }

      const voices = window.speechSynthesis.getVoices();
      const preferredURI = overrideVoiceURI || this.getSelectedVoiceURI();

      let activeVoice: SpeechSynthesisVoice | null = null;
      if (preferredURI && preferredURI !== 'auto') {
        activeVoice = voices.find(v => (v.voiceURI || v.name) === preferredURI) || null;
      }
      if (!activeVoice) {
        activeVoice = this.defaultEnglishVoice;
      }

      const cleanText = text.replace(/^-/, '').trim();
      if (!cleanText) return;

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

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const speechManager = new SpeechManager();
