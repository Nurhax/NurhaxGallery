import Phaser from 'phaser';
import PreloadScene from './scenes/PreloadScene';
import MainScene from './scenes/MainScene';
import GalleryScene from './scenes/GalleryScene';
import LibraryScene from './scenes/LibraryScene';
import ThunderCaveScene from './scenes/ThunderCaveScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    scale: {
        mode: Phaser.Scale.FIT, // scale canvas to fit window
        autoCenter: Phaser.Scale.CENTER_BOTH, // center horizontally & vertically
        width: 1920, // your designed width
        height: 1080 // your designed height
    },
    physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { x: 0, y: 500 } }
    },
    scene: [PreloadScene, MainScene, GalleryScene, LibraryScene, ThunderCaveScene]
};

/** Wait (max 1.5s) for the web font so in-game text doesn't render in a fallback face. */
const fontReady = Promise.race([
    document.fonts.load('bold 24px "Noto Serif JP"', 'Aa').catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 1500)),
]);

fontReady.then(() => {
    const game = new Phaser.Game(config);

    // Reader Mode (📖) is optional now: while it is open, freeze the game and release the keyboard
    // so the arrow keys scroll the reader instead of moving the character.
    const reader = document.getElementById('reader-overlay');
    if (reader) {
        let paused: Phaser.Scene[] = [];
        let wasOpen = false;
        new MutationObserver(() => {
            const open = reader.classList.contains('active');
            if (open === wasOpen) return;
            wasOpen = open;
            const kb = game.input.keyboard;
            if (open) {
                paused = game.scene.getScenes(true);
                paused.forEach((s) => s.scene.pause());
                if (kb) kb.enabled = false;
            } else {
                paused.forEach((s) => s.scene.resume());
                paused = [];
                if (kb) kb.enabled = true;
            }
        }).observe(reader, { attributes: true, attributeFilter: ['class'] });
    }
});
