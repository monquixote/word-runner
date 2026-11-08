import type { WordLevel, WordItem, RuleQuestion, PlayerStats, QuizMode } from '../data/types.ts';
import { ALL_LEVELS } from '../data/levels/index.ts';

export interface EncounterCard {
  type: 'suffix' | 'spelling' | 'rule';
  word?: WordItem;
  rule?: RuleQuestion;
  levelTitle: string;
  isCurrentLevel: boolean;
}

export interface DeckConfig {
  level: WordLevel;
  isCumulativeExam: boolean;
  quizMode?: QuizMode;
  totalEncounters: number;
  stats: PlayerStats;
}

/**
 * Calculates a priority weight for spaced repetition based on historical accuracy.
 * Unseen or recently failed items receive higher weights to ensure focused review.
 */
export function calculateItemWeight(id: string, isCurrentLevel: boolean, stats: PlayerStats): number {
  let weight = 2.0;
  const record = stats.wordAccuracy[id];

  if (!record || record.correct + record.incorrect === 0) {
    weight = 4.0;
  } else {
    const total = record.correct + record.incorrect;
    const history = record.history || [];
    const recentAccuracy = history.length > 0
      ? history.filter(Boolean).length / history.length
      : record.correct / total;

    const failedLast = history.length > 0 && history[history.length - 1] === false;

    if (failedLast || recentAccuracy < 0.5) {
      weight = 6.0;
    } else if (recentAccuracy < 0.75) {
      weight = 4.0;
    } else if (recentAccuracy >= 0.85 && total >= 3) {
      weight = 1.0;
    }
  }

  if (isCurrentLevel) {
    weight *= 1.5;
  }

  return weight;
}

/**
 * Weighted sampling without replacement to guarantee no duplicate questions in a session.
 */
export function sampleWeightedWithoutReplacement<T extends { id: string }>(
  pool: T[],
  count: number,
  getWeight: (item: T) => number
): T[] {
  if (pool.length === 0) return [];
  const available = [...pool];
  const selected: T[] = [];

  while (selected.length < count && available.length > 0) {
    const weights = available.map(getWeight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;

    let chosenIdx = 0;
    for (let i = 0; i < available.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        chosenIdx = i;
        break;
      }
    }

    selected.push(available[chosenIdx]);
    available.splice(chosenIdx, 1);
  }

  // Fallback if pool is smaller than required count (refill while preventing consecutive duplicates)
  while (selected.length < count) {
    const lastId = selected[selected.length - 1]?.id;
    const refill = pool.length > 1 ? pool.filter(item => item.id !== lastId) : pool;
    const weights = refill.map(getWeight);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let rand = Math.random() * totalWeight;

    let chosenIdx = 0;
    for (let i = 0; i < refill.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        chosenIdx = i;
        break;
      }
    }
    selected.push(refill[chosenIdx]);
  }

  return selected;
}

/**
 * Generates an optimized, spaced-repetition encounter deck for the session.
 */
export function buildEncounterDeck(config: DeckConfig): {
  deck: EncounterCard[];
  allCandidateWords: WordItem[];
} {
  const { level, isCumulativeExam, quizMode = 'suffix', totalEncounters, stats } = config;

  // 1. Determine which levels are included
  const includedLevels = isCumulativeExam
    ? ALL_LEVELS.filter(l => l.levelNumber <= level.levelNumber)
    : [level];

  interface WrappedWord {
    id: string;
    word: WordItem;
    levelTitle: string;
    isCurrentLevel: boolean;
  }

  interface WrappedRule {
    id: string;
    rule: RuleQuestion;
    levelTitle: string;
    isCurrentLevel: boolean;
  }

  const wordsPool: WrappedWord[] = [];
  const rulesPool: WrappedRule[] = [];
  const allCandidateWords: WordItem[] = [];

  for (const l of includedLevels) {
    const isCurrent = l.id === level.id;
    for (const w of l.words) {
      allCandidateWords.push(w);
      wordsPool.push({
        id: w.id,
        word: w,
        levelTitle: l.title,
        isCurrentLevel: isCurrent
      });
    }
    for (const r of l.rules) {
      rulesPool.push({
        id: r.id,
        rule: r,
        levelTitle: l.title,
        isCurrentLevel: isCurrent
      });
    }
  }

  // If quizMode is 'suffix' or 'spelling', all waves pull from the word list
  if (quizMode === 'suffix' || quizMode === 'spelling') {
    const selectedWords = sampleWeightedWithoutReplacement(
      wordsPool,
      totalEncounters,
      item => calculateItemWeight(item.id, item.isCurrentLevel, stats)
    );

    const deck: EncounterCard[] = selectedWords.map(sw => ({
      type: quizMode,
      word: sw.word,
      levelTitle: sw.levelTitle,
      isCurrentLevel: sw.isCurrentLevel
    }));

    return { deck, allCandidateWords };
  }

  // 'mixed' mode: combine suffix questions with spelling/rule challenges every 4th wave
  let ruleCount = 0;
  for (let i = 1; i <= totalEncounters; i++) {
    if (i % 4 === 0 || i === totalEncounters) {
      ruleCount++;
    }
  }
  const wordCount = totalEncounters - ruleCount;

  const selectedWords = sampleWeightedWithoutReplacement(
    wordsPool,
    wordCount,
    item => calculateItemWeight(item.id, item.isCurrentLevel, stats)
  );

  const selectedRules = sampleWeightedWithoutReplacement(
    rulesPool,
    ruleCount,
    item => calculateItemWeight(item.id, item.isCurrentLevel, stats)
  );

  const deck: EncounterCard[] = [];
  let wordIdx = 0;
  let ruleIdx = 0;

  for (let i = 1; i <= totalEncounters; i++) {
    const isSpecial = i % 4 === 0 || i === totalEncounters;
    if (isSpecial && ruleIdx < selectedRules.length) {
      const rl = selectedRules[ruleIdx++];
      deck.push({
        type: 'rule',
        rule: rl.rule,
        levelTitle: rl.levelTitle,
        isCurrentLevel: rl.isCurrentLevel
      });
    } else if (wordIdx < selectedWords.length) {
      const wm = selectedWords[wordIdx++];
      deck.push({
        type: 'suffix',
        word: wm.word,
        levelTitle: wm.levelTitle,
        isCurrentLevel: wm.isCurrentLevel
      });
    }
  }

  return { deck, allCandidateWords };
}
