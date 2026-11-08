import { ALL_LEVELS, getDefaultLevel } from '../src/data/levels/index.ts';
import { buildEncounterDeck } from '../src/utils/deckBuilder.ts';
import { loadPlayerStats } from '../src/data/progress.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('--- Testing Word Runner Suffix Levels & Deck Builder ---');

// 1. Verify all 5 levels exist
assert(ALL_LEVELS.length === 5, `Expected 5 levels, found ${ALL_LEVELS.length}`);
assert(getDefaultLevel().id === 'level1', 'Default level should be level1 (Core Suffix Sheet)');
console.log('✓ All 5 levels registered');

// 2. Verify Level 1 matches the exact 10 words from the school suffix sheet
const level1 = ALL_LEVELS[0];
const expectedSheetWords = [
  { root: 'enjoy', suffix: '-ment', combined: 'enjoyment' },
  { root: 'sad', suffix: '-ness', combined: 'sadness' },
  { root: 'care', suffix: '-ful', combined: 'careful' },
  { root: 'play', suffix: '-ful', combined: 'playful' },
  { root: 'hope', suffix: '-less', combined: 'hopeless' },
  { root: 'plain', suffix: '-ness', combined: 'plainness' },
  { root: 'bad', suffix: '-ly', combined: 'badly' },
  { root: 'happy', suffix: '-ness', combined: 'happiness' },
  { root: 'employ', suffix: '-ment', combined: 'employment' },
  { root: 'dark', suffix: '-ness', combined: 'darkness' }
];

assert(level1.words.length === 10, `Level 1 should have 10 words, found ${level1.words.length}`);
for (const expected of expectedSheetWords) {
  const match = level1.words.find(w => w.combinedWord === expected.combined);
  assert(Boolean(match), `Missing sheet word: ${expected.combined}`);
  assert(match!.rootWord === expected.root, `Root word mismatch for ${expected.combined}`);
  assert(match!.targetSuffix === expected.suffix, `Suffix mismatch for ${expected.combined}`);
}
console.log('✓ Level 1 matches all 10 school suffix sheet words');

// 3. Verify data integrity across all levels
for (const lvl of ALL_LEVELS) {
  assert(lvl.words.length === 10, `${lvl.id} should have 10 words`);
  for (const w of lvl.words) {
    assert(w.distractorSuffixes.length >= 2, `${w.id} needs at least 2 distractor suffixes`);
    assert(!w.distractorSuffixes.includes(w.targetSuffix), `${w.id} distractorSuffixes must not contain targetSuffix`);
    assert(w.spellingDistractors.length === 2, `${w.id} needs 2 spelling distractors`);
    assert(!w.spellingDistractors.includes(w.combinedWord), `${w.id} spellingDistractors must not contain combinedWord`);
  }
}
console.log('✓ Distractor integrity verified across all 50 words');

// 4. Verify Deck Builder produces 10 unique cards in suffix mode
const stats = loadPlayerStats();
const { deck } = buildEncounterDeck({
  level: level1,
  isCumulativeExam: false,
  quizMode: 'suffix',
  totalEncounters: 10,
  stats
});

assert(deck.length === 10, `Expected 10 cards in deck, got ${deck.length}`);
const uniqueWordIds = new Set(deck.map(c => c.word?.id));
assert(uniqueWordIds.size === 10, `Expected 10 unique words in 10-wave round, got ${uniqueWordIds.size}`);
console.log('✓ Deck builder verified (zero duplicate questions in a 10-word round)');
console.log('ALL TESTS PASSED!');
