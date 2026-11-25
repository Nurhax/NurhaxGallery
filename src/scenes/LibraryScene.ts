import Phaser from 'phaser';
import Player from '../player/Player';
import Book from '../objects/Book';
import Doorway from '../objects/Doorway';
import BookPanel from '../ui/BookPanel';
import { FONT, GAME_H, GROUND_Y } from '../config';
import { LIBRARY, BookEntry } from '../data/portfolio';
import { createPlayerAnimations } from '../utils/animations';
import { ensureLibraryTextures } from '../utils/textures';
import { walkThroughDoor } from '../utils/transitions';

const BOOK_GAP = 340;
const SECTION_GAP = 520;
const FIRST_BOOK_X = 1000;
/** Top of the shelf plank at eye level (see ensureLibraryTextures: planks at 150*i + 142). */
const SHELF_Y = 742;
const REACH = 130;

/** Scene 3: library. Every interactive book is a project, an artwork or a video. Ends at a restricted door. */
export default class LibraryScene extends Phaser.Scene {
    private player!: Player;
    private books: Book[] = [];
    private focus?: Book;
    private panel!: BookPanel;
    private tip!: Phaser.GameObjects.Text;
    private keyE!: Phaser.Input.Keyboard.Key;
    private door!: Doorway;
    private doorX = 0;
    private leaving = false;

    constructor() {
        super('LibraryScene');
    }

    create(): void {
        this.leaving = false;
        this.books = [];
        this.focus = undefined;
        createPlayerAnimations(this);
        ensureLibraryTextures(this);

        // Layout
        const placed: Array<{ x: number; entry: BookEntry }> = [];
        const signs: Array<{ x: number; title: string; sub: string }> = [];
        const gaps: number[] = [600];
        let cursor = FIRST_BOOK_X;
        for (const sec of LIBRARY) {
            const first = cursor;
            for (const entry of sec.entries) {
                placed.push({ x: cursor, entry });
                cursor += BOOK_GAP;
            }
            const last = cursor - BOOK_GAP;
            signs.push({ x: (first + last) / 2, title: sec.title, sub: sec.sub });
            gaps.push(last + BOOK_GAP / 2 + SECTION_GAP / 2);
            cursor += SECTION_GAP;
        }
        const lastBookX = placed[placed.length - 1].x;
        this.doorX = lastBookX + 950;
        const worldW = this.doorX + 600;
        gaps.pop(); // the last gap leads to the door, not a desk

        this.physics.world.setBounds(0, 0, worldW, GAME_H);

        // Architecture
        this.add.tileSprite(0, 0, worldW, 940, 'lib_case').setOrigin(0, 0).setDepth(0);
        this.add.tileSprite(0, GROUND_Y, worldW, 140, 'lib_floor').setOrigin(0, 0).setDepth(2);
        this.add.rectangle(worldW / 2, GROUND_Y + 62, worldW, 56, 0x6e1f2e).setStrokeStyle(3, 0xc9a23f).setDepth(3);
        this.add.rectangle(worldW / 2, 0, worldW, 8, 0x000000, 0.5).setOrigin(0.5, 0).setDepth(1);

        // Doors: the one we came through, and the restricted one at the end
        new Doorway(this, 130, GROUND_Y, { label: 'GALLERY', glow: 0xffd9a0, width: 220, height: 480 });
        this.door = new Doorway(this, this.doorX, GROUND_Y, {
            style: 'bookcase',
            label: 'RESTRICTED ARCHIVE',
            glow: 0x7fa6ff,
            width: 320,
            height: 520,
        });
        this.addPlaque(600, 330, 'THE LIBRARY', 'Stand near a glowing book and press E to read it.', 64);

        // Section signs + desks
        signs.forEach((s) => this.addPlaque(s.x, 300, s.title, s.sub, 52, true));
        gaps.forEach((x) => this.addDesk(x));
        [FIRST_BOOK_X - 250, ...gaps, this.doorX - 450].forEach((x) => this.addLamp(x));

        // Books
        placed.forEach((p) => this.books.push(new Book(this, p.x, SHELF_Y, p.entry)));

        // Ground
        const ground = this.add.rectangle(worldW / 2, GROUND_Y + 70, worldW, 140, 0x000000, 0);
        this.physics.add.existing(ground, true);

        // Player
        this.player = new Player(this, 320, GROUND_Y);
        this.player.sprite.setDepth(10);
        this.physics.add.collider(this.player.sprite, ground);

        // Camera
        const cam = this.cameras.main;
        cam.setBounds(0, 0, worldW, GAME_H);
        cam.startFollow(this.player.sprite, true, 0.1, 0.1);
        cam.fadeIn(900, 255, 240, 210);

        // Interaction
        this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.panel = new BookPanel(this, () => this.player.setLocked(false));
        this.tip = this.add.text(0, 0, '', {
            fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
            backgroundColor: '#202350', padding: { x: 14, y: 8 },
        }).setOrigin(0.5, 1).setDepth(40).setVisible(false);

        const hint = this.add.text(30, GAME_H - 40, '← → move    Shift run    ↑ jump    E read', {
            fontFamily: FONT, fontSize: '20px', color: '#fdcffa', stroke: '#000000', strokeThickness: 4,
        }).setScrollFactor(0).setDepth(100);
        this.tweens.add({ targets: hint, alpha: 0, delay: 9000, duration: 1500 });
    }

    private addPlaque(x: number, y: number, title: string, sub: string, size: number, hanging = false): void {
        const t = this.add.text(x, y, title, {
            fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color: '#fdcffa', align: 'center',
        }).setOrigin(0.5).setDepth(8);
        const s = this.add.text(x, y + size * 0.8, sub, {
            fontFamily: FONT, fontSize: '24px', color: '#e6e1f5', align: 'center',
        }).setOrigin(0.5).setDepth(8);
        const w = Math.max(t.width, s.width) + 80;
        const h = size + 90;
        this.add.rectangle(x, y + 14, w, h, 0x1a0f08, 0.92).setStrokeStyle(4, 0xc9a23f).setDepth(7);
        if (hanging) {
            this.add.rectangle(x - w / 2 + 30, (y + 14 - h / 2) / 2, 4, y + 14 - h / 2, 0x6b551f).setDepth(6);
            this.add.rectangle(x + w / 2 - 30, (y + 14 - h / 2) / 2, 4, y + 14 - h / 2, 0x6b551f).setDepth(6);
        }
    }

    private addDesk(x: number): void {
        const y = GROUND_Y;
        this.add.rectangle(x, y - 100, 280, 22, 0x6b4426).setStrokeStyle(2, 0x2f1c10).setDepth(3);
        this.add.rectangle(x - 115, y - 50, 16, 100, 0x3a2414).setDepth(3);
        this.add.rectangle(x + 115, y - 50, 16, 100, 0x3a2414).setDepth(3);
        // open book + banker's lamp
        this.add.rectangle(x - 40, y - 116, 56, 8, 0xf3e6c8).setDepth(3);
        this.add.rectangle(x + 18, y - 116, 56, 8, 0xf8edd2).setDepth(3);
        this.add.rectangle(x + 90, y - 124, 10, 24, 0x1f5a3a).setDepth(3);
        this.add.rectangle(x + 90, y - 146, 44, 20, 0x1f7a4a).setDepth(3);
        this.add.image(x + 90, y - 140, 'glow').setScale(4, 3).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setDepth(30);
    }

    private addLamp(x: number): void {
        this.add.rectangle(x, 70, 3, 140, 0x6b551f).setDepth(6);
        this.add.rectangle(x, 150, 74, 28, 0x1f5a3a).setStrokeStyle(2, 0x0e2a1a).setDepth(6);
        const g = this.add.image(x, 190, 'glow').setScale(6, 5).setTint(0xffd27a).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.32).setDepth(30);
        this.tweens.add({ targets: g, alpha: { from: 0.26, to: 0.38 }, duration: 1500 + Math.random() * 800, yoyo: true, repeat: -1 });
    }

    update(): void {
        this.player.update();
        const px = this.player.sprite.x;
        // consume the key press every frame so an earlier press can't open a book later
        const pressedE = Phaser.Input.Keyboard.JustDown(this.keyE);

        if (this.panel.isOpen) {
            this.player.setLocked(true);
            return;
        }

        // nearest book within reach
        let near: Book | undefined;
        let best = REACH;
        for (const b of this.books) {
            const d = Math.abs(b.x - px);
            if (d < best) {
                best = d;
                near = b;
            }
        }
        if (near !== this.focus) {
            this.focus?.setFocused(false);
            near?.setFocused(true);
            this.focus = near;
        }
        if (near && !this.leaving) {
            this.tip.setText(`E — read “${near.entry.title}”`).setPosition(near.x, near.topY - 20).setVisible(true);
            if (pressedE) {
                this.player.setLocked(true);
                this.panel.open(near.entry);
            }
        } else {
            this.tip.setVisible(false);
        }

        if (!this.leaving && px > this.doorX - 300) {
            this.leaving = true;
            this.tip.setVisible(false);
            walkThroughDoor(this, this.player, this.door, 'ThunderCaveScene', { fade: [0, 0, 0], zoom: 1.25, shake: true });
        }
    }
}
