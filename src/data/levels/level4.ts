import type { WordLevel } from '../types.ts';

export const level4: WordLevel = {
  id: 'level4',
  levelNumber: 4,
  title: 'Level 4: Tricky Y-to-I Rule',
  subtitle: 'Swap Y to I before adding the suffix!',
  badgeColor: '#a855f7',
  accentColor: '#f43f5e',
  suffixPool: ['-ment', '-ness', '-ful', '-less', '-ly'],
  words: [
    {
      id: 'l4_happily',
      rootWord: 'happy',
      targetSuffix: '-ly',
      combinedWord: 'happily',
      clue: 'In a happy way (change y to i!)',
      ruleNote: 'happy -> happi + -ly = happily',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['happyly', 'hapily']
    },
    {
      id: 'l4_merriment',
      rootWord: 'merry',
      targetSuffix: '-ment',
      combinedWord: 'merriment',
      clue: 'Fun, laughter, and celebration',
      ruleNote: 'merry -> merri + -ment = merriment',
      distractorSuffixes: ['-ful', '-less', '-ness'],
      spellingDistractors: ['merryment', 'meriment']
    },
    {
      id: 'l4_plentiful',
      rootWord: 'plenty',
      targetSuffix: '-ful',
      combinedWord: 'plentiful',
      clue: 'More than enough; lots of something',
      ruleNote: 'plenty -> plenti + -ful = plentiful',
      distractorSuffixes: ['-ment', '-ness', '-less', '-ly'],
      spellingDistractors: ['plentyful', 'plentifull']
    },
    {
      id: 'l4_penniless',
      rootWord: 'penny',
      targetSuffix: '-less',
      combinedWord: 'penniless',
      clue: 'Having no pennies or money at all',
      ruleNote: 'penny -> penni + -less = penniless',
      distractorSuffixes: ['-ment', '-ness', '-ful', '-ly'],
      spellingDistractors: ['pennyless', 'peniless']
    },
    {
      id: 'l4_angrily',
      rootWord: 'angry',
      targetSuffix: '-ly',
      combinedWord: 'angrily',
      clue: 'Done in an angry way',
      ruleNote: 'angry -> angri + -ly = angrily',
      distractorSuffixes: ['-ment', '-ness', '-ful', '-less'],
      spellingDistractors: ['angryly', 'angrley']
    },
    {
      id: 'l4_laziness',
      rootWord: 'lazy',
      targetSuffix: '-ness',
      combinedWord: 'laziness',
      clue: 'Not wanting to work or be active',
      ruleNote: 'lazy -> lazi + -ness = laziness',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['lazyness', 'lazynes']
    },
    {
      id: 'l4_beautiful',
      rootWord: 'beauty',
      targetSuffix: '-ful',
      combinedWord: 'beautiful',
      clue: 'Full of beauty; lovely to see',
      ruleNote: 'beauty -> beauti + -ful = beautiful',
      distractorSuffixes: ['-ment', '-ness', '-less', '-ly'],
      spellingDistractors: ['beautyful', 'beautifull']
    },
    {
      id: 'l4_silliness',
      rootWord: 'silly',
      targetSuffix: '-ness',
      combinedWord: 'silliness',
      clue: 'Being silly and goofy',
      ruleNote: 'silly -> silli + -ness = silliness',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['sillyness', 'siliness']
    },
    {
      id: 'l4_easily',
      rootWord: 'easy',
      targetSuffix: '-ly',
      combinedWord: 'easily',
      clue: 'Without any trouble; in an easy way',
      ruleNote: 'easy -> easi + -ly = easily',
      distractorSuffixes: ['-ment', '-ful', '-less'],
      spellingDistractors: ['easyly', 'easley']
    },
    {
      id: 'l4_luckily',
      rootWord: 'lucky',
      targetSuffix: '-ly',
      combinedWord: 'luckily',
      clue: 'By good luck!',
      ruleNote: 'lucky -> lucki + -ly = luckily',
      distractorSuffixes: ['-ment', '-ness', '-ful', '-less'],
      spellingDistractors: ['luckyly', 'luckley']
    }
  ],
  rules: [
    {
      id: 'l4_rule_merriment',
      prompt: 'SPELL: merry + -ment = ?',
      correctAnswer: 'merriment',
      distractors: ['merryment', 'meriment'],
      spokenWord: 'merriment',
      explanation: 'Change the y in merry to i before adding -ment!'
    },
    {
      id: 'l4_rule_penniless',
      prompt: 'SPELL: penny + -less = ?',
      correctAnswer: 'penniless',
      distractors: ['pennyless', 'peniless'],
      spokenWord: 'penniless',
      explanation: 'Change the y in penny to i before adding -less!'
    }
  ]
};
