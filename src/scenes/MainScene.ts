import Phaser from 'phaser';
import Player from '../player/Player';
import Exhibit from '../objects/Exhibit';

export default class MainScene extends Phaser.Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;


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
        this.player = new Player(this, 350, floorTopY); // 50 is an arbitrary offset to position above the floor
        
        // Collisions
        this.physics.add.collider(this.player.sprite, this.platforms);
        
        // Overlay
        this.add.image(width / 2, height / 2, 'overlay')
            .setOrigin(0.5)
            .setScrollFactor(0);
    }

    update(time: number, delta: number): void {
        this.player.update();
    }
}