import Phaser from 'phaser';

/** Creates the player's run animations once (animations are global to the game). */
export function createPlayerAnimations(scene: Phaser.Scene): void {
    const pairs: Array<[string, string]> = [
        ['player_run_right', 'run_right'],
        ['player_run_left', 'run_left'],
    ];
    for (const [tex, key] of pairs) {
        if (scene.anims.exists(key) || !scene.textures.exists(tex)) continue;
        scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(tex),
            frameRate: 12,
            repeat: -1,
        });
    }
}
