import type { WordLevel } from '../types.ts';

export const level3: WordLevel = {
  id: 'level3',
  levelNumber: 3,
  title: 'Level 3: -ment, -ness & -ly',
  subtitle: 'Actions, Feelings & How We Do Things',
  badgeColor: '#38bdf8',
  accentColor: '#a855f7',
  suffixPool: ['-ment', '-ness', '-ly', '-ful', '-less'],
  words: [
    {
      id: 'l3_movement',
      rootWord: 'move',
      targetSuffix: '-ment',
      combinedWord: 'movement',
      clue: 'The act of moving',
      distractorSuffixes: ['-ness', '-ful', '-less', '-ly'],
      spellingDistractors: ['movment', 'movemant']
    },
    {
      id: 'l3_treatment',
      rootWord: 'treat',
      targetSuffix: '-ment',
      combinedWord: 'treatment',
      clue: 'Care given to help someone feel better',
      distractorSuffixes: ['-ness', '-ful', '-less', '-ly'],
      spellingDistractors: ['treetment', 'treatmant']
    },
    {
      id: 'l3_payment',
      rootWord: 'pay',
      targetSuffix: '-ment',
      combinedWord: 'payment',
      clue: 'Money paid for something',
      distractorSuffixes: ['-ness', '-ful', '-less', '-ly'],
      spellingDistractors: ['paiment', 'paymant']
    },
    {
      id: 'l3_kindness',
      rootWord: 'kind',
      targetSuffix: '-ness',
      combinedWord: 'kindness',
      clue: 'The quality of being kind and caring',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['kindnes', 'kyndness']
    },
    {
      id: 'l3_illness',
      rootWord: 'ill',
      targetSuffix: '-ness',
      combinedWord: 'illness',
      clue: 'Being unwell or sick',
      distractorSuffixes: ['-ment', '-ful', '-less', '-ly'],
      spellingDistractors: ['ilness', 'illnes']
    },
    {
      id: 'l3_fitness',
      rootWord: 'fit',
      targetSuffix: '-ness',
      combinedWord: 'fitness',
      clue: 'Being strong, healthy, and fit',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['fittness', 'fitnes']
    },
    {
      id: 'l3_quickly',
      rootWord: 'quick',
      targetSuffix: '-ly',
      combinedWord: 'quickly',
      clue: 'Done in a fast, quick way',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['quikly', 'quickley']
    },
    {
      id: 'l3_slowly',
      rootWord: 'slow',
      targetSuffix: '-ly',
      combinedWord: 'slowly',
      clue: 'Moving at a slow speed',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['slowley', 'sloly']
    },
    {
      id: 'l3_loudly',
      rootWord: 'loud',
      targetSuffix: '-ly',
      combinedWord: 'loudly',
      clue: 'Making a lot of noise',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['loudley', 'lowdly']
    },
    {
      id: 'l3_gladly',
      rootWord: 'glad',
      targetSuffix: '-ly',
      combinedWord: 'gladly',
      clue: 'Doing something with pleasure',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['gladdly', 'gladley']
    }
  ],
  rules: [
    {
      id: 'l3_rule_movement',
      prompt: 'SPELL: move + -ment = ?',
      correctAnswer: 'movement',
      distractors: ['movment', 'movemant'],
      spokenWord: 'movement',
      explanation: 'Keep the e in move when adding -ment!'
    },
    {
      id: 'l3_rule_fitness',
      prompt: 'SPELL: fit + -ness = ?',
      correctAnswer: 'fitness',
      distractors: ['fittness', 'fitnes'],
      spokenWord: 'fitness',
      explanation: 'Just add -ness straight onto fit: fitness!'
    }
  ]
};
