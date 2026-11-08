import Phaser from 'phaser';
import { ALL_LEVELS } from '../data/levels';

/**
 * Utility to generate pixel-perfect 8-bit arcade textures
 * entirely procedurally using Canvas API.
 */
export function createPixelArtTextures(scene: Phaser.Scene): void {
  const createFromGrid = (
    key: string,
    width: number,
    height: number,
    scale: number,
    renderFn: (ctx: CanvasRenderingContext2D) => void
  ) => {
    if (scene.textures.exists(key)) return;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.scale(scale, scale);
    renderFn(ctx);

    scene.textures.addCanvas(key, canvas);
  };

  const createPlayerLevelTextures = (
    levelId: string,
    badgeColor: string,
    accentColor?: string
  ) => {
    const drawBelt = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      knotX?: number,
      knotY?: number
    ) => {
      ctx.fillStyle = badgeColor;
      ctx.fillRect(x, y, w, h);
      if (accentColor) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(x, y + Math.floor(h / 3), w, Math.max(1, Math.floor(h / 3)));
      }
      if (knotX !== undefined && knotY !== undefined) {
        ctx.fillStyle = badgeColor;
        ctx.fillRect(knotX, knotY, 2, 4);
        if (accentColor) {
          ctx.fillStyle = accentColor;
          ctx.fillRect(knotX, knotY + 2, 2, 2);
        }
      }
    };

    // 1. Player Idle (for Menu preview)
    createFromGrid(`player_idle_${levelId}`, 24, 32, 2, (ctx) => {
      ctx.fillStyle = '#111';
      ctx.fillRect(8, 2, 8, 4);
      ctx.fillRect(7, 4, 2, 3);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(9, 6, 7, 5);
      ctx.fillStyle = '#111';
      ctx.fillRect(13, 7, 2, 2);

      // Headband matching level colour
      ctx.fillStyle = badgeColor;
      ctx.fillRect(8, 4, 8, 2);

      // White Runner Tunic
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(7, 11, 10, 8);

      // Dynamic Belt
      drawBelt(ctx, 7, 18, 10, 3, 11, 21);

      // Legs
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(7, 21, 4, 8);
      ctx.fillRect(13, 21, 4, 8);
      ctx.fillStyle = '#38bdf8'; // running shoes
      ctx.fillRect(7, 29, 5, 3);
      ctx.fillRect(13, 29, 5, 3);

      // Arms
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(14, 11, 4, 4);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(17, 12, 3, 3);
    });

    // 2. 2.5D Runner Back-View Run Frame 1 (Left stride)
    createFromGrid(`runner_run1_${levelId}`, 24, 32, 2, (ctx) => {
      ctx.fillStyle = '#14141c';
      ctx.fillRect(8, 2, 8, 7);
      // Colored headband + trailing ribbon
      ctx.fillStyle = badgeColor;
      ctx.fillRect(8, 4, 8, 2);
      ctx.fillRect(16, 5, 3, 2);

      ctx.fillStyle = '#f8c090';
      ctx.fillRect(7, 5, 1, 2);
      ctx.fillRect(16, 5, 1, 2);

      // Tunic Back
      ctx.fillStyle = '#f4f4f8';
      ctx.fillRect(6, 9, 12, 10);
      ctx.fillStyle = '#222230';
      ctx.fillRect(8, 9, 8, 1);
      ctx.fillStyle = '#dcdce6';
      ctx.fillRect(11, 10, 2, 8);

      // Arms swinging
      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(3, 9, 3, 6);
      ctx.fillRect(18, 12, 3, 6);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(3, 7, 3, 2);
      ctx.fillRect(18, 18, 3, 2);

      drawBelt(ctx, 6, 18, 12, 3, 14, 20);

      // Legs running
      ctx.fillStyle = '#dcdce6';
      ctx.fillRect(7, 21, 4, 8);
      ctx.fillRect(13, 21, 4, 5);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(7, 29, 4, 3);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(13, 25, 4, 3);
    });

    // 3. 2.5D Runner Back-View Run Frame 2 (Right stride)
    createFromGrid(`runner_run2_${levelId}`, 24, 32, 2, (ctx) => {
      ctx.fillStyle = '#14141c';
      ctx.fillRect(8, 3, 8, 7);
      ctx.fillStyle = badgeColor;
      ctx.fillRect(8, 5, 8, 2);
      ctx.fillRect(5, 6, 3, 2);

      ctx.fillStyle = '#f8c090';
      ctx.fillRect(7, 6, 1, 2);
      ctx.fillRect(16, 6, 1, 2);

      ctx.fillStyle = '#f4f4f8';
      ctx.fillRect(6, 10, 12, 9);
      ctx.fillStyle = '#222230';
      ctx.fillRect(8, 10, 8, 1);
      ctx.fillStyle = '#dcdce6';
      ctx.fillRect(11, 11, 2, 7);

      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(3, 12, 3, 6);
      ctx.fillRect(18, 9, 3, 6);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(3, 18, 3, 2);
      ctx.fillRect(18, 7, 3, 2);

      drawBelt(ctx, 6, 18, 12, 3, 9, 20);

      ctx.fillStyle = '#dcdce6';
      ctx.fillRect(7, 21, 4, 5);
      ctx.fillRect(13, 21, 4, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(7, 25, 4, 3);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 29, 4, 3);
    });

    // 4. 2.5D Runner Flying Kick / Gate Smash
    createFromGrid(`runner_kick_${levelId}`, 28, 32, 2, (ctx) => {
      ctx.fillStyle = '#14141c';
      ctx.fillRect(8, 2, 8, 6);
      ctx.fillStyle = badgeColor;
      ctx.fillRect(8, 4, 8, 2);

      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(7, 8, 11, 9);
      ctx.fillStyle = '#222230';
      ctx.fillRect(9, 8, 7, 1);

      ctx.fillStyle = '#e8e8f0';
      ctx.fillRect(2, 9, 5, 4);
      ctx.fillRect(18, 7, 5, 4);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(1, 9, 2, 3);
      ctx.fillRect(23, 6, 2, 3);

      drawBelt(ctx, 7, 16, 11, 3, 5, 18);

      ctx.fillStyle = '#dcdce6';
      ctx.fillRect(6, 19, 4, 6);
      ctx.fillRect(13, 12, 6, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(5, 25, 4, 3);
      ctx.fillStyle = '#ffe135';
      ctx.fillRect(18, 9, 5, 5);
    });

    // 5. 2.5D Runner Recoil / Stumble
    createFromGrid(`runner_hit_${levelId}`, 24, 32, 2, (ctx) => {
      ctx.fillStyle = '#14141c';
      ctx.fillRect(8, 5, 8, 6);
      ctx.fillStyle = '#f8f8f8';
      ctx.fillRect(5, 11, 14, 9);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(1, 8, 4, 4);
      ctx.fillRect(19, 8, 4, 4);
      drawBelt(ctx, 6, 19, 12, 3);
      ctx.fillStyle = '#dcdce6';
      ctx.fillRect(5, 22, 5, 7);
      ctx.fillRect(14, 22, 5, 7);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, 29, 5, 3);
      ctx.fillRect(15, 29, 5, 3);
    });
  };

  ALL_LEVELS.forEach(level => {
    createPlayerLevelTextures(level.id, level.badgeColor, level.accentColor);
  });

  createPlayerLevelTextures('', '#ffe135', '#00a859');

  // Menu preview companion / Word Guardian sprite
  createFromGrid('word_guardian', 24, 32, 2, (ctx) => {
    // Wizard / Scholar hat & robes holding a golden scroll
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(6, 1, 12, 3);
    ctx.fillRect(8, 0, 8, 2);
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(7, 4, 10, 1);

    ctx.fillStyle = '#f8c090';
    ctx.fillRect(8, 5, 8, 5);
    ctx.fillStyle = '#111';
    ctx.fillRect(9, 7, 2, 2);
    ctx.fillRect(13, 7, 2, 2);

    // Blue & Gold Robe
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(6, 10, 12, 11);
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(6, 18, 12, 2);
    ctx.fillRect(11, 10, 2, 11);

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(7, 21, 4, 8);
    ctx.fillRect(13, 21, 4, 8);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(6, 29, 5, 3);
    ctx.fillRect(13, 29, 5, 3);

    // Floating Word Scroll in hand
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(2, 11, 4, 6);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(1, 11, 6, 1);
    ctx.fillRect(1, 16, 6, 1);
  });

  // Retro Arcade Background (960x540 at scale 4)
  createFromGrid('dojang_bg', 240, 135, 4, (ctx) => {
    ctx.fillStyle = '#131836';
    ctx.fillRect(0, 0, 240, 95);

    // Bookshelf / Word Panels
    for (let x = 12; x < 230; x += 38) {
      ctx.fillStyle = '#1e2952';
      ctx.fillRect(x, 15, 28, 48);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x + 2, 19, 24, 2);
      ctx.fillStyle = '#ffe135';
      ctx.fillRect(x + 2, 33, 24, 2);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x + 2, 47, 24, 2);
    }

    // Columns
    for (let x = 0; x < 240; x += 76) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, 0, 10, 95);
      ctx.fillStyle = '#334155';
      ctx.fillRect(x + 2, 0, 6, 95);
    }

    // Top Beam
    ctx.fillStyle = '#090d1f';
    ctx.fillRect(0, 0, 240, 12);
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(0, 11, 240, 1);

    // Track Floor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 95, 240, 40);

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 95, 240, 2);
    ctx.fillRect(0, 105, 240, 1);
    ctx.fillRect(0, 117, 240, 2);
    ctx.fillRect(0, 131, 240, 2);
  });

  createFromGrid('dojang_bg_hard', 240, 135, 4, (ctx) => {
    ctx.fillStyle = '#2a0f1d';
    ctx.fillRect(0, 0, 240, 95);

    for (let x = 12; x < 230; x += 38) {
      ctx.fillStyle = '#4c1127';
      ctx.fillRect(x, 15, 28, 48);

      ctx.fillStyle = '#ff4444';
      ctx.fillRect(x + 2, 19, 24, 2);
      ctx.fillStyle = '#ff9900';
      ctx.fillRect(x + 2, 33, 24, 2);
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(x + 2, 47, 24, 2);
    }

    for (let x = 0; x < 240; x += 76) {
      ctx.fillStyle = '#1f0812';
      ctx.fillRect(x, 0, 10, 95);
      ctx.fillStyle = '#4a1525';
      ctx.fillRect(x + 2, 0, 6, 95);
    }

    ctx.fillStyle = '#1a050d';
    ctx.fillRect(0, 0, 240, 12);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(0, 11, 240, 1);

    ctx.fillStyle = '#3b121e';
    ctx.fillRect(0, 95, 240, 40);
  });

  // Heart Icons (48x48 at scale 4)
  const renderHeartFull = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#ff2a2a';
    ctx.fillRect(2, 2, 3, 3);
    ctx.fillRect(7, 2, 3, 3);
    ctx.fillRect(1, 4, 10, 3);
    ctx.fillRect(2, 7, 8, 2);
    ctx.fillRect(3, 9, 6, 1);
    ctx.fillRect(4, 10, 4, 1);
    ctx.fillRect(5, 11, 2, 1);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 3, 1, 2);
  };
  createFromGrid('heart', 12, 12, 4, renderHeartFull);
  createFromGrid('heart_full', 12, 12, 4, renderHeartFull);

  createFromGrid('heart_empty', 12, 12, 4, (ctx) => {
    ctx.fillStyle = '#555';
    ctx.fillRect(2, 2, 3, 1);
    ctx.fillRect(7, 2, 3, 1);
    ctx.fillRect(1, 3, 1, 4);
    ctx.fillRect(10, 3, 1, 4);
    ctx.fillRect(2, 7, 1, 2);
    ctx.fillRect(9, 7, 1, 2);
    ctx.fillRect(3, 9, 1, 1);
    ctx.fillRect(8, 9, 1, 1);
    ctx.fillRect(4, 10, 1, 1);
    ctx.fillRect(7, 10, 1, 1);
    ctx.fillRect(5, 11, 2, 1);
  });
}
