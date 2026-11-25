import Phaser from 'phaser';
import { FONT } from '../config';

export interface DoorwayOptions {
    width?: number;
    height?: number;
    style?: 'grand' | 'bookcase';
    glow?: number;
    label?: string;
}

/** A double door (or secret bookcase door) that swings open to reveal a glowing passage. */
export default class Doorway {
    public readonly x: number;
    private leftLeaf: Phaser.GameObjects.Graphics;
    private rightLeaf: Phaser.GameObjects.Graphics;
    private spill: Phaser.GameObjects.Image;
    private opened = false;

    constructor(private scene: Phaser.Scene, x: number, groundY: number, o: DoorwayOptions = {}) {
        this.x = x;
        const w = o.width ?? 300;
        const h = o.height ?? 520;
        const glow = o.glow ?? 0xffe0a8;
        const style = o.style ?? 'grand';
        const top = groundY - h;

        // frame
        scene.add
            .rectangle(x, groundY - (h + 30) / 2, w + 44, h + 30, style === 'grand' ? 0x1a1024 : 0x1b0f08)
            .setStrokeStyle(4, 0xc9a23f)
            .setDepth(3);
        // lit passage behind the leaves
        scene.add.rectangle(x, groundY - h / 2, w, h, glow, 0.95).setDepth(4);
        // lintel + label
        scene.add
            .rectangle(x, top - 52, w + 90, 40, style === 'grand' ? 0x24163a : 0x2a1a10)
            .setStrokeStyle(3, 0xc9a23f)
            .setDepth(3);
        if (o.label) {
            scene.add
                .text(x, top - 52, o.label, {
                    fontFamily: FONT,
                    fontSize: '24px',
                    fontStyle: 'bold',
                    color: '#fdcffa',
                })
                .setOrigin(0.5)
                .setDepth(3);
        }

        this.leftLeaf = scene.add.graphics({ x: x - w / 2, y: groundY }).setDepth(5);
        this.rightLeaf = scene.add.graphics({ x: x + w / 2, y: groundY }).setDepth(5);
        this.drawLeaf(this.leftLeaf, 1, w, h, style);
        this.drawLeaf(this.rightLeaf, -1, w, h, style);

        // light spilling out once opened
        this.spill = scene.add
            .image(x, groundY - h / 2, 'glow')
            .setScale((w / 128) * 3.2, (h / 128) * 2.2)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(glow)
            .setAlpha(0)
            .setDepth(6);
    }

    private drawLeaf(g: Phaser.GameObjects.Graphics, dir: 1 | -1, w: number, h: number, style: 'grand' | 'bookcase'): void {
        const half = (w / 2) * dir;
        const x0 = Math.min(0, half);
        const lw = w / 2;
        if (style === 'grand') {
            g.fillStyle(0x5a3a22, 1).fillRect(x0, -h, lw, h);
            g.lineStyle(4, 0x2f1c10, 1).strokeRect(x0 + 14, -h + 16, lw - 28, h * 0.42);
            g.strokeRect(x0 + 14, -h * 0.5 + 6, lw - 28, h * 0.46);
            g.fillStyle(0xe8c35a, 1).fillCircle(dir === 1 ? lw - 16 : -lw + 16, -h / 2, 8);
        } else {
            g.fillStyle(0x2a1a10, 1).fillRect(x0, -h, lw, h);
            const colors = [0x6b2d2d, 0x2d4a6b, 0x3d5a3a, 0x5a4a2d, 0x4a2d5a];
            for (let row = 0; row < 4; row++) {
                const y = -h + row * (h / 4);
                let bx = x0 + 8;
                let i = row;
                while (bx < x0 + lw - 14) {
                    g.fillStyle(colors[i++ % colors.length], 1).fillRect(bx, y + 12, 16, h / 4 - 24);
                    bx += 17;
                }
                g.fillStyle(0x4a2f1b, 1).fillRect(x0, y + h / 4 - 12, lw, 12);
            }
        }
    }

    open(): void {
        if (this.opened) return;
        this.opened = true;
        this.scene.tweens.add({
            targets: [this.leftLeaf, this.rightLeaf],
            scaleX: 0.08,
            duration: 900,
            ease: 'Sine.easeInOut',
        });
        this.scene.tweens.add({ targets: this.spill, alpha: 0.65, duration: 900 });
    }
}
