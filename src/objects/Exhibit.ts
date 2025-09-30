import Phaser from 'phaser';
import Player from '../player/Player';

export default class Exhibit {
    private sprite: Phaser.Physics.Arcade.Sprite;

    constructor(
        private scene: Phaser.Scene,
        x: number,
        y: number,
        key: string,
        private title: string
    ) {
        this.sprite = scene.physics.add.staticSprite(x, y, key) as Phaser.Physics.Arcade.Sprite;

        // Add overlap detection with player
        const player = (scene as any).player as Player; // Type assertion for MainScene
        if (player) {
            scene.physics.add.overlap(player.sprite, this.sprite, this.onInteract, undefined, this);
        }
    }

    private onInteract(): void {
        // Replace alert with your modal/UI later
        alert(`You found: ${this.title}`);
    }
}
