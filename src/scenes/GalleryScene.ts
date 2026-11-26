import Phaser from 'phaser';
import Player from '../player/Player';
import Painting, { PAINTING_H, PAINTING_W } from '../objects/Painting';
import Doorway from '../objects/Doorway';
import CvStation from '../objects/CvStation';
import { COLORS, FONT, GAME_H, GROUND_Y } from '../config';
import { CV, JOBS } from '../data/portfolio';
import { createPlayerAnimations } from '../utils/animations';
import { downloadFile } from '../utils/download';
import { ensureGalleryTextures, ensureGlowTexture, makePaintingTexture } from '../utils/textures';
import { walkThroughDoor } from '../utils/transitions';
import { CARDS } from './TransitionScene';

const MIN_FIRST_X = 1400;
const SPACING = 1000;
const PAINTING_CY = 430;
const CV_REACH = 170;

/** Scene 2: art gallery, one big painting per job, then a CV pedestal, then a door into the library. */
export default class GalleryScene extends Phaser.Scene {
    private player!: Player;
    private paintings: Painting[] = [];
    private door!: Doorway;
    private doorX = 0;
    private leaving = false;
    private cv!: CvStation;
    private keyE!: Phaser.Input.Keyboard.Key;
    private tip!: Phaser.GameObjects.Text;
    private tipLockUntil = 0;

    constructor() {
        super('GalleryScene');
    }

    /** Used by the pause controller: no pausing during the door cutscene. */
    canPause(): boolean {
        return !this.leaving;
    }

    create(): void {
        this.leaving = false;
        this.paintings = [];
        this.tipLockUntil = 0;
        createPlayerAnimations(this);
        ensureGlowTexture(this);
        ensureGalleryTextures(this); // no-ops when the loading screen already did the work

        // Entrance wall text first: the first painting is placed AFTER it, so they can never overlap.
        const title = this.add.text(560, 330, 'THE WORK\nGALLERY', {
            fontFamily: FONT, fontSize: '76px', fontStyle: 'bold', color: '#fdcffa', align: 'center', lineSpacing: 6,
            stroke: '#120f2e', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(3);
        const subtitle = this.add.text(560, title.y + title.height / 2 + 24, 'One painting for every job.\nWalk through time  →', {
            fontFamily: FONT, fontSize: '28px', color: '#e6e1f5', align: 'center', lineSpacing: 8,
        }).setOrigin(0.5, 0).setDepth(3);
        const textRight = Math.max(title.x + title.width / 2, subtitle.x + subtitle.width / 2);
        const firstX = Math.max(MIN_FIRST_X, textRight + 200 + (PAINTING_W + 60) / 2);

        const lastX = firstX + SPACING * (JOBS.length - 1);
        const cvX = lastX + 620;
        this.doorX = lastX + 1300;
        const worldW = this.doorX + 600;

        this.physics.world.setBounds(0, 0, worldW, GAME_H);

        // Architecture
        this.add.tileSprite(0, 0, worldW, 790, 'gal_wall').setOrigin(0, 0).setDepth(0);
        this.add.tileSprite(0, 790, worldW, 150, 'gal_wainscot').setOrigin(0, 0).setDepth(1);
        this.add.tileSprite(0, GROUND_Y, worldW, 140, 'gal_floor').setOrigin(0, 0).setDepth(2);
        this.add.rectangle(worldW / 2, 30, worldW, 60, 0x14102a).setDepth(1);
        this.add.rectangle(worldW / 2, 64, worldW, 8, 0xc9a23f).setDepth(1);
        this.add.rectangle(worldW / 2, 786, worldW, 10, 0xc9a23f, 0.8).setDepth(2);

        // Paintings (oldest -> newest)
        JOBS.forEach((job, i) => {
            const key = `painting_${i}`;
            makePaintingTexture(this, key, PAINTING_W, PAINTING_H, job.hue, 1000 + i * 37);
            this.paintings.push(new Painting(this, firstX + SPACING * i, PAINTING_CY, job, key, i, JOBS.length));
        });

        // Benches between paintings
        for (let i = 0; i < JOBS.length - 1; i++) this.addBench(firstX + SPACING * i + SPACING / 2);

        // CV pedestal at the end of the walk
        this.add.text(cvX, 250, 'THANKS FOR WALKING\n\nTHROUGH TIME', {
            fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#fdcffa', align: 'center',
            stroke: '#120f2e', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(3);
        this.cv = new CvStation(this, cvX, GROUND_Y, () => this.downloadCv());

        // Door to the library
        this.door = new Doorway(this, this.doorX, GROUND_Y, { label: 'THE LIBRARY  →', glow: 0xffd9a0 });

        // Ground
        const ground = this.add.rectangle(worldW / 2, GROUND_Y + 70, worldW, 140, 0x000000, 0);
        this.physics.add.existing(ground, true);

        // Player
        this.player = new Player(this, 260, GROUND_Y);
        this.player.sprite.setDepth(10);
        this.physics.add.collider(this.player.sprite, ground);

        // Camera: tighter follow so scrolling keeps up with the player (was 0.1 = ~60px of trailing lag)
        const cam = this.cameras.main;
        cam.setBounds(0, 0, worldW, GAME_H);
        cam.startFollow(this.player.sprite, true, 0.2, 1);
        cam.fadeIn(350, 0, 0, 0);

        this.keyE = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.tip = this.add.text(0, 0, '', {
            fontFamily: FONT, fontSize: '22px', fontStyle: 'bold', color: '#ffffff',
            backgroundColor: '#202350', padding: { x: 14, y: 8 },
        }).setOrigin(0.5, 1).setDepth(40).setVisible(false);

        // Controls hint
        const hint = this.add.text(30, GAME_H - 40, '← → move    Shift run    ↑ jump    E interact    Esc pause', {
            fontFamily: FONT, fontSize: '20px', color: '#fdcffa', stroke: '#000000', strokeThickness: 4,
        }).setScrollFactor(0).setDepth(100);
        this.tweens.add({ targets: hint, alpha: 0, delay: 9000, duration: 1500 });
    }

    private addBench(x: number): void {
        const y = GROUND_Y;
        this.add.rectangle(x, y - 62, 240, 20, 0x5a3a22).setStrokeStyle(2, 0x2f1c10).setDepth(3);
        this.add.rectangle(x - 100, y - 30, 14, 60, 0x2f1c10).setDepth(3);
        this.add.rectangle(x + 100, y - 30, 14, 60, 0x2f1c10).setDepth(3);
        this.add.rectangle(x, y - 94, 240, 8, COLORS.purple, 0).setDepth(3);
    }

    private downloadCv(): void {
        downloadFile(CV.path, CV.filename);
        this.tip.setText('Downloading CV…');
        this.tipLockUntil = this.time.now + 2000;
    }

    update(time: number): void {
        this.player.update();
        const px = this.player.sprite.x;
        const pressedE = Phaser.Input.Keyboard.JustDown(this.keyE); // consume every frame
        this.paintings.forEach((p) => p.update(px));

        // CV pedestal
        const nearCv = !this.leaving && Math.abs(px - this.cv.x) < CV_REACH;
        this.cv.setFocused(nearCv);
        if (nearCv) {
            if (time > this.tipLockUntil) this.tip.setText('E — download my CV (PDF)');
            this.tip.setPosition(this.cv.x, this.cv.topY).setVisible(true);
            if (pressedE && time > this.tipLockUntil) this.downloadCv();
        } else {
            this.tip.setVisible(false);
        }

        if (!this.leaving && px > this.doorX - 280) {
            this.leaving = true;
            this.tip.setVisible(false);
            walkThroughDoor(this, this.player, this.door, 'LibraryScene', CARDS.library, { zoom: 1.3 });
        }
    }
}