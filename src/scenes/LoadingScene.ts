import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W } from '../config';
import { LIBRARY } from '../data/portfolio';
import { startMusic } from '../services/audio';
import { createPlayerAnimations } from '../utils/animations';
import { getWarmupSteps } from '../utils/textures';

/**
 * Runs when the player presses "Play Portfolio Game": loads every remaining asset and generates every
 * procedural texture (gallery, paintings, library, storm cave) up front, so no scene has to do that
 * work while you are walking around.
 */
export default class LoadingScene extends Phaser.Scene {
    private readonly barWidth = 720;
    private readonly barHeight = 20;
    private next = 'MainScene';
    private barFill!: Phaser.GameObjects.Rectangle;
    private label!: Phaser.GameObjects.Text;

    constructor() {
        super('LoadingScene');
    }

    init(data: { next?: string }): void {
        this.next = data?.next ?? 'MainScene';
    }

    preload(): void {
        const cx = GAME_W / 2;
        this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x0b0820);
        this.add
            .text(cx, GAME_H / 2 - 70, 'Preparing the journey…', { fontFamily: FONT, fontSize: '40px', color: '#fdcffa' })
            .setOrigin(0.5);
        this.label = this.add
            .text(cx, GAME_H / 2 + 50, 'Loading assets', { fontFamily: FONT, fontSize: '22px', color: '#9fb4e0' })
            .setOrigin(0.5);
        this.add.rectangle(cx, GAME_H / 2, this.barWidth, this.barHeight, 0x202350);
        this.barFill = this.add.rectangle(cx - this.barWidth / 2, GAME_H / 2, 0, this.barHeight, 0xfdcffa).setOrigin(0, 0.5);

        // Phase 1 (0-60%): files
        this.load.on('progress', (p: number) => (this.barFill.width = this.barWidth * p * 0.6));
        this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn('[assets] could not load', file.src));

        this.load.image('player_left', 'images/Haku_Idle_Left.png');
        // Running spritesheets (original frame size 123x220, sheets are cut at 125x220)
        this.load.spritesheet('player_run_right', 'images/Run/Haku_Run_Right.png', { frameWidth: 125, frameHeight: 220 });
        this.load.spritesheet('player_run_left', 'images/Run/Haku_Run_Left.png', { frameWidth: 125, frameHeight: 220 });
        this.load.audio('bgm', 'audio/BGM1.mp3');
        // Library covers (optional: a missing file just shows a generated cover)
        for (const section of LIBRARY) {
            for (const e of section.entries) {
                if (e.coverKey && e.coverPath) this.load.image(e.coverKey, e.coverPath);
            }
        }
    }

    create(): void {
        createPlayerAnimations(this);
        startMusic(this.game); // the Play click was a user gesture, so audio is allowed to start

        // Phase 2 (60-100%): textures, one small step per tick so the bar keeps moving
        const steps = getWarmupSteps(this);
        const run = (i: number) => {
            if (i >= steps.length) return this.finish();
            const [label, fn] = steps[i];
            this.label.setText(label);
            this.barFill.width = this.barWidth * (0.6 + 0.4 * (i / steps.length));
            this.time.delayedCall(30, () => {
                fn();
                run(i + 1);
            });
        };
        run(0);
    }

    private finish(): void {
        this.barFill.width = this.barWidth;
        this.label.setText('Ready');
        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(this.next));
    }
}