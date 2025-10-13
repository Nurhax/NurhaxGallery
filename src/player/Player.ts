import Phaser from 'phaser';

export default class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private facing: 'left' | 'right' = 'right';

    constructor(private scene: Phaser.Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player_right');
        this.sprite.setOrigin(0.5, 1); // anchor at feet
        this.sprite.setCollideWorldBounds(true);

        // Input
        this.cursors = scene.input!.keyboard!.createCursorKeys();
    }

    update(): void {
        const speed = 250;
        const jumpSpeed = -400;

        //Walking
        if (this.cursors.left?.isDown) {
            this.sprite.setVelocityX(-speed);
            this.sprite.setTexture('player_left');
            this.facing = 'left';
        } else if (this.cursors.right?.isDown) {
            this.sprite.setVelocityX(speed);
            this.sprite.setTexture('player_right');
            this.facing = 'right';
        } else {
            this.sprite.setVelocityX(0);
        }


        // Jumping
        if (this.cursors.up?.isDown && (this.sprite.body as Phaser.Physics.Arcade.Body).blocked.down) {
            this.sprite.setVelocityY(jumpSpeed);
        }
    }
}
