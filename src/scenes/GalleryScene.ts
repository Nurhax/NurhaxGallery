import Phaser from 'phaser';
import Player from '../player/Player';
import Painting from '../objects/Painting';
import Doorway from '../objects/Doorway';
import { COLORS, FONT, GAME_H, GROUND_Y } from '../config';
import { JOBS } from '../data/portfolio';
import { createPlayerAnimations } from '../utils/animations';
import { ensureGalleryTextures, makePaintingTexture } from '../utils/textures';
import { walkThroughDoor } from '../utils/transitions';
import { PAINTING_H, PAINTING_W } from '../objects/Painting';

const FIRST_X = 1100;
const SPACING = 1000;
const PAINTING_CY = 430;

/** Scene 2: art gallery, one big painting per job. Ends at a door into the library. */
export default class GalleryScene extends Phaser.Scene {
    private player!: Player;
    private paintings: Painting[] = [];
    private door!: Doorway;
    private doorX = 0;
    private leaving = false;

    constructor() {
        super('GalleryScene');
    }

    create(): void {
        this.leaving = false;
        this.paintings = [];
        createPlayerAnimations(this);
        ensureGalleryTextures(this);

        const lastX = FIRST_X + SPACING * (JOBS.length - 1);
        this.doorX = lastX + 900;
        const worldW = this.doorX + 600;

        this.physics.world.setBounds(0, 0, worldW, GAME_H);

        // Architecture
        this.add.tileSprite(0, 0, worldW, 790, 'gal_wall').setOrigin(0, 0).setDepth(0);
        this.add.tileSprite(0, 790, worldW, 150, 'gal_wainscot').setOrigin(0, 0).setDepth(1);
        this.add.tileSprite(0, GROUND_Y, worldW, 140, 'gal_floor').setOrigin(0, 0).setDepth(2);
        this.add.rectangle(worldW / 2, 30, worldW, 60, 0x14102a).setDepth(1);
        this.add.rectangle(worldW / 2, 64, worldW, 8, 0xc9a23f).setDepth(1);
        this.add.rectangle(worldW / 2, 786, worldW, 10, 0xc9a23f, 0.8).setDepth(2);

        // Entrance wall text
        this.add.text(400, 330, 'THE WORK GALLERY', {
            fontFamily: FONT, fontSize: '64px', fontStyle: 'bold', color: '#fdcffa', align: 'center',
            stroke: '#120f2e', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(3);
        this.add.text(400, 410, 'One painting for every job.\nWalk through time  →', {
            fontFamily: FONT, fontSize: '28px', color: '#e6e1f5', align: 'center', lineSpacing: 8,
        }).setOrigin(0.5, 0).setDepth(3);

        // Paintings (oldest -> newest)
        JOBS.forEach((job, i) => {
            const key = `painting_${i}`;
            makePaintingTexture(this, key, PAINTING_W, PAINTING_H, job.hue, 1000 + i * 37);
            this.paintings.push(new Painting(this, FIRST_X + SPACING * i, PAINTING_CY, job, key, i, JOBS.length));
        });

        // Benches between paintings
        for (let i = 0; i < JOBS.length - 1; i++) this.addBench(FIRST_X + SPACING * i + SPACING / 2);

        // Door to the library
        this.door = new Doorway(this, this.doorX, GROUND_Y, { label: 'THE LIBRARY  →', glow: 0xffd9a0 });

        // Ground
        const ground = this.add.rectangle(worldW / 2, GROUND_Y + 70, worldW, 140, 0x000000, 0);
        this.physics.add.existing(ground, true);

        // Player
        this.player = new Player(this, 260, GROUND_Y);
        this.player.sprite.setDepth(10);
        this.physics.add.collider(this.player.sprite, ground);

        // Camera
        const cam = this.cameras.main;
        cam.setBounds(0, 0, worldW, GAME_H);
        cam.startFollow(this.player.sprite, true, 0.1, 0.1);
        cam.fadeIn(1400, 255, 255, 255); // wake up from the light

        // Controls hint
        const hint = this.add.text(30, GAME_H - 40, '← → move    Shift run    ↑ jump', {
            fontFamily: FONT, fontSize: '20px', color: '#fdcffa', stroke: '#000000', strokeThickness: 4,
        }).setScrollFactor(0).setDepth(100);
        this.tweens.add({ targets: hint, alpha: 0, delay: 9000, duration: 1500 });
    }

    private addBench(x: number): void {
        const y = GROUND_Y;
        this.add.rectangle(x, y - 62, 240, 20, 0x5a3a22).setStrokeStyle(2, 0x2f1c10).setDepth(3);
        this.add.rectangle(x - 100, y - 30, 14, 60, 0x2f1c10).setDepth(3);
        this.add.rectangle(x + 100, y - 30, 14, 60, 0x2f1c10).setDepth(3);
        this.add.rectangle(x, y - 94, 240, 8, COLORS.purple, 0.0).setDepth(3);
    }

    update(): void {
        this.player.update();
        const px = this.player.sprite.x;
        this.paintings.forEach((p) => p.update(px));

        if (!this.leaving && px > this.doorX - 280) {
            this.leaving = true;
            walkThroughDoor(this, this.player, this.door, 'LibraryScene', { fade: [255, 240, 210], zoom: 1.3 });
        }
    }
}
