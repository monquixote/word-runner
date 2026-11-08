import Phaser from 'phaser';
import { ALL_LEVELS } from '../data/levels';

/**
 * Utility to generate pixel-perfect 8-bit construction & bulldozer arcade textures
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

  const createBulldozerLevelTextures = (
    levelId: string,
    badgeColor: string,
    accentColor?: string
  ) => {
    const stripeColor = accentColor || '#111827';

    // 1. Bulldozer Side/3-4 Profile (for Main Menu preview)
    createFromGrid(`player_idle_${levelId}`, 36, 28, 2, (ctx) => {
      // Exhaust smoke puffs
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(19, 1, 3, 2);
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(16, 0, 2, 2);

      // Exhaust stack pipe
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(21, 3, 2, 8);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(20, 3, 2, 1);

      // ROPS Operator Cab Roof & Beacon
      ctx.fillStyle = badgeColor;
      ctx.fillRect(10, 2, 3, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 2, 1, 1);

      // Cab Roof (Construction Yellow)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(6, 4, 11, 2);

      // Cab Pillars & Tinted Glass
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(6, 6, 2, 6);
      ctx.fillRect(15, 6, 2, 6);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(8, 6, 7, 5);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(13, 6, 2, 4);

      // Operator Hard Hat inside cab
      ctx.fillStyle = badgeColor;
      ctx.fillRect(10, 7, 3, 2);
      ctx.fillStyle = '#f8c090';
      ctx.fillRect(10, 9, 3, 2);

      // Bulldozer Main Engine Chassis
      ctx.fillStyle = '#d97706';
      ctx.fillRect(4, 11, 22, 9);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(5, 11, 20, 7);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(6, 11, 19, 2);

      // Engine Radiator Grille slots
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(18, 13, 6, 4);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(19, 14, 4, 1);
      ctx.fillRect(19, 16, 4, 1);

      // Level-custom Livery Stripe on Chassis
      ctx.fillStyle = badgeColor;
      ctx.fillRect(6, 15, 11, 3);
      ctx.fillStyle = stripeColor;
      ctx.fillRect(6, 16, 11, 1);

      // Heavy Hydraulic Push Arm & Piston
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(18, 18, 11, 3);
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(22, 14, 7, 2);

      // Caterpillar Track Frame & Treads
      ctx.fillStyle = '#111827';
      ctx.fillRect(3, 19, 23, 8);
      ctx.fillStyle = '#374151';
      ctx.fillRect(4, 20, 21, 6);

      // Track Cleats (top & bottom teeth)
      ctx.fillStyle = '#111827';
      for (let tx = 4; tx <= 24; tx += 3) {
        ctx.fillRect(tx, 18, 2, 1);
        ctx.fillRect(tx, 27, 2, 1);
      }

      // Steel Drive Sprockets & Rollers
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(5, 21, 4, 4);
      ctx.fillRect(11, 22, 3, 3);
      ctx.fillRect(16, 22, 3, 3);
      ctx.fillRect(20, 21, 4, 4);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(6, 22, 2, 2);
      ctx.fillRect(21, 22, 2, 2);

      // Massive Curved Steel Front Dozer Blade
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(28, 9, 4, 18);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(30, 9, 3, 18);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(32, 10, 2, 16);
      ctx.fillRect(33, 23, 2, 4);

      // Hazard Top Bar on Dozer Blade
      ctx.fillStyle = '#ffe135';
      ctx.fillRect(28, 8, 5, 2);
      ctx.fillStyle = '#111827';
      ctx.fillRect(29, 8, 2, 2);
      ctx.fillRect(32, 8, 1, 2);
    });

    // Helper to draw the 2.5D Rear-View Bulldozer for RunnerScene
    const drawRearBulldozer = (
      ctx: CanvasRenderingContext2D,
      treadPhase: number,
      mode: 'run' | 'ram' | 'hit'
    ) => {
      // 1. Exhaust Smoke or Turbo Flames
      if (mode === 'ram') {
        // Twin turbo diesel flames!
        ctx.fillStyle = '#ff4500';
        ctx.fillRect(8, 0, 4, 5);
        ctx.fillRect(24, 0, 4, 5);
        ctx.fillStyle = '#ffe135';
        ctx.fillRect(9, 1, 2, 4);
        ctx.fillRect(25, 1, 2, 4);
      } else if (mode === 'hit') {
        // Dark clank smoke
        ctx.fillStyle = '#374151';
        ctx.fillRect(23, 0, 5, 3);
        ctx.fillRect(9, 1, 4, 3);
      } else {
        // Normal chugging diesel smoke puff
        ctx.fillStyle = treadPhase === 0 ? '#9ca3af' : '#d1d5db';
        ctx.fillRect(24, treadPhase === 0 ? 0 : 1, 4, 3);
      }

      // 2. Massive Front Dozer Blade Wings (visible extending past both sides of the hull)
      const bladeY = mode === 'ram' ? 13 : 16;
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(1, bladeY, 34, 11);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(1, bladeY + 1, 5, 9);
      ctx.fillRect(30, bladeY + 1, 5, 9);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(0, bladeY + 2, 2, 7);
      ctx.fillRect(34, bladeY + 2, 2, 7);

      // Yellow/Black Hazard Striping along top of outer blade wings
      ctx.fillStyle = '#ffe135';
      ctx.fillRect(1, bladeY, 6, 2);
      ctx.fillRect(29, bladeY, 6, 2);
      ctx.fillStyle = '#111827';
      ctx.fillRect(2, bladeY, 2, 2);
      ctx.fillRect(5, bladeY, 2, 2);
      ctx.fillRect(30, bladeY, 2, 2);
      ctx.fillRect(33, bladeY, 2, 2);

      // Bright impact sparks on blade tips during ram!
      if (mode === 'ram') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, bladeY - 2, 3, 3);
        ctx.fillRect(33, bladeY - 2, 3, 3);
        ctx.fillStyle = '#ffe135';
        ctx.fillRect(2, bladeY - 3, 3, 2);
        ctx.fillRect(31, bladeY - 3, 3, 2);
      }

      // 3. Left & Right Heavy Caterpillar Tracks
      const leftTrackX = 4;
      const rightTrackX = 25;
      ctx.fillStyle = '#111827';
      ctx.fillRect(leftTrackX, 18, 7, 13);
      ctx.fillRect(rightTrackX, 18, 7, 13);

      ctx.fillStyle = '#374151';
      ctx.fillRect(leftTrackX + 1, 19, 5, 11);
      ctx.fillRect(rightTrackX + 1, 19, 5, 11);

      // Animated Tread Cleats (alternate with treadPhase to roll forward!)
      ctx.fillStyle = '#111827';
      for (let ty = 19 + treadPhase * 2; ty <= 29; ty += 3) {
        ctx.fillRect(leftTrackX, ty, 7, 1);
        ctx.fillRect(rightTrackX, ty, 7, 1);
      }
      ctx.fillStyle = '#6b7280';
      for (let ty = 20 + treadPhase * 2; ty <= 28; ty += 3) {
        ctx.fillRect(leftTrackX + 1, ty, 5, 1);
        ctx.fillRect(rightTrackX + 1, ty, 5, 1);
      }

      // 4. Exhaust Stacks
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(25, 4, 2, 10);
      if (mode === 'ram') {
        ctx.fillRect(9, 4, 2, 10);
      }

      // 5. Upper ROPS Operator Cab (Rear View)
      ctx.fillStyle = mode === 'hit' ? '#ef4444' : badgeColor;
      ctx.fillRect(16, 2, 4, 2); // Roof Beacon
      if (mode === 'ram') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(17, 2, 2, 1);
      }

      // Cab Roof
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(11, 4, 14, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(10, 5, 16, 1);

      // Cab Frame & Rear Window
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(11, 6, 14, 8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 7, 10, 6);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(13, 7, 10, 1);

      // Operator Silhouette with Hard Hat inside Rear Window
      ctx.fillStyle = badgeColor;
      ctx.fillRect(16, 8, 4, 2);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(15, 10, 6, 3);

      // 6. Main Rear Engine Hull / Chassis
      ctx.fillStyle = '#d97706';
      ctx.fillRect(9, 13, 18, 14);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(10, 13, 16, 12);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(10, 13, 16, 2);

      // Rear Radiator Grille & Engine Louvers
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(13, 15, 10, 7);
      ctx.fillStyle = '#374151';
      ctx.fillRect(14, 16, 8, 1);
      ctx.fillRect(14, 18, 8, 1);
      ctx.fillRect(14, 20, 8, 1);

      // Level Livery Band across Rear Bumper
      ctx.fillStyle = badgeColor;
      ctx.fillRect(10, 23, 16, 3);
      ctx.fillStyle = stripeColor;
      ctx.fillRect(10, 24, 16, 1);

      // Twin Tail Lights / Hazard Lights
      ctx.fillStyle = mode === 'ram' ? '#ffe135' : '#ef4444';
      ctx.fillRect(10, 16, 2, 3);
      ctx.fillRect(24, 16, 2, 3);

      // Heavy Steel Rear Ripper / Hitch Assembly
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(14, 26, 8, 3);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(15, 27, 2, 4);
      ctx.fillRect(19, 27, 2, 4);
    };

    // 2. 2.5D Bulldozer Driving Frame 1
    createFromGrid(`runner_run1_${levelId}`, 36, 32, 2, (ctx) => {
      drawRearBulldozer(ctx, 0, 'run');
    });

    // 3. 2.5D Bulldozer Driving Frame 2
    createFromGrid(`runner_run2_${levelId}`, 36, 32, 2, (ctx) => {
      drawRearBulldozer(ctx, 1, 'run');
    });

    // 4. 2.5D Bulldozer Full-Throttle Ram / Wall Smash
    createFromGrid(`runner_kick_${levelId}`, 36, 32, 2, (ctx) => {
      drawRearBulldozer(ctx, 0, 'ram');
    });

    // 5. 2.5D Bulldozer Recoil / Clank
    createFromGrid(`runner_hit_${levelId}`, 36, 32, 2, (ctx) => {
      drawRearBulldozer(ctx, 1, 'hit');
    });
  };

  ALL_LEVELS.forEach(level => {
    createBulldozerLevelTextures(level.id, level.badgeColor, level.accentColor);
  });

  createBulldozerLevelTextures('', '#ffe135', '#00a859');

  // Menu preview companion: Site Foreman with Hard Hat, Blueprints & Brick Stack
  createFromGrid('word_guardian', 32, 32, 2, (ctx) => {
    // Partially built Red Brick Column on the right side (`x=21..30, y=16..31`)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(21, 18, 10, 14);
    ctx.fillStyle = '#dc2626';
    // Stepped bricks on top
    ctx.fillRect(21, 15, 6, 3);
    ctx.fillRect(24, 12, 6, 3);
    // Mortar lines
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(21, 18, 10, 1);
    ctx.fillRect(21, 22, 10, 1);
    ctx.fillRect(21, 26, 10, 1);
    ctx.fillRect(21, 30, 10, 1);
    ctx.fillRect(25, 19, 1, 3);
    ctx.fillRect(27, 23, 1, 3);
    ctx.fillRect(24, 27, 1, 3);

    // Yellow Safety Hard Hat
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(7, 2, 10, 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(6, 5, 12, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 3, 4, 1);

    // Face & Safety Goggles
    ctx.fillStyle = '#f8c090';
    ctx.fillRect(8, 7, 8, 5);
    ctx.fillStyle = '#111827';
    ctx.fillRect(8, 8, 3, 2);
    ctx.fillRect(13, 8, 3, 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(9, 8, 1, 1);
    ctx.fillRect(14, 8, 1, 1);

    // High-Vis Orange Construction Vest & Reflective Stripes
    ctx.fillStyle = '#1d4ed8'; // Work shirt sleeves
    ctx.fillRect(5, 12, 14, 10);
    ctx.fillStyle = '#f97316'; // High-vis vest
    ctx.fillRect(7, 12, 10, 10);
    ctx.fillStyle = '#fde047'; // Reflective safety stripes
    ctx.fillRect(8, 12, 2, 10);
    ctx.fillRect(14, 12, 2, 10);
    ctx.fillRect(7, 18, 10, 2);

    // Tool Belt & Work Boots
    ctx.fillStyle = '#451a03';
    ctx.fillRect(7, 21, 10, 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(11, 21, 2, 2);

    // Denim Work Jeans & Steel-Toe Boots
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(8, 23, 4, 6);
    ctx.fillRect(13, 23, 4, 6);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(7, 29, 5, 3);
    ctx.fillRect(13, 29, 5, 3);

    // Rolled Blue Site Blueprint in Left Hand
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(1, 11, 5, 8);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(2, 12, 3, 6);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(2, 14, 3, 1);
    ctx.fillRect(2, 16, 2, 1);
  });

  // Helper to draw the 8-bit Building Site Panorama Background (960x540 at scale 4)
  const drawConstructionSiteBg = (ctx: CanvasRenderingContext2D, isHard: boolean) => {
    // 1. Sky Gradient Bands
    ctx.fillStyle = isHard ? '#16070b' : '#0f172a';
    ctx.fillRect(0, 0, 240, 32);
    ctx.fillStyle = isHard ? '#2b0b12' : '#1e293b';
    ctx.fillRect(0, 32, 240, 30);
    ctx.fillStyle = isHard ? '#4c111b' : '#334155';
    ctx.fillRect(0, 62, 240, 26);

    // Warm industrial horizon band
    ctx.fillStyle = isHard ? '#7f1d1d' : '#78350f';
    ctx.fillRect(0, 82, 240, 6);

    // 2. Pixel Clouds
    ctx.fillStyle = isHard ? '#3f151f' : '#475569';
    ctx.fillRect(24, 16, 28, 5);
    ctx.fillRect(28, 13, 18, 3);
    ctx.fillRect(135, 20, 34, 5);
    ctx.fillRect(142, 17, 20, 3);

    // 3. Left & Right Giant Tower Cranes
    const craneColor = isHard ? '#ef4444' : '#f59e0b';
    const craneDark = isHard ? '#991b1b' : '#b45309';

    // Left Tower Crane (Mast at x=34, Jib y=12)
    ctx.fillStyle = craneDark;
    ctx.fillRect(34, 8, 6, 80);
    ctx.fillStyle = craneColor;
    for (let y = 10; y < 86; y += 6) {
      ctx.fillRect(35, y, 4, 2);
    }
    // Horizontal Jib & Counter-jib
    ctx.fillStyle = craneColor;
    ctx.fillRect(14, 10, 78, 3);
    ctx.fillStyle = craneDark;
    ctx.fillRect(14, 13, 78, 1);
    // Counterweight blocks
    ctx.fillStyle = '#475569';
    ctx.fillRect(16, 13, 8, 6);
    // Operator Cab
    ctx.fillStyle = '#fde047';
    ctx.fillRect(33, 14, 8, 5);
    // Hanging Hook Cable & Suspended Steel Girder
    ctx.fillStyle = '#9ca3af';
    ctx.fillRect(76, 14, 1, 22);
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(74, 35, 5, 3);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(64, 38, 24, 4);

    // Right Tower Crane (Mast at x=198, Jib y=18)
    ctx.fillStyle = craneDark;
    ctx.fillRect(198, 14, 6, 74);
    ctx.fillStyle = craneColor;
    for (let y = 16; y < 86; y += 6) {
      ctx.fillRect(199, y, 4, 2);
    }
    ctx.fillStyle = craneColor;
    ctx.fillRect(146, 16, 76, 3);
    ctx.fillStyle = '#475569';
    ctx.fillRect(212, 19, 8, 6);

    // 4. Unfinished Steel Girder Skeletons & Midground Brick Walls
    for (let x = 8; x < 230; x += 56) {
      // Steel I-beam columns
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(x, 46, 4, 42);
      ctx.fillRect(x + 28, 46, 4, 42);
      ctx.fillRect(x, 46, 32, 3);
      ctx.fillRect(x, 64, 32, 3);

      // Half-built brick wall section between girders
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(x + 4, 67, 24, 21);
      ctx.fillStyle = '#b91c1c';
      for (let by = 68; by < 86; by += 4) {
        ctx.fillRect(x + 5, by, 10, 2);
        ctx.fillRect(x + 17, by, 10, 2);
      }
    }

    // 5. Continuous Yellow & Black Diagonal Hazard Fence along Horizon (y=86..91)
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(0, 86, 240, 5);
    ctx.fillStyle = '#111827';
    for (let hx = 0; hx < 240; hx += 8) {
      ctx.fillRect(hx, 86, 4, 2);
      ctx.fillRect(hx + 2, 88, 4, 3);
    }

    // 6. Compacted Dirt & Gravel Construction Site Ground (y=91..135)
    ctx.fillStyle = isHard ? '#231215' : '#29221e';
    ctx.fillRect(0, 91, 240, 44);

    // Bulldozer Tread / Tire Tracks & Gravel Texture
    ctx.fillStyle = isHard ? '#34191e' : '#382f29';
    ctx.fillRect(0, 98, 240, 5);
    ctx.fillRect(0, 114, 240, 6);

    ctx.fillStyle = isHard ? '#16090c' : '#1c1714';
    for (let gx = 4; gx < 236; gx += 12) {
      ctx.fillRect(gx, 99, 4, 3);
      ctx.fillRect(gx + 6, 115, 4, 4);
      ctx.fillRect(gx + 2, 127, 5, 2);
    }
  };

  // Normal Building Site Background
  createFromGrid('dojang_bg', 240, 135, 4, (ctx) => {
    drawConstructionSiteBg(ctx, false);
  });

  // Hard Mode / Demolition Night Shift Background
  createFromGrid('dojang_bg_hard', 240, 135, 4, (ctx) => {
    drawConstructionSiteBg(ctx, true);
  });

  // Crisp Heart Health Icons (48x48 at scale 4)
  const heartGrid = [
    '  xxx   xxx  ',
    ' xxxxx xxxxx ',
    'xxxxxxxxxxxxx',
    'xxxxxxxxxxxxx',
    'xxxxxxxxxxxxx',
    ' xxxxxxxxxxx ',
    '  xxxxxxxxx  ',
    '   xxxxxxx   ',
    '    xxxxx    ',
    '     xxx     ',
    '      x      '
  ];

  createFromGrid('heart_full', 13, 11, 4, (ctx) => {
    heartGrid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'x') {
          ctx.fillStyle = (x < 4 && y < 4) ? '#ff8888' : '#e61919';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
  });

  createFromGrid('heart_empty', 13, 11, 4, (ctx) => {
    heartGrid.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === 'x') {
          ctx.fillStyle = '#333344';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });
  });

  // Hit Spark Effect
  createFromGrid('hit_spark', 16, 16, 2, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 4, 4);
    ctx.fillStyle = '#ffe135';
    ctx.fillRect(7, 1, 2, 14);
    ctx.fillRect(1, 7, 14, 2);
    ctx.fillStyle = '#ff5500';
    ctx.fillRect(3, 3, 2, 2);
    ctx.fillRect(11, 3, 2, 2);
    ctx.fillRect(3, 11, 2, 2);
    ctx.fillRect(11, 11, 2, 2);
  });
}
