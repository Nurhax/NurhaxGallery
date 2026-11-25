import Phaser from 'phaser';
import { FONT } from '../config';

export interface ChipOptions {
    size?: number;
    fill?: number;
    color?: string;
}

/**
 * Lays out rounded "tag" chips inside a container, wrapping to new rows.
 * Returns the total height used.
 */
export function addChips(
    scene: Phaser.Scene,
    parent: Phaser.GameObjects.Container,
    tags: string[],
    left: number,
    top: number,
    maxWidth: number,
    o: ChipOptions = {}
): number {
    const size = o.size ?? 16;
    const h = size + 14;
    const gfx = scene.add.graphics();
    parent.add(gfx);
    let x = left;
    let y = top;
    for (const tag of tags) {
        const t = scene.add.text(0, 0, tag, {
            fontFamily: FONT,
            fontSize: `${size}px`,
            color: o.color ?? '#ffffff',
        });
        const w = t.width + 20;
        if (x + w > left + maxWidth) {
            x = left;
            y += h + 6;
        }
        gfx.fillStyle(o.fill ?? 0x9b5de0, 0.95);
        gfx.fillRoundedRect(x, y, w, h, h / 2);
        t.setPosition(x + 10, y + (h - t.height) / 2);
        parent.add(t);
        x += w + 8;
    }
    return tags.length ? y + h - top : 0;
}
