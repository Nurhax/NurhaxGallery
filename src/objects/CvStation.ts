import Phaser from 'phaser';
import { FONT } from '../config';

/** A pedestal with a floating résumé sheet. Click it, or stand close and press E, to download the CV. */
export default class CvStation {
    public readonly x: number;
    /** y just above the label, for tooltips */
    public readonly topY: number;
    private glow: Phaser.GameObjects.Image;
    private focused = false;

    constructor(scene: Phaser.Scene, x: number, groundY: number, onActivate: () => void) {
        this.x = x;
        const sheetY = groundY - 300;
        this.topY = sheetY - 190;

        scene.add.rectangle(x, groundY - 55, 170, 110, 0x2a1a3a).setStrokeStyle(3, 0xc9a23f).setDepth(5);
        scene.add.rectangle(x, groundY - 116, 210, 14, 0x3a2650).setStrokeStyle(2, 0xc9a23f).setDepth(5);

        this.glow = scene.add
            .image(x, sheetY, 'glow')
            .setScale(5.5, 6.5)
            .setTint(0xfdcffa)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setAlpha(0.3)
            .setDepth(4);

        const sheet = scene.add.container(x, sheetY).setDepth(6);
        const paper = scene.add.rectangle(0, 0, 150, 200, 0xf8f4ff).setStrokeStyle(3, 0x9b5de0);
        sheet.add(paper);
        sheet.add(scene.add.rectangle(0, -78, 150, 44, 0x9b5de0));
        sheet.add(
            scene.add
                .text(0, -78, 'CV', { fontFamily: FONT, fontSize: '30px', fontStyle: 'bold', color: '#ffffff' })
                .setOrigin(0.5)
        );
        [-28, -6, 16, 38, 60, 82].forEach((ly, i) => {
            sheet.add(scene.add.rectangle(-10 + (i % 2 ? 8 : 0), ly, i === 5 ? 70 : 112, 7, 0xc9bfe0));
        });
        sheet.setAngle(-3);
        scene.tweens.add({ targets: sheet, y: sheetY - 12, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        scene.tweens.add({ targets: this.glow, alpha: { from: 0.22, to: 0.4 }, duration: 1500, yoyo: true, repeat: -1 });

        paper.setInteractive({ useHandCursor: true });
        paper.on('pointerdown', onActivate);

        scene.add
            .text(x, sheetY - 140, 'MY CV', {
                fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#fdcffa', stroke: '#120f2e', strokeThickness: 6,
            })
            .setOrigin(0.5)
            .setDepth(6);
    }

    setFocused(f: boolean): void {
        if (f === this.focused) return;
        this.focused = f;
        this.glow.setScale(f ? 7 : 5.5, f ? 8 : 6.5);
    }
}