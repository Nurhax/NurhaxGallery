import Phaser from 'phaser';
import Player from '../player/Player';
import Doorway from '../objects/Doorway';
import type TransitionScene from '../scenes/TransitionScene';
import type { TransitionCard } from '../scenes/TransitionScene';

/** Slide-in chapter card, then start `next` behind it (see TransitionScene). */
export function changeScene(from: Phaser.Scene, next: string, card: TransitionCard, data?: object): void {
    (from.scene.get('TransitionScene') as TransitionScene).run(from, next, card, data);
}

export interface DoorTransitionOptions {
    zoom?: number;
    shake?: boolean;
}

/**
 * Door cinematic: the door swings open, the player walks in and fades out, the camera pushes in,
 * then the chapter card slides in and takes over.
 */
export function walkThroughDoor(
    scene: Phaser.Scene,
    player: Player,
    door: Doorway,
    next: string,
    card: TransitionCard,
    opts: DoorTransitionOptions = {}
): void {
    const cam = scene.cameras.main;
    player.autoWalk(1);
    door.open();
    scene.tweens.add({ targets: player.sprite, alpha: 0, delay: 650, duration: 450 });
    cam.zoomTo(opts.zoom ?? 1.3, 1600, 'Sine.easeInOut');
    if (opts.shake) cam.shake(1500, 0.004);

    scene.time.delayedCall(1150, () => {
        player.setLocked(true);
        player.stopAuto();
    });
    scene.time.delayedCall(1300, () => changeScene(scene, next, card));
}