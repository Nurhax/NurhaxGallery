import Phaser from 'phaser';

export default class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(private scene: Phaser.Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setCollideWorldBounds(true);

        // Input
        this.cursors = scene.input!.keyboard!.createCursorKeys();
    }

    update(): void {
        const speed = 160;
        const jumpSpeed = -330;

        if (this.cursors.left?.isDown) {
            this.sprite.setVelocityX(-speed);
            this.sprite.flipX = true;
        } else if (this.cursors.right?.isDown) {
            this.sprite.setVelocityX(speed);
            this.sprite.flipX = false;
        } else {
            this.sprite.setVelocityX(0);
        }

        if (this.cursors.up?.isDown && this.sprite.body!.blocked.down) {
            this.sprite.setVelocityY(jumpSpeed);
        }
    }
}
