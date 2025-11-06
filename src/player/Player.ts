import Phaser from 'phaser';

export default class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private facing: 'left' | 'right' = 'right';

    //Original sprite size 123x220
    constructor(private scene: Phaser.Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player_right');
        this.sprite.setScale(0.8);
        this.sprite.setOrigin(0.5, 1); // anchor at feet
        this.sprite.setCollideWorldBounds(true);

        // Input
        this.cursors = scene.input!.keyboard!.createCursorKeys();
    }

    update(): void {
        const baseSpeed = 250;
        const sprintSpeed = 400; // when Shift is held
        const jumpSpeed = -500;

        // Animation frame rates
        const baseFrameRate = 12;
        const sprintFrameRate = 20;

        const isSprinting = !!this.cursors.shift?.isDown;
        const speed = isSprinting ? sprintSpeed : baseSpeed;
        const animFrameRate = isSprinting ? sprintFrameRate : baseFrameRate;

        //Walking
        if (this.cursors.left?.isDown) {
            this.sprite.setVelocityX(-speed);
            this.facing = 'left';
            // Play left-run animation if available, otherwise fall back to flipping the right-run or using the left idle
            if (this.sprite.anims.currentAnim?.key !== 'run_left') {
                if (this.scene.anims.exists('run_left')) {
                    // Play and then apply the desired frameRate when sprinting
                    this.sprite.anims.play('run_left', true);
                    if (this.sprite.anims.currentAnim) {
                        this.sprite.anims.currentAnim.frameRate = animFrameRate;
                    }
                } else if (this.scene.anims.exists('run_right')) {
                    this.sprite.anims.play('run_right', true);
                    if (this.sprite.anims.currentAnim) {
                        this.sprite.anims.currentAnim.frameRate = animFrameRate;
                    }
                    this.sprite.setFlipX(true);
                }
            } else {
                // If already playing, ensure the animation plays at the correct frameRate when sprint state changes
                if (this.sprite.anims.currentAnim) {
                    this.sprite.anims.currentAnim.frameRate = animFrameRate;
                }
            }
        } else if (this.cursors.right?.isDown) {
            this.sprite.setVelocityX(speed);
            this.facing = 'right';
            if (this.sprite.anims.currentAnim?.key !== 'run_right') {
                if (this.scene.anims.exists('run_right')) {
                    this.sprite.anims.play('run_right', true);
                    if (this.sprite.anims.currentAnim) {
                        this.sprite.anims.currentAnim.frameRate = animFrameRate;
                    }
                } else if (this.scene.anims.exists('run_left')) {
                    this.sprite.anims.play('run_left', true);
                    if (this.sprite.anims.currentAnim) {
                        this.sprite.anims.currentAnim.frameRate = animFrameRate;
                    }
                    this.sprite.setFlipX(true);
                }
            } else {
                if (this.sprite.anims.currentAnim) {
                    this.sprite.anims.currentAnim.frameRate = animFrameRate;
                }
            }
            this.sprite.setFlipX(false);
        } else {
            this.sprite.setVelocityX(0);
            // Stop running animation and set idle texture based on facing
            // Stop run animations (either run_right or run_left)
            if (this.sprite.anims.currentAnim && (this.sprite.anims.currentAnim.key === 'run_right' || this.sprite.anims.currentAnim.key === 'run_left')) {
                this.sprite.anims.stop();
            }
            if (this.facing === 'left') {
                this.sprite.setTexture('player_left');
                this.sprite.setFlipX(false); // idle left uses dedicated left texture
            } else {
                this.sprite.setTexture('player_right');
                this.sprite.setFlipX(false);
            }
        }


        // Jumping
        if (this.cursors.up?.isDown && (this.sprite.body as Phaser.Physics.Arcade.Body).blocked.down) {
            this.sprite.setVelocityY(jumpSpeed);
        }
    }
}
