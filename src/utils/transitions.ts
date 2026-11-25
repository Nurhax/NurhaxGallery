import Phaser from 'phaser';
import Player from '../player/Player';
import Doorway from '../objects/Doorway';

export interface DoorTransitionOptions {
    fade?: [number, number, number];
    zoom?: number;
    shake?: boolean;
}

/**
 * Cinematic "walk through the door" transition:
 * door swings open, player walks in and fades out, camera pushes in, then fades to the next scene.
 */
export function walkThroughDoor(
    scene: Phaser.Scene,
    player: Player,
    door: Doorway,
    next: string,
    opts: DoorTransitionOptions = {}
): void {
    const cam = scene.cameras.main;
    const [r, g, b] = opts.fade ?? [0, 0, 0];

    player.autoWalk(1);
    door.open();
    scene.tweens.add({ targets: player.sprite, alpha: 0, delay: 650, duration: 450 });
    cam.zoomTo(opts.zoom ?? 1.3, 1600, 'Sine.easeInOut');
    if (opts.shake) cam.shake(1500, 0.004);

    scene.time.delayedCall(1150, () => {
        player.setLocked(true);
        player.stopAuto();
    });
    scene.time.delayedCall(1100, () => cam.fadeOut(700, r, g, b));
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(next));
}
