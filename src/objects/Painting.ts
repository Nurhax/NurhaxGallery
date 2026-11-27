import Phaser from 'phaser';
import { Job } from '../data/portfolio';

export const PAINTING_W = 700;
export const PAINTING_H = 460;

/**
 * One big framed painting for a single job. It is just ONE image (everything is baked into the texture,
 * see makePaintingTexture) plus a spotlight. Walk up and press E (or click it) to read the details.
 */
export default class Painting {
    public readonly x: number;
    private image: Phaser.GameObjects.Image;
    private spot: Phaser.GameObjects.Image;
    private focus = 0;

    constructor(
        scene: Phaser.Scene,
        x: number,
        cy: number,
        public readonly job: Job,
        public readonly texKey: string,
        onActivate: (p: Painting) => void
    ) {
        this.x = x;
        this.spot = scene.add
            .image(x, cy + 30, 'glow')
            .setScale(8, 5.4)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(0xffe2b0)
            .setAlpha(0.12)
            .setDepth(4);
        this.image = scene.add.image(x, cy, texKey).setDepth(5);
        this.image.setInteractive({ useHandCursor: true });
        this.image.on('pointerdown', () => onActivate(this));
    }

    /** Light up the painting the player is standing in front of. */
    update(playerX: number): void {
        // far-away paintings don't need per-frame work
        if (Math.abs(playerX - this.x) > 1400) return;
        const target = 1 - Phaser.Math.Clamp(Math.abs(playerX - this.x) / 700, 0, 1);
        this.focus += (target - this.focus) * 0.08;
        this.spot.setAlpha(0.1 + 0.4 * this.focus);
        this.image.setScale(1 + 0.02 * this.focus);
    }
}