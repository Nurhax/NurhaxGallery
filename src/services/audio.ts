import Phaser from 'phaser';
import { AudioSettings, loadSettings, saveSettings } from './settings';

/** Music slider at 100% maps to this BGM volume (the original code used 0.1). */
const MUSIC_GAIN = 0.4;
let settings: AudioSettings = loadSettings();

type VolumeSound = Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound;

export function getAudioSettings(): AudioSettings {
    return settings;
}

export function applyAudio(game: Phaser.Game): void {
    game.sound.volume = settings.muted ? 0 : settings.master;
    const bgm = game.sound.get('bgm') as VolumeSound | null;
    if (bgm) bgm.volume = settings.music * MUSIC_GAIN;
}

export function updateAudioSettings(game: Phaser.Game, patch: Partial<AudioSettings>): void {
    settings = { ...settings, ...patch };
    saveSettings(settings);
    applyAudio(game);
}

/** Starts the looping BGM once (safe to call repeatedly). Call after a user gesture. */
export function startMusic(game: Phaser.Game): void {
    if (!game.cache.audio.exists('bgm')) return;
    let bgm = game.sound.get('bgm');
    if (!bgm) bgm = game.sound.add('bgm', { loop: true, volume: settings.music * MUSIC_GAIN });
    if (!bgm.isPlaying) bgm.play();
    applyAudio(game);
}