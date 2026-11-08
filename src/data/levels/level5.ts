import type { WordLevel } from '../types.ts';

export const level5: WordLevel = {
  id: 'level5',
  levelNumber: 5,
  title: 'Level 5: -er, -est, -ing & -ed',
  subtitle: 'Comparing & Action Word Endings',
  badgeColor: '#f43f5e',
  accentColor: '#ffe135',
  suffixPool: ['-er', '-est', '-ing', '-ed', '-ful', '-less'],
  words: [
    {
      id: 'l5_faster',
      rootWord: 'fast',
      targetSuffix: '-er',
      combinedWord: 'faster',
      clue: 'More fast than something else',
      distractorSuffixes: ['-ing', '-ed', '-ful', '-less'],
      spellingDistractors: ['fastter', 'fastor']
    },
    {
      id: 'l5_tallest',
      rootWord: 'tall',
      targetSuffix: '-est',
      combinedWord: 'tallest',
      clue: 'The most tall of all',
      distractorSuffixes: ['-ing', '-ed', '-ful', '-less'],
      spellingDistractors: ['talest', 'tallist']
    },
    {
      id: 'l5_jumping',
      rootWord: 'jump',
      targetSuffix: '-ing',
      combinedWord: 'jumping',
      clue: 'Leaping up into the air right now',
      distractorSuffixes: ['-est', '-ful', '-less'],
      spellingDistractors: ['jumpping', 'jumpin']
    },
    {
      id: 'l5_walked',
      rootWord: 'walk',
      targetSuffix: '-ed',
      combinedWord: 'walked',
      clue: 'Went for a walk in the past',
      distractorSuffixes: ['-est', '-ful', '-less'],
      spellingDistractors: ['walkt', 'wallked']
    },
    {
      id: 'l5_teacher',
      rootWord: 'teach',
      targetSuffix: '-er',
      combinedWord: 'teacher',
      clue: 'A person who teaches a class',
      distractorSuffixes: ['-est', '-ed', '-ful', '-less'],
      spellingDistractors: ['teachor', 'techer']
    },
    {
      id: 'l5_brightest',
      rootWord: 'bright',
      targetSuffix: '-est',
      combinedWord: 'brightest',
      clue: 'Shining the most brightly of all',
      distractorSuffixes: ['-ing', '-ed', '-ful', '-less'],
      spellingDistractors: ['britest', 'brightist']
    },
    {
      id: 'l5_singing',
      rootWord: 'sing',
      targetSuffix: '-ing',
      combinedWord: 'singing',
      clue: 'Making music with your voice right now',
      distractorSuffixes: ['-ed', '-est', '-ful', '-less'],
      spellingDistractors: ['singging', 'singin']
    },
    {
      id: 'l5_shouted',
      rootWord: 'shout',
      targetSuffix: '-ed',
      combinedWord: 'shouted',
      clue: 'Called out in a loud voice in the past',
      distractorSuffixes: ['-er', '-est', '-ful', '-less'],
      spellingDistractors: ['shoutted', 'showted']
    },
    {
      id: 'l5_builder',
      rootWord: 'build',
      targetSuffix: '-er',
      combinedWord: 'builder',
      clue: 'A person whose job is building things',
      distractorSuffixes: ['-est', '-ed', '-ful', '-less'],
      spellingDistractors: ['bildor', 'buildor']
    },
    {
      id: 'l5_oldest',
      rootWord: 'old',
      targetSuffix: '-est',
      combinedWord: 'oldest',
      clue: 'Having the most years of all',
      distractorSuffixes: ['-ing', '-ed', '-ful', '-less'],
      spellingDistractors: ['oldist', 'olldest']
    }
  ],
  rules: [
    {
      id: 'l5_rule_est',
      prompt: 'Which suffix means "THE MOST" (like tallest)?',
      correctAnswer: '-est',
      distractors: ['-er', '-ing'],
      spokenWord: 'tallest',
      explanation: '-est compares three or more things (tall, taller, tallest).'
    },
    {
      id: 'l5_rule_teacher',
      prompt: 'SPELL: teach + -er = ?',
      correctAnswer: 'teacher',
      distractors: ['teachor', 'techer'],
      spokenWord: 'teacher',
      explanation: 'Add -er to a verb to make the person who does it!'
    }
  ]
};
