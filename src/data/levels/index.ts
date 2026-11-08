import type { WordLevel } from '../types.ts';
import { level1 } from './level1.ts';
import { level2 } from './level2.ts';
import { level3 } from './level3.ts';
import { level4 } from './level4.ts';
import { level5 } from './level5.ts';

export const ALL_LEVELS: WordLevel[] = [
  level1,
  level2,
  level3,
  level4,
  level5
];

export function getDefaultLevel(): WordLevel {
  return level1;
}
