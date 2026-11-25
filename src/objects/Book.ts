import Phaser from 'phaser';
import { BookEntry } from '../data/portfolio';
import { FONT } from '../config';

export const BOOK_COLORS: Record<string, number> = {
    project: 0x7b3fd1,
    art: 0xd04a7c,
    content: 0x2f8fc7,
    link: 0xc9a23f,
};

export const BOOK_H = 128;

/** An interactive book sticking out of the shelf. Pulls out when the player stands near it. */
export default class Book {
    public readonly x: number;
    private container: Phaser.GameObjects.Container;
    private aura: Phaser.GameObjects.Image;
    private baseY: number;
    private focused = false;

    constructor(private scene: Phaser.Scene, x: number, baseY: number, public readonly entry: BookEntry) {
        this.x = x;
        this.baseY = baseY;
        const color = BOOK_COLORS[entry.kind] ?? 0x7b3fd1;
        const w = 62;

        this.aura = scene.add
            .image(x, baseY - BOOK_H / 2, 'glow')
            .setScale(2.4, 3.2)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(color)
            .setAlpha(0.45)
            .setDepth(5);
        scene.tweens.add({
            targets: this.aura,
            alpha: { from: 0.3, to: 0.6 },
            duration: 1100 + Math.random() * 500,
            yoyo: true,
            repeat: -1,
        });

        const c = scene.add.container(x, baseY).setDepth(6);
        this.container = c;
        c.add(scene.add.rectangle(0, -BOOK_H / 2, w, BOOK_H, color).setStrokeStyle(2, 0x000000, 0.5));
        c.add(scene.add.rectangle(0, -BOOK_H + 12, w, 8, 0xe8c35a));
        c.add(scene.add.rectangle(0, -12, w, 8, 0xe8c35a));
        c.add(scene.add.rectangle(w / 2 - 5, -BOOK_H / 2, 6, BOOK_H, 0x000000, 0.25));
        // bookmark ribbon
        c.add(scene.add.rectangle(10, 8, 8, 20, 0xfdcffa));

        const label = scene.add
            .text(0, -BOOK_H / 2, entry.spine, {
                fontFamily: FONT,
                fontSize: '20px',
                fontStyle: 'bold',
                color: '#ffffff',
            })
            .setOrigin(0.5)
            .setAngle(-90);
        const maxLen = BOOK_H - 44;
        if (label.width > maxLen) label.setFontSize(Math.max(11, Math.floor((20 * maxLen) / label.width)));
        c.add(label);

        c.setAngle(Phaser.Math.Between(-3, 3));
    }

    get topY(): number {
        return this.baseY - BOOK_H - 14;
    }

    setFocused(f: boolean): void {
        if (f === this.focused) return;
        this.focused = f;
        this.scene.tweens.add({
            targets: this.container,
            y: this.baseY - (f ? 16 : 0),
            duration: 160,
            ease: 'Sine.easeOut',
        });
        this.aura.setScale(f ? 3.2 : 2.4, f ? 4.2 : 3.2);
    }
}
