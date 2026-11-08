import type { WordLevel } from '../types.ts';

export const level1: WordLevel = {
  id: 'level1',
  levelNumber: 1,
  title: 'Level 1: Core Suffix Sheet',
  subtitle: '-ment, -ness, -ful, -less, -ly',
  badgeColor: '#ffe135',
  accentColor: '#00a859',
  suffixPool: ['-ment', '-ness', '-ful', '-less', '-ly'],
  words: [
    {
      id: 'l1_enjoyment',
      rootWord: 'enjoy',
      targetSuffix: '-ment',
      combinedWord: 'enjoyment',
      clue: 'The feeling of enjoying something',
      distractorSuffixes: ['-ness', '-ful', '-less', '-ly'],
      spellingDistractors: ['enjoiment', 'enjoymant']
    },
    {
      id: 'l1_sadness',
      rootWord: 'sad',
      targetSuffix: '-ness',
      combinedWord: 'sadness',
      clue: 'The state of feeling sad',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['saddness', 'sadnes']
    },
    {
      id: 'l1_careful',
      rootWord: 'care',
      targetSuffix: '-ful',
      combinedWord: 'careful',
      clue: 'Taking care; full of care',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['carefull', 'carful']
    },
    {
      id: 'l1_playful',
      rootWord: 'play',
      targetSuffix: '-ful',
      combinedWord: 'playful',
      clue: 'Full of play and fun',
      distractorSuffixes: ['-ment', '-ness', '-less', '-ly'],
      spellingDistractors: ['playfull', 'plaiful']
    },
    {
      id: 'l1_hopeless',
      rootWord: 'hope',
      targetSuffix: '-less',
      combinedWord: 'hopeless',
      clue: 'Without any hope',
      distractorSuffixes: ['-ment', '-ness', '-ly'],
      spellingDistractors: ['hopless', 'hopeles']
    },
    {
      id: 'l1_plainness',
      rootWord: 'plain',
      targetSuffix: '-ness',
      combinedWord: 'plainness',
      clue: 'Being plain and simple (keep both n letters!)',
      ruleNote: 'plain + -ness keeps both n letters: plainness',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['plainess', 'planeness']
    },
    {
      id: 'l1_badly',
      rootWord: 'bad',
      targetSuffix: '-ly',
      combinedWord: 'badly',
      clue: 'Done in a bad way',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['baddly', 'badley']
    },
    {
      id: 'l1_happiness',
      rootWord: 'happy',
      targetSuffix: '-ness',
      combinedWord: 'happiness',
      clue: 'The feeling of being happy (change y to i!)',
      ruleNote: 'Change y to i before adding -ness: happiness',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['happyness', 'hapiness']
    },
    {
      id: 'l1_employment',
      rootWord: 'employ',
      targetSuffix: '-ment',
      combinedWord: 'employment',
      clue: 'Having a paid job or work',
      distractorSuffixes: ['-ness', '-ful', '-less', '-ly'],
      spellingDistractors: ['emploiment', 'employmant']
    },
    {
      id: 'l1_darkness',
      rootWord: 'dark',
      targetSuffix: '-ness',
      combinedWord: 'darkness',
      clue: 'When there is no light',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['darknes', 'darckness']
    }
  ],
  rules: [
    {
      id: 'l1_rule_happiness',
      prompt: 'SPELL: happy + -ness = ?',
      correctAnswer: 'happiness',
      distractors: ['happyness', 'hapiness'],
      spokenWord: 'happiness',
      explanation: 'Swap the y for i before adding -ness!'
    },
    {
      id: 'l1_rule_plainness',
      prompt: 'SPELL: plain + -ness = ?',
      correctAnswer: 'plainness',
      distractors: ['plainess', 'planeness'],
      spokenWord: 'plainness',
      explanation: 'Keep the n in plain AND the n in -ness!'
    },
    {
      id: 'l1_rule_careful',
      prompt: 'SPELL: care + -ful = ?',
      correctAnswer: 'careful',
      distractors: ['carefull', 'carful'],
      spokenWord: 'careful',
      explanation: 'The suffix -ful only has ONE l at the end!'
    },
    {
      id: 'l1_rule_hopeless',
      prompt: 'Which suffix means "WITHOUT"?',
      correctAnswer: '-less',
      distractors: ['-ful', '-ment'],
      spokenWord: 'hopeless',
      explanation: '-less means without (like hopeless = without hope).'
    }
  ]
};
