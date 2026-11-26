import Phaser from 'phaser';
import { GRAVITY } from './config';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import LoadingScene from './scenes/LoadingScene';
import MainScene from './scenes/MainScene';
import GalleryScene from './scenes/GalleryScene';
import LibraryScene from './scenes/LibraryScene';
import ThunderCaveScene from './scenes/ThunderCaveScene';
import TransitionScene from './scenes/TransitionScene';
import { initDomUi } from './ui/domUi';

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
    render: { powerPreference: 'high-performance' }, // ask for the dedicated GPU on laptops
    physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { x: 0, y: GRAVITY } }
    },
    // TransitionScene is last so it always renders above the other scenes.
    scene: [BootScene, MenuScene, LoadingScene, MainScene, GalleryScene, LibraryScene, ThunderCaveScene, TransitionScene]
};

/** Wait (max 1.5s) for the web font so in-game text doesn't render in a fallback face. */
const fontReady = Promise.race([
    document.fonts.load('bold 24px "Noto Sans JP"', 'Aa').catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 1500)),
]);

fontReady.then(() => {
    const game = new Phaser.Game(config);
    initDomUi(game);
});