import Phaser from 'phaser';
import Player from '../player/Player';
import Exhibit from '../objects/Exhibit';

export default class MainScene extends Phaser.Scene {
    // private player!: Player;
    // private exhibit!: Exhibit;

    constructor() {
        super('MainScene');
    }

    preload(): void {
        // Load assets
        this.load.image('bgShadow', '/images/ShadowBackground.png');
        this.load.image('platforms', '/images/Platform.png');
        this.load.image('overlay', '/images/Overlayer.png');
        // this.load.spritesheet('player', '/images/player.png', { frameWidth: 32, frameHeight: 48 });
        // this.load.image('exhibit', '/images/exhibit.png');
    }

    create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.image(width / 2, height / 2, 'bgShadow')
        .setOrigin(0.5)
        .setScrollFactor(0);

    // Platform example
    this.add.image(width / 2, height - 100, 'platforms')
        .setOrigin(0.5, 1);

    // Overlay (UI-ish)
    this.add.image(width / 2, height / 2, 'overlay')
        .setOrigin(0.5)
        .setScrollFactor(0);

        // // Create player
        // this.player = new Player(this, 100, 450);

        // // Create an interactable exhibit
        // this.exhibit = new Exhibit(this, 400, 500, 'exhibit', 'My Artwork Project');

        // // Camera follow
        // this.cameras.main.startFollow(this.player.sprite);
    }

    update(time: number, delta: number): void {
        // this.player.update();
    }
}
