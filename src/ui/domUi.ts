import Phaser from 'phaser';
import { applyAudio, getAudioSettings, updateAudioSettings } from '../services/audio';

declare global {
    interface Window {
        /** Defined in index.html: shows / hides the Reader Mode overlay. */
        setReaderOpen?: (open: boolean) => void;
    }
}

const GAMEPLAY = ['MainScene', 'GalleryScene', 'LibraryScene', 'ThunderCaveScene'];

interface Pausable {
    canPause?: () => boolean;
}

/**
 * Wires up the HTML menus in index.html: main menu, pause menu, settings (audio) and Reader Mode.
 *
 *  - Pause (button or Esc) is available in every gameplay scene, via an optional `canPause()` on the scene
 *    (the storm cave returns false during name entry and while the high scores are shown).
 *  - Reader Mode can be opened from the main menu and the pause menu; closing it returns to where you were.
 */
export function initDomUi(game: Phaser.Game): void {
    const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;
    const menu = el('main-menu');
    const pauseMenu = el('pause-menu');
    const settingsPanel = el('settings-panel');
    const pauseBtn = el('pause-btn');
    const readerClose = el('reader-close-btn');
    const readerOverlay = el('reader-overlay');
    const master = el<HTMLInputElement>('set-master');
    const music = el<HTMLInputElement>('set-music');
    const mute = el<HTMLInputElement>('set-mute');
    const masterVal = el('set-master-val');
    const musicVal = el('set-music-val');

    let menuShown = false;
    let paused = false;
    let pausedScene: Phaser.Scene | undefined;
    let settingsOpen = false;
    let readerOrigin: 'menu' | 'pause' | null = null;

    const show = (node: HTMLElement | null, on: boolean) => node?.classList.toggle('open', on);
    const readerOpen = () => !!readerOverlay?.classList.contains('active');
    const setKeyboard = (on: boolean) => {
        if (game.input.keyboard) game.input.keyboard.enabled = on;
    };

    const gameplayScene = (): Phaser.Scene | undefined =>
        GAMEPLAY.map((k) => game.scene.getScene(k)).find((s) => s && (s.scene.isActive() || s.scene.isPaused()));

    const canPauseNow = (): boolean => {
        const sc = gameplayScene();
        if (!sc || !sc.scene.isActive() || paused || menuShown || readerOpen() || settingsOpen) return false;
        if (game.registry.get('transitioning')) return false;
        const p = sc as unknown as Pausable;
        return p.canPause ? p.canPause() : true;
    };

    // ------------------------------------------------------------------ pause

    const openPause = () => {
        if (!canPauseNow()) return;
        pausedScene = gameplayScene();
        if (!pausedScene) return;
        paused = true;
        pausedScene.scene.pause();
        setKeyboard(false);
        show(pauseMenu, true);
        el('pause-resume')?.focus();
    };

    const resume = () => {
        if (!paused) return;
        paused = false;
        show(pauseMenu, false);
        pausedScene?.scene.resume();
        setKeyboard(true);
        pausedScene?.input.keyboard?.resetKeys(); // clear keys that were "held" during the pause
        pausedScene = undefined;
    };

    const backToMainMenu = () => {
        paused = false;
        pausedScene = undefined;
        show(pauseMenu, false);
        setKeyboard(true);
        GAMEPLAY.forEach((k) => {
            const sc = game.scene.getScene(k);
            if (sc && (sc.scene.isActive() || sc.scene.isPaused())) game.scene.stop(k);
        });
        game.scene.start('MenuScene');
    };

    // ------------------------------------------------------------------ reader mode

    const openReader = (from: 'menu' | 'pause') => {
        readerOrigin = from;
        show(menu, false);
        show(pauseMenu, false);
        window.setReaderOpen?.(true);
        show(readerClose, true);
    };

    const closeReader = () => {
        window.setReaderOpen?.(false);
        show(readerClose, false);
        if (readerOrigin === 'pause') {
            show(pauseMenu, true);
            el('pause-resume')?.focus();
        } else if (readerOrigin === 'menu') {
            show(menu, true);
        }
        readerOrigin = null;
    };

    // ------------------------------------------------------------------ settings

    const syncSettingsUi = () => {
        const s = getAudioSettings();
        if (master) master.value = String(Math.round(s.master * 100));
        if (music) music.value = String(Math.round(s.music * 100));
        if (mute) mute.checked = s.muted;
        if (masterVal) masterVal.textContent = `${Math.round(s.master * 100)}%`;
        if (musicVal) musicVal.textContent = `${Math.round(s.music * 100)}%`;
    };
    const openSettings = () => {
        settingsOpen = true;
        syncSettingsUi();
        show(settingsPanel, true);
        el('set-back')?.focus();
    };
    const closeSettings = () => {
        settingsOpen = false;
        show(settingsPanel, false);
        el('menu-play')?.focus();
    };
    master?.addEventListener('input', () => {
        updateAudioSettings(game, { master: Number(master.value) / 100 });
        syncSettingsUi();
    });
    music?.addEventListener('input', () => {
        updateAudioSettings(game, { music: Number(music.value) / 100 });
        syncSettingsUi();
    });
    mute?.addEventListener('change', () => updateAudioSettings(game, { muted: mute.checked }));
    applyAudio(game);

    // ------------------------------------------------------------------ buttons + events

    el('menu-play')?.addEventListener('click', () => {
        if (!menuShown) return;
        menuShown = false;
        show(menu, false);
        game.scene.stop('MenuScene');
        game.scene.start('LoadingScene', { next: 'MainScene' });
    });
    el('menu-reader')?.addEventListener('click', () => openReader('menu'));
    el('menu-settings')?.addEventListener('click', openSettings);
    el('set-back')?.addEventListener('click', closeSettings);

    pauseBtn?.addEventListener('click', openPause);
    el('pause-resume')?.addEventListener('click', resume);
    el('pause-reader')?.addEventListener('click', () => openReader('pause'));
    el('pause-menu-btn')?.addEventListener('click', backToMainMenu);
    readerClose?.addEventListener('click', closeReader);

    game.events.on('menu:show', () => {
        menuShown = true;
        show(menu, true);
        el('menu-play')?.focus();
    });
    game.events.on('menu:hide', () => {
        menuShown = false;
        show(menu, false);
    });

    window.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || e.repeat) return;
        if (settingsOpen) closeSettings();
        else if (readerOpen()) closeReader();
        else if (paused) resume();
        else if (!menuShown) openPause();
    });

    // Pause button: visible in gameplay scenes, greyed out whenever pausing is not allowed
    window.setInterval(() => {
        const inGame = !!gameplayScene() && !menuShown && !readerOpen() && !paused;
        if (pauseBtn) {
            pauseBtn.style.display = inGame ? 'block' : 'none';
            pauseBtn.classList.toggle('disabled', !canPauseNow());
        }
    }, 120);
}