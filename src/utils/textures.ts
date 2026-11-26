import Phaser from 'phaser';
import { mulberry32 } from './rng';
import { JOBS } from '../data/portfolio';
import { PAINTING_H, PAINTING_W } from '../objects/Painting';

function newGfx(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
    return scene.make.graphics({ x: 0, y: 0 }, false);
}

/** Soft radial light used for glows, lamps and particles (use with ADD blend). */
export function ensureGlowTexture(scene: Phaser.Scene): void {
    if (scene.textures.exists('glow')) return;
    const size = 128;
    const tex = scene.textures.createCanvas('glow', size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
}

/** Tileable wall / wainscot / floor textures for the gallery. */
export function ensureGalleryTextures(scene: Phaser.Scene): void {
    if (scene.textures.exists('gal_wall')) return;
    const g = newGfx(scene);

    // Wallpaper with a faint diamond pattern
    g.fillStyle(0x2b2148, 1).fillRect(0, 0, 256, 256);
    g.fillStyle(0x33275a, 1);
    for (let y = 0; y < 256; y += 128) {
        for (let x = 0; x < 256; x += 128) {
            g.fillPoints(
                [
                    { x: x + 64, y: y + 14 },
                    { x: x + 114, y: y + 64 },
                    { x: x + 64, y: y + 114 },
                    { x: x + 14, y: y + 64 },
                ],
                true
            );
        }
    }
    g.fillStyle(0x241b3e, 1).fillRect(0, 0, 4, 256);
    g.generateTexture('gal_wall', 256, 256);
    g.clear();

    // Wainscot wood panels
    g.fillStyle(0x3a2418, 1).fillRect(0, 0, 128, 160);
    g.fillStyle(0x442b1c, 1).fillRect(14, 18, 100, 124);
    g.lineStyle(3, 0x24150c, 1).strokeRect(14, 18, 100, 124);
    g.fillStyle(0x24150c, 1).fillRect(0, 0, 128, 6);
    g.generateTexture('gal_wainscot', 128, 160);
    g.clear();

    // Polished plank floor
    g.fillStyle(0x5a3a24, 1).fillRect(0, 0, 256, 140);
    const rng = mulberry32(7);
    for (let row = 0; row < 4; row++) {
        const y = row * 35;
        g.fillStyle(row % 2 ? 0x634029 : 0x573721, 1).fillRect(0, y, 256, 35);
        g.fillStyle(0x2f1c10, 1).fillRect(0, y, 256, 2);
        g.fillRect(Math.floor(rng() * 220) + 10, y, 2, 35);
    }
    g.fillStyle(0xffffff, 0.06).fillRect(0, 0, 256, 6);
    g.generateTexture('gal_floor', 256, 140);
    g.destroy();
}

/** Tileable bookcase wall + floor for the library. Shelf planks sit at y = 150*i + 142. */
export function ensureLibraryTextures(scene: Phaser.Scene): void {
    if (scene.textures.exists('lib_case')) return;
    const g = newGfx(scene);
    const rng = mulberry32(42);
    const palette = [0x6b2d2d, 0x2d4a6b, 0x3d5a3a, 0x5a4a2d, 0x4a2d5a, 0x2d5a55, 0x7a5a30, 0x3a3a4a, 0x5a2d45];

    g.fillStyle(0x2a1a10, 1).fillRect(0, 0, 400, 940);
    for (let i = 0; i < 6; i++) {
        const y0 = i * 150;
        g.fillStyle(0x160d07, 1).fillRect(10, y0 + 8, 380, 134);
        let x = 14;
        while (x < 376) {
            const w = 14 + Math.floor(rng() * 17);
            const h = 80 + Math.floor(rng() * 50);
            if (x + w > 386) break;
            if (rng() < 0.06) {
                x += 24 + Math.floor(rng() * 20); // gap
                continue;
            }
            const c = palette[Math.floor(rng() * palette.length)];
            g.fillStyle(c, 1).fillRect(x, y0 + 142 - h, w, h);
            g.fillStyle(0xffffff, 0.14).fillRect(x, y0 + 142 - h + 10, w, 4);
            g.fillStyle(0x000000, 0.25).fillRect(x + w - 3, y0 + 142 - h, 3, h);
            x += w + 1;
        }
        g.fillStyle(0x4a2f1b, 1).fillRect(0, y0 + 142, 400, 12);
        g.fillStyle(0xffffff, 0.08).fillRect(0, y0 + 142, 400, 2);
    }
    g.fillStyle(0x1a0f08, 1).fillRect(0, 900, 400, 40);
    g.fillStyle(0x3a2414, 1).fillRect(0, 0, 10, 940).fillRect(390, 0, 10, 940);
    g.generateTexture('lib_case', 400, 940);
    g.clear();

    g.fillStyle(0x3b2416, 1).fillRect(0, 0, 256, 140);
    for (let row = 0; row < 4; row++) {
        g.fillStyle(row % 2 ? 0x45291a : 0x3a2215, 1).fillRect(0, row * 35, 256, 35);
        g.fillStyle(0x20110a, 1).fillRect(0, row * 35, 256, 2);
        g.fillRect(Math.floor(rng() * 220) + 10, row * 35, 2, 35);
    }
    g.generateTexture('lib_floor', 256, 140);
    g.destroy();
}

/**
 * Bakes a complete painting (gold frame + oil-painting landscape + dark text panel) into ONE texture,
 * so each painting costs a single draw call at runtime. Final size: (w + 60) x (h + 60).
 */
export function makePaintingTexture(
    scene: Phaser.Scene,
    key: string,
    w: number,
    h: number,
    hue: number,
    seed: number
): void {
    if (scene.textures.exists(key)) return;
    const rng = mulberry32(seed);
    const hsl = (hh: number, s: number, l: number) =>
        Phaser.Display.Color.HSLToColor(((hh % 360) + 360) % 360 / 360, s, l).color;
    const g = newGfx(scene);
    const F = 30; // frame thickness

    // frame
    g.fillStyle(0x7a5a1a, 1).fillRect(0, 0, w + 2 * F, h + 2 * F);
    g.lineStyle(4, 0xe8c35a, 1).strokeRect(2, 2, w + 2 * F - 4, h + 2 * F - 4);
    g.fillStyle(0x3b2a0c, 1).fillRect(F - 12, F - 12, w + 24, h + 24);
    g.lineStyle(3, 0xc9a23f, 1).strokeRect(F - 12, F - 12, w + 24, h + 24);

    // everything below is drawn inside the canvas area, offset by the frame
    const top = hsl(hue, 0.55, 0.16);
    const bottom = hsl(hue + 25, 0.7, 0.45);
    g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(F, F, w, h);

    const sunX = F + w * (0.15 + rng() * 0.55);
    const sunY = F + h * 0.2;
    g.fillStyle(hsl(hue + 50, 0.9, 0.8), 0.25).fillCircle(sunX, sunY, 90);
    g.fillStyle(hsl(hue + 50, 0.9, 0.8), 0.9).fillCircle(sunX, sunY, 46);

    for (let i = 0; i < 160; i++) {
        g.fillStyle(hsl(hue + rng() * 80 - 20, 0.7, 0.3 + rng() * 0.4), 0.06 + rng() * 0.1);
        g.fillEllipse(F + rng() * w, F + rng() * h * 0.75, 24 + rng() * 70, 6 + rng() * 14);
    }

    const layers: Array<[number, number, number]> = [
        [h * 0.5, 70, hsl(hue + 10, 0.4, 0.26)],
        [h * 0.62, 55, hsl(hue - 10, 0.45, 0.16)],
        [h * 0.74, 40, hsl(hue - 20, 0.5, 0.09)],
    ];
    for (const [baseY, amp, color] of layers) {
        const phase = rng() * 10;
        const freq = 0.006 + rng() * 0.008;
        const pts: Phaser.Types.Math.Vector2Like[] = [{ x: F, y: F + h }];
        for (let x = 0; x <= w; x += 30) {
            pts.push({ x: F + x, y: F + baseY - amp * (0.5 + 0.5 * Math.sin(x * freq + phase)) - rng() * amp * 0.35 });
        }
        pts.push({ x: F + w, y: F + h });
        g.fillStyle(color, 1).fillPoints(pts, true);
    }

    // dark text panel (lower part of the canvas) + purple rule
    const panelTop = F + 112;
    g.fillStyle(0x120f2e, 0.84).fillRect(F, panelTop, w, h - 112);
    g.fillStyle(0x9b5de0, 0.9).fillRect(F, panelTop, w, 3);

    g.lineStyle(26, 0x000000, 0.22).strokeRect(F, F, w, h);
    g.generateTexture(key, w + 2 * F, h + 2 * F);
    g.destroy();
}

/** Lightning bolt projectile + bat enemies (+ animations) for the storm cave. */
export function ensureStormAssets(scene: Phaser.Scene): void {
    if (scene.textures.exists('bolt')) return;
    const g = newGfx(scene);

    // projectile (head points to +x)
    g.fillStyle(0x6fb6ff, 0.35).fillEllipse(32, 8, 64, 16);
    g.fillStyle(0xbfe3ff, 0.9).fillEllipse(38, 8, 44, 8);
    g.fillStyle(0xffffff, 1).fillEllipse(42, 8, 28, 4);
    g.generateTexture('bolt', 64, 16);
    g.clear();

    const drawBat = (key: string, up: boolean, wing: number, body: number, accent: number, eye: number) => {
        const cx = 48;
        const cy = 40;
        const tipY = up ? 6 : 62;
        const s = up ? 1 : -1;
        const left = [
            { x: cx - 6, y: cy - 6 },
            { x: 4, y: tipY },
            { x: 16, y: tipY + 22 * s },
            { x: 26, y: tipY + 14 * s },
            { x: 36, y: tipY + 30 * s },
            { x: cx - 8, y: cy + 8 },
        ];
        const right = left.map((p) => ({ x: 96 - p.x, y: p.y }));
        g.fillStyle(wing, 1).fillPoints(left, true).fillPoints(right, true);
        g.lineStyle(2, accent, 0.9).strokePoints(left, true).strokePoints(right, true);
        g.fillStyle(body, 1).fillEllipse(cx, cy + 2, 22, 30).fillCircle(cx, cy - 14, 11);
        g.fillTriangle(cx - 10, cy - 20, cx - 6, cy - 34, cx - 2, cy - 22);
        g.fillTriangle(cx + 10, cy - 20, cx + 6, cy - 34, cx + 2, cy - 22);
        g.fillStyle(eye, 1).fillCircle(cx - 4, cy - 15, 2.6).fillCircle(cx + 4, cy - 15, 2.6);
        g.generateTexture(key, 96, 72);
        g.clear();
    };

    const kinds: Array<[string, number, number, number, number]> = [
        ['bat', 0x4b3a78, 0x3a2a5a, 0x9b5de0, 0xffe14d],
        ['razor', 0x8a2a3a, 0x5a1f2a, 0xff6a7a, 0xff4040],
        ['brute', 0x2b2b44, 0x1d1d2b, 0x6fd0ff, 0x6fd0ff],
    ];
    for (const [name, wing, body, accent, eye] of kinds) {
        drawBat(`${name}_up`, true, wing, body, accent, eye);
        drawBat(`${name}_down`, false, wing, body, accent, eye);
        if (!scene.anims.exists(`${name}_fly`)) {
            scene.anims.create({
                key: `${name}_fly`,
                frames: [{ key: `${name}_up` }, { key: `${name}_down` }],
                frameRate: name === 'razor' ? 12 : 8,
                repeat: -1,
            });
        }
    }
    g.destroy();
}

/**
 * Every procedural texture in the game, as small named steps, so the loading screen can run them
 * one by one and the gameplay scenes never have to generate anything while you are playing.
 */
export function getWarmupSteps(scene: Phaser.Scene): Array<[string, () => void]> {
    const steps: Array<[string, () => void]> = [
        ['Lighting the lamps', () => ensureGlowTexture(scene)],
        ['Summoning the storm', () => ensureStormAssets(scene)],
        ['Hanging the wallpaper', () => ensureGalleryTextures(scene)],
        ['Stacking the shelves', () => ensureLibraryTextures(scene)],
    ];
    JOBS.forEach((job, i) => {
        steps.push([
            `Painting ${i + 1} of ${JOBS.length}`,
            () => makePaintingTexture(scene, `painting_${i}`, PAINTING_W, PAINTING_H, job.hue, 1000 + i * 37),
        ]);
    });
    return steps;
}