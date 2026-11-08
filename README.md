# 🏃 Word Runner: 8-Bit Suffix Challenge

An 8-bit 2.5D infinite runner game built with **Phaser 3** and **TypeScript** that teaches English root words, suffixes (`-ment`, `-ness`, `-ful`, `-less`, `-ly`, `-er`, `-est`, `-ing`, `-ed`), and spelling rules.

## 🎮 How It Works

1. **Root Word Prompt**: A root word (e.g. `ENJOY`, `HAPPY`, `CARE`, `PLAIN`) and meaning clue appear on the overhead banner and are spoken aloud via native British English speech synthesis.
2. **3-Lane Suffix Gates**: Three lanes approach with different suffixes (e.g. `-ment`, `-ness`, `-ful`).
3. **Select & Smash**: Steer into the lane with the matching suffix (or tap/press `SPACE`/`UP` to turbo-dash) to form the complete word (`enjoyment`, `happiness`, `careful`, `plainness`).
4. **Spaced Repetition & Mistake Review**: Missed words are reviewed at the end of the run with audio playback and a **RETRY MISSED** button.

## 📚 Word Sheets Included

- **Level 1: Core Suffix Sheet** (`enjoyment`, `sadness`, `careful`, `playful`, `hopeless`, `plainness`, `badly`, `happiness`, `employment`, `darkness`)
- **Level 2: `-ful` & `-less` Builders** (`helpful`, `fearless`, `thankful`, `harmless`, `colourful`, `restless`, `painful`, `endless`, `useful`, `powerless`)
- **Level 3: `-ment`, `-ness` & `-ly`** (`movement`, `treatment`, `payment`, `kindness`, `illness`, `fitness`, `quickly`, `slowly`, `loudly`, `gladly`)
- **Level 4: Tricky `Y`-to-`I` Rule** (`happily`, `merriment`, `plentiful`, `penniless`, `angrily`, `laziness`, `beautiful`, `silliness`, `easily`, `luckily`)
- **Level 5: `-er`, `-est`, `-ing` & `-ed`** (`faster`, `tallest`, `jumping`, `walked`, `teacher`, `brightest`, `singing`, `shouted`, `builder`, `oldest`)

## 🚀 Development

```bash
cd word-runner
npm run dev      # Start dev server on http://localhost:3001
npm test         # Run unit tests
npm run build    # Type-check and build production bundle
```
