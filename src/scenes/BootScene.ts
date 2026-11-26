import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W } from '../config';
import { ensureGlowTexture } from '../utils/textures';

/** Loads only what the main menu needs (a handful of images), so the menu appears instantly. */
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload(): void {
        this.add
            .text(GAME_W / 2, GAME_H / 2, 'Loading…', { fontFamily: FONT, fontSize: '24px', color: '#fdcffa' })
            .setOrigin(0.5);
        this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn('[assets] could not load', file.src));
        this.load.image('bgShadow', 'images/ShadowBackground.png');
        this.load.image('platforms', 'images/Platform.png');
        this.load.image('overlay', 'images/Overlayer.png');
        this.load.image('player_right', 'images/Haku_Idle_Right.png');
    }

    create(): void {
        ensureGlowTexture(this);
        // The chapter-card scene stays on top of everything for the whole session.
        this.scene.launch('TransitionScene');

        // Dev shortcut: #gallery / #library / #storm jumps straight there (everything is preloaded first).
        const jump: Record<string, string> = {
            '#gallery': 'GalleryScene',
            '#library': 'LibraryScene',
            '#storm': 'ThunderCaveScene',
        };
        const target = jump[location.hash];
        if (target) this.scene.start('LoadingScene', { next: target });
        else this.scene.start('MenuScene');
    }
}