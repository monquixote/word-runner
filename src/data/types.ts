export type SuffixType =
  | '-ment'
  | '-ness'
  | '-ful'
  | '-less'
  | '-ly'
  | '-er'
  | '-est'
  | '-ing'
  | '-ed';

export type QuizMode = 'suffix' | 'spelling' | 'mixed';

export interface WordItem {
  id: string;
  rootWord: string;
  targetSuffix: SuffixType;
  combinedWord: string;
  clue: string;
  ruleNote?: string;
  /**
   * Unambiguous suffix distractors that do NOT form a valid English word with rootWord.
   */
  distractorSuffixes: SuffixType[];
  /**
   * Common misspelling distractors for spelling mode / tricky rule waves.
   */
  spellingDistractors: [string, string];
}

export interface RuleQuestion {
  id: string;
  prompt: string;
  correctAnswer: string;
  distractors: [string, string];
  spokenWord?: string;
  explanation?: string;
}

export interface WordLevel {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  badgeColor: string;
  accentColor?: string;
  suffixPool: SuffixType[];
  words: WordItem[];
  rules: RuleQuestion[];
}

export interface PlayerStats {
  score: number;
  currentStreak: number;
  bestStreak: number;
  health: number;
  maxHealth: number;
  totalWordsCompleted: number;
  wordAccuracy: Record<string, { correct: number; incorrect: number; history?: boolean[] }>;
}
