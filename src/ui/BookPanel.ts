import Phaser from 'phaser';
import { BookEntry } from '../data/portfolio';
import { BOOK_COLORS } from '../objects/Book';
import { FONT, GAME_H, GAME_W } from '../config';
import { addChips } from '../utils/ui';

const KIND_LABEL: Record<string, string> = {
    project: 'PROJECT',
    art: 'ART PORTFOLIO',
    content: 'CONTENT SHOWCASE',
    link: 'SEE MORE',
};
const KIND_EMOJI: Record<string, string> = { project: '💻', art: '🎨', content: '🎥', link: '🔗' };

/** Full-screen "open book" reader for a library entry. */
export default class BookPanel {
    private container?: Phaser.GameObjects.Container;
    private entry?: BookEntry;
    /** scene time (ms) of the last close; lets the pause menu ignore the Esc that closed the book */
    public closedAt = -1e9;

    constructor(private scene: Phaser.Scene, private onClose: () => void) {}

    get isOpen(): boolean {
        return !!this.container;
    }

    open(entry: BookEntry): void {
        if (this.container) return;
        this.entry = entry;
        const scene = this.scene;
        const color = BOOK_COLORS[entry.kind] ?? 0x7b3fd1;
        const c = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.container = c;

        const dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x05030a, 0.8).setInteractive();
        dim.on('pointerdown', () => this.close());
        c.add(dim);

        const bw = 1300;
        const bh = 720;
        const cx = GAME_W / 2;
        const cy = GAME_H / 2;
        const cover = scene.add.rectangle(cx, cy, bw + 44, bh + 44, 0x3a1f12).setStrokeStyle(4, 0xc9a23f).setInteractive();
        c.add(cover);
        c.add(scene.add.rectangle(cx - bw / 4 - 3, cy, bw / 2 - 6, bh, 0xf3e6c8));
        c.add(scene.add.rectangle(cx + bw / 4 + 3, cy, bw / 2 - 6, bh, 0xf8edd2));
        c.add(scene.add.rectangle(cx, cy, 10, bh, 0xc9b58a));

        // left page: cover picture
        const lx = cx - bw / 4;
        if (entry.coverKey && scene.textures.exists(entry.coverKey)) {
            const src = scene.textures.get(entry.coverKey).getSourceImage();
            const s = Math.min(520 / src.width, 560 / src.height);
            const w = src.width * s;
            const h = src.height * s;
            c.add(scene.add.rectangle(lx, cy, w + 20, h + 20, 0xffffff).setStrokeStyle(2, 0xc9b58a));
            c.add(scene.add.image(lx, cy, entry.coverKey).setDisplaySize(w, h));
        } else {
            c.add(scene.add.rectangle(lx, cy, 480, 560, color, 0.9).setStrokeStyle(4, 0x2b1d3a));
            c.add(scene.add.text(lx, cy - 40, KIND_EMOJI[entry.kind] ?? '📖', { fontFamily: 'sans-serif', fontSize: '150px' }).setOrigin(0.5));
            c.add(
                scene.add
                    .text(lx, cy + 120, entry.spine, { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffffff', align: 'center' })
                    .setOrigin(0.5)
            );
        }

        // right page: text
        const left = cx + 50;
        const wrap = bw / 2 - 110;
        let y = cy - bh / 2 + 50;
        const kind = scene.add.text(left, y, KIND_LABEL[entry.kind] ?? '', {
            fontFamily: FONT,
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#' + color.toString(16).padStart(6, '0'),
        });
        c.add(kind);
        y += 34;
        const title = scene.add.text(left, y, entry.title, {
            fontFamily: FONT,
            fontSize: '38px',
            fontStyle: 'bold',
            color: '#2b1d3a',
            wordWrap: { width: wrap },
        });
        c.add(title);
        y += title.height + 16;
        const blurb = scene.add.text(left, y, entry.blurb, {
            fontFamily: FONT,
            fontSize: '22px',
            color: '#3a2b4a',
            wordWrap: { width: wrap },
            lineSpacing: 7,
        });
        c.add(blurb);
        y += blurb.height + 22;
        if (entry.tags?.length) addChips(scene, c, entry.tags, left, y, wrap, { size: 17, fill: color });

        // buttons
        const by = cy + bh / 2 - 60;
        const open = scene.add
            .text(left, by, `${entry.linkLabel} ↗   [Enter]`, {
                fontFamily: FONT,
                fontSize: '22px',
                fontStyle: 'bold',
                color: '#ffffff',
                backgroundColor: '#' + color.toString(16).padStart(6, '0'),
                padding: { x: 18, y: 10 },
            })
            .setInteractive({ useHandCursor: true });
        open.on('pointerdown', () => this.openLink());
        c.add(open);
        const close = scene.add
            .text(cx + bw / 2 - 18, cy - bh / 2 + 14, 'Close ✕  [Esc]', {
                fontFamily: FONT,
                fontSize: '18px',
                color: '#5a4a6a',
            })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => this.close());
        c.add(close);

        const kb = scene.input.keyboard!;
        kb.on('keydown-ESC', this.close, this);
        kb.on('keydown-ENTER', this.openLink, this);
    }

    private openLink = (): void => {
        if (this.entry) window.open(this.entry.url, '_blank', 'noopener,noreferrer');
    };

    close = (): void => {
        if (!this.container) return;
        const kb = this.scene.input.keyboard!;
        kb.off('keydown-ESC', this.close, this);
        kb.off('keydown-ENTER', this.openLink, this);
        this.container.destroy();
        this.container = undefined;
        this.closedAt = this.scene.time.now;
        this.entry = undefined;
        this.onClose();
    };
}