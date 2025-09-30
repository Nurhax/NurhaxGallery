import Phaser from 'phaser';
import Player from '../player/Player';
import Exhibit from '../objects/Exhibit';

export default class MainScene extends Phaser.Scene {
    private player!: Player;
    private exhibit!: Exhibit;

    constructor() {
        super('MainScene');
    }

    preload(): void {
        // Load assets
        this.load.image('background', '/images/background.png');
        this.load.spritesheet('player', '/images/player.png', { frameWidth: 32, frameHeight: 48 });
        this.load.image('exhibit', '/images/exhibit.png');
    }

    create(): void {
        this.add.image(1920, 1080, 'background');

        // Create player
        this.player = new Player(this, 100, 450);

        // Create an interactable exhibit
        this.exhibit = new Exhibit(this, 400, 500, 'exhibit', 'My Artwork Project');

        // Camera follow
        this.cameras.main.startFollow(this.player.sprite);
    }

    update(time: number, delta: number): void {
        this.player.update();
    }
}
