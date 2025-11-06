import Phaser from 'phaser';
import Player from '../player/Player';
import Exhibit from '../objects/Exhibit';

export default class MainScene extends Phaser.Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private bgm?: Phaser.Sound.BaseSound;


    constructor() {
        super('MainScene');
    }

    preload(): void {
        // Load assets
        this.load.image('bgShadow', 'images/ShadowBackground.png');
        this.load.image('platforms', 'images/Platform.png');
        this.load.image('overlay', 'images/Overlayer.png');
        this.load.image('player_right', 'images/Haku_Idle_Right.png');
        this.load.image('player_left', 'images/Haku_Idle_Left.png');
        // Running spritesheets (right and left). Original frame size for the player is 123x220
        // Place the two PNGs in public/images/Run as `Haku_Run_Right.png` and `Haku_Run_Left.png`.
        this.load.spritesheet('player_run_right', 'images/Run/Haku_Run_Right.png', { frameWidth: 125, frameHeight: 220 });
        this.load.spritesheet('player_run_left', 'images/Run/Haku_Run_Left.png', { frameWidth: 125, frameHeight: 220 });
        // Background music for main scene
        this.load.audio('bgm', 'audio/BGM1.mp3');

    }

    // In MainScene.ts

    create(): void {
        const { width, height } = this.scale;

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
        const playerTexture = this.textures.get('player_right');
        const playerFrame = playerTexture.getSourceImage();
        const playerHeight = playerFrame.height;
        
        // Position so feet are at the floor's top
        this.player = new Player(this, 600, floorTopY); // 50 is an arbitrary offset to position above the floor
        
        // Create run animations (right and left) from the loaded spritesheets.
        const frameWidth = 123;
        const frameHeight = 220;

        const createAnimFromKey = (texKey: string, animKey: string) => {
            const src = this.textures.get(texKey).getSourceImage();
            if (!src) return;
            const cols = Math.floor(src.width / frameWidth) || 1;
            const rows = Math.floor(src.height / frameHeight) || 1;
            const frameCount = cols * rows;
            this.anims.create({
                key: animKey,
                frames: this.anims.generateFrameNumbers(texKey, { start: 0, end: Math.max(0, frameCount - 1) }),
                frameRate: 12,
                repeat: -1
            });
        };

        createAnimFromKey('player_run_right', 'run_right');
        createAnimFromKey('player_run_left', 'run_left');

        // Collisions
        this.physics.add.collider(this.player.sprite, this.platforms);
        
        // Overlay
        this.add.image(width / 2, height / 2, 'overlay')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // Play background music (looped). Keep a reference so we can stop/destroy it on shutdown.
        if (this.sound && this.cache.audio.exists('bgm')) {
            this.bgm = this.sound.add('bgm', { loop: true, volume: 0.1 });
            this.bgm.play();
        }

        // Clean up music when the scene shuts down (prevents duplicates on restart)
        this.events.on('shutdown', () => {
            if (this.bgm) {
                this.bgm.stop();
                this.bgm.destroy();
                this.bgm = undefined;
            }
        });
    }

    update(time: number, delta: number): void {
        this.player.update();
    }
}