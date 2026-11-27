import Phaser from 'phaser';

// --- Jump feel (Hollow-Knight-style): fast rise, heavy fall, variable height, coyote time, input buffer.
// World gravity is GRAVITY (see config.ts). The player adds extra gravity on top of it:
const JUMP_V = -1100; //          apex ≈ 230px with the world gravity
const FALL_EXTRA = 1400; //       falling is heavier than rising
const CUT_EXTRA = 3800; //        releasing Up early cuts the jump short
const MAX_FALL = 1400;
const COYOTE_MS = 90; //          can still jump this long after leaving a ledge
const BUFFER_MS = 110; //         a jump pressed this early before landing still counts
const HORIZONTAL_RESPONSE_MS = 80;

export default class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private facing: 'left' | 'right' = 'right';
    private locked = false;
    private autoDir: -1 | 0 | 1 = 0;
    private lastGrounded = -1e9;
    private lastJumpPress = -1e9;

    //Original sprite size 123x220
    constructor(private scene: Phaser.Scene, x: number, y: number) {
        this.sprite = scene.physics.add.sprite(x, y, 'player_right');
        this.sprite.setScale(0.8);
        this.sprite.setOrigin(0.5, 1); // anchor at feet
        this.sprite.setCollideWorldBounds(true);
        (this.sprite.body as Phaser.Physics.Arcade.Body).setMaxVelocityY(MAX_FALL);

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

        // Animation speed
        const baseFrameRate = 12;
        const sprintFrameRate = 20;

        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        const now = this.scene.time.now;

        let dir: -1 | 0 | 1 = 0;
        let sprint = false;
        let upHeld = false;

        if (this.autoDir !== 0) {
            dir = this.autoDir;
        } else if (!this.locked) {
            dir = this.cursors.left?.isDown ? -1 : this.cursors.right?.isDown ? 1 : 0;
            sprint = !!this.cursors.shift?.isDown;
            upHeld = !!this.cursors.up?.isDown;
            if (this.cursors.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.lastJumpPress = now;
        }

        const speed = sprint ? sprintSpeed : baseSpeed;
        const targetVelocityX = dir * speed;
        const delta = Math.min(this.scene.game.loop.delta, 50);
        const velocityBlend = 1 - Math.exp(-delta / HORIZONTAL_RESPONSE_MS);
        body.setVelocityX(Phaser.Math.Linear(body.velocity.x, targetVelocityX, velocityBlend));

        if (dir !== 0 || Math.abs(body.velocity.x) > 5) {
            if (dir !== 0) this.facing = dir < 0 ? 'left' : 'right';
            const animationKey = this.facing === 'left' ? 'run_left' : 'run_right';
            if (this.scene.anims.exists(animationKey)) {
                this.sprite.setFlipX(false);
                this.sprite.anims.play(animationKey, true);
                this.sprite.anims.timeScale = sprint ? sprintFrameRate / baseFrameRate : 1;
            } else {
                this.sprite.setTexture(this.facing === 'left' ? 'player_left' : 'player_right');
            }
        } else {
            if (this.sprite.anims.isPlaying) this.sprite.anims.stop();
            const idle = this.facing === 'left' ? 'player_left' : 'player_right';
            if (this.sprite.texture.key !== idle) this.sprite.setTexture(idle);
            this.sprite.setFlipX(false);
        }

        // Jumping (buffered + coyote)
        if (body.blocked.down || body.touching.down) this.lastGrounded = now;
        if (now - this.lastJumpPress <= BUFFER_MS && now - this.lastGrounded <= COYOTE_MS) {
            this.sprite.setVelocityY(JUMP_V);
            this.lastJumpPress = -1e9;
            this.lastGrounded = -1e9;
        }

        // Gravity shaping: heavier when falling, much heavier when the jump key is released early
        const vy = body.velocity.y;
        body.setGravityY(vy > 0 ? FALL_EXTRA : vy < 0 && !upHeld ? CUT_EXTRA : 0);
    }
}