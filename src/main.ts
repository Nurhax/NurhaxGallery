import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

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
        arcade: { debug: false }
    },
    scene: [MainScene]
};

new Phaser.Game(config);
