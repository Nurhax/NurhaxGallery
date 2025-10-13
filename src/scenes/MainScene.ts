import Phaser from 'phaser';
import Player from '../player/Player';
import Exhibit from '../objects/Exhibit';

export default class MainScene extends Phaser.Scene {
    private player!: Player;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    // private exhibit!: Exhibit;

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
        // this.load.image('exhibit', '/images/exhibit.png');
    }

    create(): void {
        const { width, height } = this.scale;

        // Background
        this.add.image(width / 2, height / 2, 'bgShadow')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // Platforms
        this.platforms = this.physics.add.staticGroup();

        // Platform example
        const floor = this.platforms.create(width / 2, height + 150, 'platforms')
            .setOrigin(0.5,1)
            .setScale(3, 1.5) // stretch to fit width
            .refreshBody();

        // Overlay (UI-ish)
        this.add.image(width / 2, height / 2, 'overlay')
            .setOrigin(0.5)
            .setScrollFactor(0);

        // Create player
        const floorTop = floor.getBounds().top;
        this.player = new Player(this, 1000, 1000);

        // Collisions
        this.physics.add.collider(this.player.sprite, this.platforms);

        // // Create an interactable exhibit
        // this.exhibit = new Exhibit(this, 400, 500, 'exhibit', 'My Artwork Project');

        // // Camera follow
        this.cameras.main.startFollow(this.player.sprite);
    }

    update(time: number, delta: number): void {
        this.player.update();

    }
}
