export interface AudioSettings {
    /** 0..1 */
    master: number;
    /** 0..1 */
    music: number;
    muted: boolean;
}

const KEY = 'nurhax_gallery_settings_v1';
const DEFAULTS: AudioSettings = { master: 1, music: 0.5, muted: false };

export function loadSettings(): AudioSettings {
    try {
        const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AudioSettings>;
        const clamp = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) ? Math.min(1, Math.max(0, v)) : d);
        return {
            master: clamp(raw.master, DEFAULTS.master),
            music: clamp(raw.music, DEFAULTS.music),
            muted: typeof raw.muted === 'boolean' ? raw.muted : DEFAULTS.muted,
        };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveSettings(s: AudioSettings): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
        /* storage unavailable */
    }
}