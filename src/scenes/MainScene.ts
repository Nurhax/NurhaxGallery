import Phaser from 'phaser';
import Player from '../player/Player';
import { FONT } from '../config';
import { createPlayerAnimations } from '../utils/animations';
import { changeScene } from '../utils/transitions';
import { CARDS } from './TransitionScene';

/** Scene 1: the cave. Walk right, toward the light, to leave it. */
export default class MainScene extends Phaser.Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private bgm?: Phaser.Sound.BaseSound;
    private exitGlow!: Phaser.GameObjects.Image;
    private exiting = false;

    constructor() {
        super('MainScene');
    }

    create(): void {
        const { width, height } = this.scale;
        this.exiting = false;
        this.cameras.main.fadeIn(700, 0, 0, 0);

        // Background
        this.add.image(width / 2, height / 2, 'bgShadow')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // Platforms
        this.platforms = this.physics.add.staticGroup();

        const floor = this.platforms.create(width / 2, height , 'platforms')
            .setOrigin(0.5, 1)
            .setScale(1, 1)
            .refreshBody(); // This is crucial for static bodies

        // Get the absolute top coordinate of the floor's physics body
        const floorTopY = (floor.body as Phaser.Physics.Arcade.StaticBody).y;

        // Create the player with its feet positioned exactly at the floor's top
        this.player = new Player(this, 600, floorTopY);

        // Run animations (right and left) from the loaded spritesheets.
        createPlayerAnimations(this);

        // Collisions
        this.physics.add.collider(this.player.sprite, this.platforms);

        // Overlay
        this.add.image(width / 2, height / 2, 'overlay')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // The light at the end of the tunnel
        this.exitGlow = this.add.image(width - 30, floorTopY - 190, 'glow')
            .setScale(5, 8)
            .setTint(0xfff1c9)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(50)
            .setAlpha(0.35);
        this.tweens.add({
            targets: this.exitGlow,
            alpha: { from: 0.3, to: 0.55 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });

        const hint = this.add.text(width - 520, floorTopY - 420, 'Follow the light  →', {
            fontFamily: FONT, fontSize: '34px', fontStyle: 'bold', color: '#fdcffa', align: 'center',
            stroke: '#120f2e', strokeThickness: 6,
        }).setOrigin(0.5).setDepth(60).setAlpha(0);
        this.tweens.add({ targets: hint, alpha: 0.9, delay: 2500, duration: 1500, yoyo: true, hold: 3000 });

        // Play background music (looped). Keep a reference so we can stop/destroy it on shutdown.
        // if (this.sound && this.cache.audio.exists('bgm')) {
        //     this.bgm = this.sound.add('bgm', { loop: true, volume: 0.1 });
        //     this.bgm.play();
        // }

        // Clean up music when the scene shuts down (prevents duplicates on restart)
        this.events.on('shutdown', () => {
            if (this.bgm) {
                this.bgm.stop();
                this.bgm.destroy();
                this.bgm = undefined;
            }
        });
    }

    update(): void {
        this.player.update();
        if (this.exiting) return;

        const { width } = this.scale;
        const px = this.player.sprite.x;
        // the light grows as you get closer
        const prox = Phaser.Math.Clamp((px - (width - 800)) / 650, 0, 1);
        this.exitGlow.setScale(5 + prox * 3, 8 + prox * 4);

        if (px > width - 130) this.beginExit();
    }

    /** The pause menu must not open during the exit cutscene. */
    canPause(): boolean {
        return !this.exiting;
    }

    /** Walk into the light: it swells while the chapter card slides in over the screen. */
    private beginExit(): void {
        this.exiting = true;
        this.tweens.add({
            targets: this.player.sprite,
            alpha: 0,
            duration: 800,
            ease: 'Sine.easeIn',
            onComplete: () => changeScene(this, 'GalleryScene', CARDS.gallery),
        });
    }
}