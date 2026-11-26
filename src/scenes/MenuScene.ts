import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';

/**
 * Backdrop for the main menu (the buttons themselves are the HTML overlay in index.html,
 * wired up in ui/domUi.ts). Reuses the cave art with drifting dust and a flickering light.
 */
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create(): void {
        this.add.image(GAME_W / 2, GAME_H / 2, 'bgShadow');
        const floor = this.add.image(GAME_W / 2, GAME_H, 'platforms').setOrigin(0.5, 1);
        const floorTop = GAME_H - floor.displayHeight;
        this.add.image(520, floorTop, 'player_right').setOrigin(0.5, 1).setScale(0.8);
        this.add.image(GAME_W / 2, GAME_H / 2, 'overlay');

        // the light at the end of the tunnel, glowing in the distance
        const light = this.add
            .image(GAME_W - 40, floorTop - 190, 'glow')
            .setScale(6, 9)
            .setTint(0xfff1c9)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.4);
        this.tweens.add({ targets: light, alpha: { from: 0.3, to: 0.6 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        // drifting dust
        this.add.particles(0, 0, 'glow', {
            x: { min: 0, max: GAME_W },
            y: GAME_H + 20,
            speedY: { min: -60, max: -20 },
            speedX: { min: -15, max: 15 },
            lifespan: 9000,
            scale: { start: 0.06, end: 0 },
            alpha: { start: 0.5, end: 0 },
            frequency: 180,
            blendMode: 'ADD',
        });

        // dark vignette so the title stays readable
        this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.35);

        this.cameras.main.fadeIn(500, 0, 0, 0);
        this.game.events.emit('menu:show');
        this.events.once('shutdown', () => this.game.events.emit('menu:hide'));
    }
}