import Phaser from 'phaser';

export default class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private facing: 'left' | 'right' = 'right';
    private locked = false;
    private autoDir: -1 | 0 | 1 = 0;

    //Original sprite size 123x220
    constructor(private scene: Phaser.Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player_right');
        this.sprite.setScale(0.8);
        this.sprite.setOrigin(0.5, 1); // anchor at feet
        this.sprite.setCollideWorldBounds(true);

        // Input
        this.cursors = scene.input!.keyboard!.createCursorKeys();
    }

    /** 1 = facing right, -1 = facing left */
    get facingDir(): 1 | -1 {
        return this.facing === 'right' ? 1 : -1;
    }

    /** Torso position, handy for aiming and hit tests. */
    get center(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(this.sprite.x, this.sprite.y - this.sprite.displayHeight * 0.5);
    }

    /** Ignore keyboard input (cutscenes, menus, game over). */
    setLocked(locked: boolean): void {
        this.locked = locked;
    }

    /** Walk by itself (used by scene transitions). */
    autoWalk(dir: -1 | 1): void {
        this.autoDir = dir;
    }

    stopAuto(): void {
        this.autoDir = 0;
    }

    update(): void {
        const baseSpeed = 250;
        const sprintSpeed = 400; // when Shift is held
        const jumpSpeed = -500;

        // Animation speed
        const baseFrameRate = 12;
        const sprintFrameRate = 20;

        let dir: -1 | 0 | 1 = 0;
        let sprint = false;
        let jump = false;

        if (this.autoDir !== 0) {
            dir = this.autoDir;
        } else if (!this.locked) {
            dir = this.cursors.left?.isDown ? -1 : this.cursors.right?.isDown ? 1 : 0;
            sprint = !!this.cursors.shift?.isDown;
            jump = !!this.cursors.up?.isDown;
        }

        const speed = sprint ? sprintSpeed : baseSpeed;

        if (dir !== 0) {
            this.sprite.setVelocityX(dir * speed);
            this.facing = dir < 0 ? 'left' : 'right';
            const key = dir < 0 ? 'run_left' : 'run_right';
            if (this.scene.anims.exists(key)) {
                this.sprite.setFlipX(false);
                this.sprite.anims.play(key, true);
                this.sprite.anims.timeScale = sprint ? sprintFrameRate / baseFrameRate : 1;
            } else {
                // Fallback: no run sheet loaded, just use the idle picture
                this.sprite.setTexture(dir < 0 ? 'player_left' : 'player_right');
            }
        } else {
            this.sprite.setVelocityX(0);
            if (this.sprite.anims.isPlaying) this.sprite.anims.stop();
            this.sprite.setTexture(this.facing === 'left' ? 'player_left' : 'player_right');
            this.sprite.setFlipX(false);
        }

        // Jumping
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        if (jump && (body.blocked.down || body.touching.down)) {
            this.sprite.setVelocityY(jumpSpeed);
        }
    }
}
