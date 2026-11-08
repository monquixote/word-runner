import type { WordLevel } from '../types.ts';

export const level2: WordLevel = {
  id: 'level2',
  levelNumber: 2,
  title: 'Level 2: -ful & -less Builders',
  subtitle: 'Full of (-ful) vs Without (-less)',
  badgeColor: '#00a859',
  accentColor: '#38bdf8',
  suffixPool: ['-ful', '-less', '-ment', '-ness', '-ly'],
  words: [
    {
      id: 'l2_helpful',
      rootWord: 'help',
      targetSuffix: '-ful',
      combinedWord: 'helpful',
      clue: 'Full of help; ready to help others',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['helpfull', 'hepful']
    },
    {
      id: 'l2_fearless',
      rootWord: 'fear',
      targetSuffix: '-less',
      combinedWord: 'fearless',
      clue: 'Brave and without fear',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['fearles', 'feerless']
    },
    {
      id: 'l2_thankful',
      rootWord: 'thank',
      targetSuffix: '-ful',
      combinedWord: 'thankful',
      clue: 'Full of thanks and grateful',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['thankfull', 'thancful']
    },
    {
      id: 'l2_harmless',
      rootWord: 'harm',
      targetSuffix: '-less',
      combinedWord: 'harmless',
      clue: 'Safe and doing no harm',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['harmles', 'harmliss']
    },
    {
      id: 'l2_colourful',
      rootWord: 'colour',
      targetSuffix: '-ful',
      combinedWord: 'colourful',
      clue: 'Full of bright colours',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['colourfull', 'colurful']
    },
    {
      id: 'l2_restless',
      rootWord: 'rest',
      targetSuffix: '-less',
      combinedWord: 'restless',
      clue: 'Unable to rest or sit still',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['restles', 'restliss']
    },
    {
      id: 'l2_painful',
      rootWord: 'pain',
      targetSuffix: '-ful',
      combinedWord: 'painful',
      clue: 'Causing pain; hurting',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['painfull', 'paneful']
    },
    {
      id: 'l2_endless',
      rootWord: 'end',
      targetSuffix: '-less',
      combinedWord: 'endless',
      clue: 'Having no end; going on forever',
      distractorSuffixes: ['-ment', '-ness', '-ful'],
      spellingDistractors: ['endles', 'endliss']
    },
    {
      id: 'l2_useful',
      rootWord: 'use',
      targetSuffix: '-ful',
      combinedWord: 'useful',
      clue: 'Handy and full of use',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['usefull', 'usful']
    },
    {
      id: 'l2_powerless',
      rootWord: 'power',
      targetSuffix: '-less',
      combinedWord: 'powerless',
      clue: 'Without any power or strength',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['powerles', 'powrless']
    }
  ],
  rules: [
    {
      id: 'l2_rule_ful',
      prompt: 'Which suffix means "FULL OF"?',
      correctAnswer: '-ful',
      distractors: ['-less', '-ment'],
      spokenWord: 'helpful',
      explanation: '-ful means full of (always spelled with ONE l!).'
    },
    {
      id: 'l2_rule_thankful',
      prompt: 'SPELL: thank + -ful = ?',
      correctAnswer: 'thankful',
      distractors: ['thankfull', 'thancful'],
      spokenWord: 'thankful',
      explanation: 'Drop the second l when adding -ful!'
    }
  ]
};
