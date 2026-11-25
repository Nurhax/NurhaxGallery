import Phaser from 'phaser';
import { COLORS, FONT } from '../config';
import { Job } from '../data/portfolio';
import { addChips } from '../utils/ui';

export const PAINTING_W = 700;
export const PAINTING_H = 460;

/** One big framed painting describing a single job. */
export default class Painting {
    public readonly x: number;
    private container: Phaser.GameObjects.Container;
    private spot: Phaser.GameObjects.Image;
    private focus = 0;

    constructor(scene: Phaser.Scene, x: number, cy: number, job: Job, texKey: string, index: number, total: number) {
        this.x = x;

        this.spot = scene.add
            .image(x, cy + 30, 'glow')
            .setScale(9.5, 6.4)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setTint(0xffe2b0)
            .setAlpha(0.15)
            .setDepth(4);

        // lamp bar above the frame
        scene.add.rectangle(x, cy - PAINTING_H / 2 - 52, 220, 10, 0x1a1a1a).setDepth(5);
        scene.add.rectangle(x, cy - PAINTING_H / 2 - 47, 120, 4, 0xfff0c8).setDepth(5);

        const c = scene.add.container(x, cy).setDepth(5);
        this.container = c;

        const outer = scene.add.rectangle(0, 0, PAINTING_W + 60, PAINTING_H + 60, 0x7a5a1a).setStrokeStyle(4, 0xe8c35a);
        const inner = scene.add.rectangle(0, 0, PAINTING_W + 24, PAINTING_H + 24, 0x3b2a0c).setStrokeStyle(3, 0xc9a23f);
        const art = scene.add.image(0, 0, texKey);
        c.add([outer, inner, art]);

        const left = -PAINTING_W / 2 + 28;
        const top = -PAINTING_H / 2;

        // watermark emoji + date over the sky
        c.add(
            scene.add
                .text(PAINTING_W / 2 - 100, top + 62, job.emoji, { fontFamily: 'sans-serif', fontSize: '96px' })
                .setOrigin(0.5)
                .setAlpha(0.5)
        );
        c.add(
            scene.add.text(left, top + 20, job.date.toUpperCase(), {
                fontFamily: FONT,
                fontSize: '22px',
                fontStyle: 'bold',
                color: '#fdcffa',
                stroke: '#120f2e',
                strokeThickness: 5,
            })
        );

        // text panel
        const panelTop = top + 112;
        const panelH = PAINTING_H - 112;
        c.add(scene.add.rectangle(0, panelTop + panelH / 2, PAINTING_W, panelH, 0x120f2e, 0.84));
        c.add(scene.add.rectangle(0, panelTop + 1, PAINTING_W, 3, COLORS.purple, 0.9));

        let y = panelTop + 16;
        const wrap = PAINTING_W - 56;
        const title = scene.add.text(left, y, job.title, {
            fontFamily: FONT,
            fontSize: '31px',
            fontStyle: 'bold',
            color: '#ffffff',
            wordWrap: { width: wrap },
        });
        c.add(title);
        y += title.height + 2;
        const company = scene.add.text(left, y, job.company, { fontFamily: FONT, fontSize: '22px', color: '#fdcffa' });
        c.add(company);
        y += company.height + 10;
        const desc = scene.add.text(left, y, job.description, {
            fontFamily: FONT,
            fontSize: '19px',
            color: '#e6e1f5',
            wordWrap: { width: wrap },
            lineSpacing: 4,
        });
        c.add(desc);
        y += desc.height + 12;
        addChips(scene, c, job.tags, left, y, wrap, { size: 15, fill: COLORS.purple });

        // brass plaque
        const plaqueY = cy + PAINTING_H / 2 + 62;
        scene.add.rectangle(x, plaqueY, 170, 32, 0xb5923a).setStrokeStyle(2, 0x6b551f).setDepth(5);
        scene.add
            .text(x, plaqueY, `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`, {
                fontFamily: FONT,
                fontSize: '16px',
                fontStyle: 'bold',
                color: '#2a1a05',
            })
            .setOrigin(0.5)
            .setDepth(5);
    }

    update(playerX: number): void {
        const target = 1 - Phaser.Math.Clamp(Math.abs(playerX - this.x) / 700, 0, 1);
        this.focus += (target - this.focus) * 0.08;
        this.spot.setAlpha(0.1 + 0.4 * this.focus);
        this.container.setScale(1 + 0.02 * this.focus);
    }
}
