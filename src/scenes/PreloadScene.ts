import Phaser from 'phaser';
import { GAME_H, GAME_W, FONT } from '../config';
import { LIBRARY } from '../data/portfolio';
import { createPlayerAnimations } from '../utils/animations';
import { ensureGlowTexture, ensureStormAssets } from '../utils/textures';

/** Loads every asset once, then starts the cave. Add #gallery / #library / #storm to the URL to jump ahead while testing. */
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload(): void {
        const barBg = this.add.rectangle(GAME_W / 2, GAME_H / 2, 520, 14, 0x202350);
        const bar = this.add.rectangle(GAME_W / 2 - 260, GAME_H / 2, 0, 14, 0xfdcffa).setOrigin(0, 0.5);
        this.add
            .text(GAME_W / 2, GAME_H / 2 - 40, 'Loading…', { fontFamily: FONT, fontSize: '24px', color: '#fdcffa' })
            .setOrigin(0.5);
        this.load.on('progress', (p: number) => (bar.width = 520 * p));
        this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn('[assets] could not load', file.src));
        barBg.setDepth(0);

        // Cave
        this.load.image('bgShadow', 'images/ShadowBackground.png');
        this.load.image('platforms', 'images/Platform.png');
        this.load.image('overlay', 'images/Overlayer.png');
        this.load.image('player_right', 'images/Haku_Idle_Right.png');
        this.load.image('player_left', 'images/Haku_Idle_Left.png');
        // Running spritesheets (original frame size 123x220, sheets are cut at 125x220)
        this.load.spritesheet('player_run_right', 'images/Run/Haku_Run_Right.png', { frameWidth: 125, frameHeight: 220 });
        this.load.spritesheet('player_run_left', 'images/Run/Haku_Run_Left.png', { frameWidth: 125, frameHeight: 220 });
        // Background music
        this.load.audio('bgm', 'audio/BGM1.mp3');

        // Library covers (optional: a missing file just shows a generated cover)
        for (const section of LIBRARY) {
            for (const e of section.entries) {
                if (e.coverKey && e.coverPath) this.load.image(e.coverKey, e.coverPath);
            }
        }
    }

    create(): void {
        ensureGlowTexture(this);
        ensureStormAssets(this);
        createPlayerAnimations(this);

        const jump: Record<string, string> = {
            '#gallery': 'GalleryScene',
            '#library': 'LibraryScene',
            '#storm': 'ThunderCaveScene',
        };
        this.scene.start(jump[location.hash] ?? 'MainScene');
    }
}
