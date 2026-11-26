import Phaser from 'phaser';
import { FONT, GAME_H, GAME_W } from '../config';

export interface TransitionCard {
    chapter: string;
    title: string;
    subtitle: string;
    bg: number;
    fg: string;
    accent: number;
}

export const CARDS: Record<'gallery' | 'library' | 'storm', TransitionCard> = {
    gallery: {
        chapter: 'CHAPTER I',
        title: 'THE WORK GALLERY',
        subtitle: 'One painting for every job.',
        bg: 0xfff1c9,
        fg: '#202350',
        accent: 0x9b5de0,
    },
    library: {
        chapter: 'CHAPTER II',
        title: 'THE LIBRARY',
        subtitle: 'Projects, art and videos — one book each.',
        bg: 0x2a1a10,
        fg: '#fdcffa',
        accent: 0xe8c35a,
    },
    storm: {
        chapter: 'CHAPTER III',
        title: 'THE STORM VAULT',
        subtitle: 'Survive the bats.',
        bg: 0x05081c,
        fg: '#cfe3ff',
        accent: 0x6fb6ff,
    },
};

/** How long the card stays fully visible at minimum (ms). It hides any scene-creation hitch. */
const MIN_HOLD = 1300;

/**
 * Always-on-top scene that owns every chapter change: a full-screen card slides in from the right,
 * the next scene is created behind it, and the card slides out to the left once the scene is ready.
 */
export default class TransitionScene extends Phaser.Scene {
    private panel!: Phaser.GameObjects.Container;
    private bg!: Phaser.GameObjects.Rectangle;
    private stripe!: Phaser.GameObjects.Rectangle;
    private chapterText!: Phaser.GameObjects.Text;
    private titleText!: Phaser.GameObjects.Text;
    private subText!: Phaser.GameObjects.Text;
    private barTrack!: Phaser.GameObjects.Rectangle;
    private barFill!: Phaser.GameObjects.Rectangle;
    private busy = false;

    constructor() {
        super('TransitionScene');
    }

    create(): void {
        const cx = GAME_W / 2;
        this.bg = this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x000000);
        this.stripe = this.add.rectangle(0, GAME_H / 2, 18, GAME_H, 0xffffff).setOrigin(0, 0.5);
        this.chapterText = this.add
            .text(cx, 390, '', { fontFamily: FONT, fontSize: '28px', fontStyle: 'bold' })
            .setOrigin(0.5);
        this.titleText = this.add
            .text(cx, 470, '', { fontFamily: FONT, fontSize: '88px', fontStyle: 'bold' })
            .setOrigin(0.5);
        this.subText = this.add.text(cx, 560, '', { fontFamily: FONT, fontSize: '30px' }).setOrigin(0.5);
        this.barTrack = this.add.rectangle(cx, 680, 420, 8, 0x000000, 0.25);
        this.barFill = this.add.rectangle(cx - 210, 680, 420, 8, 0xffffff).setOrigin(0, 0.5);

        this.panel = this.add
            .container(GAME_W, 0, [this.bg, this.stripe, this.chapterText, this.titleText, this.subText, this.barTrack, this.barFill])
            .setDepth(1000)
            .setVisible(false);
    }

    get isBusy(): boolean {
        return this.busy;
    }

    run(from: Phaser.Scene, next: string, card: TransitionCard, data?: object): void {
        if (this.busy) return;
        this.busy = true;
        this.game.registry.set('transitioning', true);

        this.bg.setFillStyle(card.bg, 1);
        this.stripe.setFillStyle(card.accent, 1);
        this.barFill.setFillStyle(card.accent, 1).setScale(0, 1);
        this.barTrack.setFillStyle(card.accent, 0.25);
        this.chapterText.setText(card.chapter).setColor('#' + card.accent.toString(16).padStart(6, '0'));
        this.titleText.setText(card.title).setColor(card.fg);
        this.subText.setText(card.subtitle).setColor(card.fg);
        this.panel.setX(GAME_W).setVisible(true);
        this.scene.bringToTop();

        this.tweens.add({
            targets: this.panel,
            x: 0,
            duration: 550,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                const t0 = this.time.now;
                const target = this.scene.get(next);
                target.events.once(Phaser.Scenes.Events.CREATE, () => {
                    const wait = Math.max(0, MIN_HOLD - (this.time.now - t0));
                    this.time.delayedCall(wait + 80, () => this.slideOut());
                });
                this.tweens.add({ targets: this.barFill, scaleX: 1, duration: MIN_HOLD, ease: 'Sine.easeInOut' });
                from.scene.start(next, data);
                this.scene.bringToTop();
            },
        });
    }

    private slideOut(): void {
        this.tweens.add({
            targets: this.panel,
            x: -GAME_W,
            duration: 650,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.panel.setVisible(false).setX(GAME_W);
                this.busy = false;
                this.game.registry.set('transitioning', false);
            },
        });
    }
}