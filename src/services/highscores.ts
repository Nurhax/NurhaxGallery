export interface ScoreEntry {
    name: string;
    score: number;
    date: number;
}

export interface Leaderboard {
    entries: ScoreEntry[];
    source: 'global' | 'local';
}

const KEY = 'nurhax_gallery_highscores_v1';
const MAX_LOCAL = 50;

/**
 * Optional global leaderboard. Set VITE_HIGHSCORE_URL in .env to an endpoint that:
 *   GET  ?limit=10  -> [{ name, score, date }, ...]  (sorted high -> low)
 *   POST            <- { name, score, date }
 * Without it, scores are stored in this browser's localStorage only.
 */
const REMOTE: string | undefined = import.meta.env.VITE_HIGHSCORE_URL || undefined;

export function sanitizeName(raw: string): string {
    const clean = raw.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 12);
    return clean || 'Anonymous';
}

function readLocal(): ScoreEntry[] {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]');
        return Array.isArray(parsed) ? (parsed as ScoreEntry[]) : [];
    } catch {
        return [];
    }
}

function writeLocal(entries: ScoreEntry[]): void {
    try {
        localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
        /* storage unavailable (private mode etc.) */
    }
}

export function getLocalBest(): number {
    return readLocal().reduce((m, e) => Math.max(m, e.score), 0);
}

export async function submitScore(entry: ScoreEntry): Promise<void> {
    const all = readLocal();
    all.push(entry);
    all.sort((a, b) => b.score - a.score || a.date - b.date);
    writeLocal(all.slice(0, MAX_LOCAL));

    if (REMOTE) {
        try {
            await fetch(REMOTE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
            });
        } catch {
            /* offline: the local copy is still saved */
        }
    }
}

export async function fetchTop(limit = 10): Promise<Leaderboard> {
    if (REMOTE) {
        try {
            const res = await fetch(`${REMOTE}${REMOTE.includes('?') ? '&' : '?'}limit=${limit}`);
            if (res.ok) {
                const data = (await res.json()) as ScoreEntry[];
                if (Array.isArray(data)) return { entries: data.slice(0, limit), source: 'global' };
            }
        } catch {
            /* fall through to local */
        }
    }
    return { entries: readLocal().slice(0, limit), source: 'local' };
}
