import type { PlayerStats } from './types.ts';

const STORAGE_KEY = 'word_runner_stats_v1';

export function loadPlayerStats(): PlayerStats {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          score: 0, // Reset session score
          currentStreak: 0,
          bestStreak: parsed.bestStreak || 0,
          health: 5,
          maxHealth: 5,
          totalWordsCompleted: parsed.totalWordsCompleted || 0,
          wordAccuracy: parsed.wordAccuracy || {}
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load stats from localStorage:', e);
  }

  return {
    score: 0,
    currentStreak: 0,
    bestStreak: 0,
    health: 5,
    maxHealth: 5,
    totalWordsCompleted: 0,
    wordAccuracy: {}
  };
}

export function savePlayerProgress(stats: PlayerStats): void {
  try {
    const toSave = {
      bestStreak: stats.bestStreak,
      totalWordsCompleted: stats.totalWordsCompleted,
      wordAccuracy: stats.wordAccuracy
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save stats to localStorage:', e);
  }
}

export function clearPlayerStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear stats:', e);
  }
}

export function recordAnswerAttempt(stats: PlayerStats, wordId: string, isCorrect: boolean): void {
  if (!stats.wordAccuracy[wordId]) {
    stats.wordAccuracy[wordId] = { correct: 0, incorrect: 0, history: [] };
  }

  const record = stats.wordAccuracy[wordId];
  if (!record.history) {
    record.history = [];
  }

  // Keep rolling history of last 5 attempts
  record.history.push(isCorrect);
  if (record.history.length > 5) {
    record.history.shift();
  }

  if (isCorrect) {
    record.correct++;
  } else {
    record.incorrect++;
  }
  savePlayerProgress(stats);
}
