import Phaser from 'phaser';
import MainScene from './scenes/MainScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 200, y: 600 },
            debug: false
        }
    },
    scene: [MainScene]
};

new Phaser.Game(config);
