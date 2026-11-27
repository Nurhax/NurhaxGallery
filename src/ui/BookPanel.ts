import Phaser from 'phaser';
import { BookEntry, Job } from '../data/portfolio';
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

/** What the open-book reader shows. Library books and gallery paintings both map onto this. */
interface PanelContent {
    label: string;
    color: number;
    title: string;
    subtitle?: string;
    body: string;
    tags?: string[];
    coverKey?: string;
    coverEmoji: string;
    coverCaption: string;
    link?: { label: string; url: string };
}

/** Full-screen "open book" reader for a library book (open) or a gallery painting (openJob). */
export default class BookPanel {
    private container?: Phaser.GameObjects.Container;
    private link?: { label: string; url: string };
    /** scene time (ms) of the last close; lets the pause menu ignore the Esc that closed the panel */
    public closedAt = -1e9;

    constructor(private scene: Phaser.Scene, private onClose: () => void) {}

    get isOpen(): boolean {
        return !!this.container;
    }

    /** Library book. */
    open(entry: BookEntry): void {
        this.show({
            label: KIND_LABEL[entry.kind] ?? '',
            color: BOOK_COLORS[entry.kind] ?? 0x7b3fd1,
            title: entry.title,
            body: entry.blurb,
            tags: entry.tags,
            coverKey: entry.coverKey,
            coverEmoji: KIND_EMOJI[entry.kind] ?? '📖',
            coverCaption: entry.spine,
            link: { label: entry.linkLabel, url: entry.url },
        });
    }

    /** Gallery painting: the job's full details. `coverKey` is the painting texture. */
    openJob(job: Job, coverKey: string): void {
        this.show({
            label: 'WORK EXPERIENCE',
            color: 0x9b5de0,
            title: job.title,
            subtitle: `${job.company}  ·  ${job.date}`,
            body: job.description,
            tags: job.tags,
            coverKey,
            coverEmoji: job.emoji,
            coverCaption: job.company,
        });
    }

    private show(c: PanelContent): void {
        if (this.container) return;
        this.link = c.link;
        const scene = this.scene;
        const hex = '#' + c.color.toString(16).padStart(6, '0');
        const root = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.container = root;

        const dim = scene.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x05030a, 0.8).setInteractive();
        dim.on('pointerdown', () => this.close());
        root.add(dim);

        const bw = 1300;
        const bh = 720;
        const cx = GAME_W / 2;
        const cy = GAME_H / 2;
        const cover = scene.add.rectangle(cx, cy, bw + 44, bh + 44, 0x3a1f12).setStrokeStyle(4, 0xc9a23f).setInteractive();
        root.add(cover);
        root.add(scene.add.rectangle(cx - bw / 4 - 3, cy, bw / 2 - 6, bh, 0xf3e6c8));
        root.add(scene.add.rectangle(cx + bw / 4 + 3, cy, bw / 2 - 6, bh, 0xf8edd2));
        root.add(scene.add.rectangle(cx, cy, 10, bh, 0xc9b58a));

        // left page: cover picture
        const lx = cx - bw / 4;
        if (c.coverKey && scene.textures.exists(c.coverKey)) {
            const src = scene.textures.get(c.coverKey).getSourceImage();
            const s = Math.min(520 / src.width, 560 / src.height);
            const w = src.width * s;
            const h = src.height * s;
            root.add(scene.add.rectangle(lx, cy, w + 20, h + 20, 0xffffff).setStrokeStyle(2, 0xc9b58a));
            root.add(scene.add.image(lx, cy, c.coverKey).setDisplaySize(w, h));
        } else {
            root.add(scene.add.rectangle(lx, cy, 480, 560, c.color, 0.9).setStrokeStyle(4, 0x2b1d3a));
            root.add(scene.add.text(lx, cy - 40, c.coverEmoji, { fontFamily: 'sans-serif', fontSize: '150px' }).setOrigin(0.5));
            root.add(
                scene.add
                    .text(lx, cy + 120, c.coverCaption, { fontFamily: FONT, fontSize: '40px', fontStyle: 'bold', color: '#ffffff', align: 'center' })
                    .setOrigin(0.5)
            );
        }

        // right page: text
        const left = cx + 50;
        const wrap = bw / 2 - 110;
        let y = cy - bh / 2 + 50;
        const label = scene.add.text(left, y, c.label, { fontFamily: FONT, fontSize: '18px', fontStyle: 'bold', color: hex });
        root.add(label);
        y += 34;
        const title = scene.add.text(left, y, c.title, {
            fontFamily: FONT, fontSize: '38px', fontStyle: 'bold', color: '#2b1d3a', wordWrap: { width: wrap },
        });
        root.add(title);
        y += title.height + 8;
        if (c.subtitle) {
            const sub = scene.add.text(left, y, c.subtitle, { fontFamily: FONT, fontSize: '22px', color: hex, wordWrap: { width: wrap } });
            root.add(sub);
            y += sub.height + 10;
        }
        y += 8;
        const body = scene.add.text(left, y, c.body, {
            fontFamily: FONT, fontSize: '22px', color: '#3a2b4a', wordWrap: { width: wrap }, lineSpacing: 7,
        });
        root.add(body);
        y += body.height + 22;
        if (c.tags?.length) addChips(scene, root, c.tags, left, y, wrap, { size: 17, fill: c.color });

        // buttons
        const by = cy + bh / 2 - 60;
        if (c.link) {
            const open = scene.add
                .text(left, by, `${c.link.label} ↗   [Enter]`, {
                    fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
                    backgroundColor: hex, padding: { x: 18, y: 10 },
                })
                .setInteractive({ useHandCursor: true });
            open.on('pointerdown', () => this.openLink());
            root.add(open);
        }
        const close = scene.add
            .text(cx + bw / 2 - 18, cy - bh / 2 + 14, 'Close ✕  [Esc]', { fontFamily: FONT, fontSize: '18px', color: '#5a4a6a' })
            .setOrigin(1, 0)
            .setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => this.close());
        root.add(close);

        const kb = scene.input.keyboard!;
        kb.on('keydown-ESC', this.close, this);
        kb.on('keydown-ENTER', this.openLink, this);
    }

    private openLink = (): void => {
        if (this.link) window.open(this.link.url, '_blank', 'noopener,noreferrer');
    };

    close = (): void => {
        if (!this.container) return;
        const kb = this.scene.input.keyboard!;
        kb.off('keydown-ESC', this.close, this);
        kb.off('keydown-ENTER', this.openLink, this);
        this.container.destroy();
        this.container = undefined;
        this.link = undefined;
        this.closedAt = this.scene.time.now;
        this.onClose();
    };
}