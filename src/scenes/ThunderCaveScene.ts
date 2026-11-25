import Phaser from 'phaser';
import Player from '../player/Player';
import { FONT, GAME_H, GAME_W } from '../config';
import { createPlayerAnimations } from '../utils/animations';
import { ensureGlowTexture, ensureStormAssets } from '../utils/textures';
import { Leaderboard, ScoreEntry, fetchTop, getLocalBest, sanitizeName, submitScore } from '../services/highscores';

type EnemyType = 'bat' | 'razor' | 'brute';
type Sprite = Phaser.Physics.Arcade.Sprite;
type Phase = 'intro' | 'playing' | 'dying' | 'entry' | 'saving' | 'board';

const ENEMIES: Record<EnemyType, { hp: number; speed: number; scale: number; points: number; wobble: number }> = {
    bat: { hp: 1, speed: 140, scale: 1.0, points: 10, wobble: 70 },
    razor: { hp: 1, speed: 250, scale: 0.8, points: 25, wobble: 140 },
    brute: { hp: 3, speed: 95, scale: 1.7, points: 60, wobble: 20 },
};

const MAX_HP = 5;
const BOLT_COOLDOWN = 260;
const CHAIN_COOLDOWN = 2400;
const COMBO_WINDOW = 2500;
const UI_DEPTH = 500;

/** Scene 4: the storm cave. Flying enemies, lightning powers, score + name submission when you fall. */
export default class ThunderCaveScene extends Phaser.Scene {
    private player!: Player;
    private enemies!: Phaser.Physics.Arcade.Group;
    private bolts!: Phaser.Physics.Arcade.Group;
    private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
    private flash!: Phaser.GameObjects.Rectangle;

    private keyZ!: Phaser.Input.Keyboard.Key;
    private keyX!: Phaser.Input.Keyboard.Key;

    private phase: Phase = 'intro';
    private score = 0;
    private kills = 0;
    private hp = MAX_HP;
    private combo = 0;
    private comboUntil = 0;
    private runTime = 0;
    private nextSpawnAt = 0;
    private nextSwarmAt = 0;
    private hurtUntil = 0;
    private boltReadyAt = 0;
    private chainReadyAt = 0;
    private best = 0;

    // HUD
    private scoreText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private heartsText!: Phaser.GameObjects.Text;
    private bestText!: Phaser.GameObjects.Text;
    private cdBar!: Phaser.GameObjects.Graphics;

    // game over UI
    private name = '';
    private nameText?: Phaser.GameObjects.Text;
    private caretOn = true;
    private uiObjects: Phaser.GameObjects.GameObject[] = [];
    private lastEntry?: ScoreEntry;

    constructor() {
        super('ThunderCaveScene');
    }

    create(): void {
        const { width, height } = this.scale;
        ensureGlowTexture(this);
        ensureStormAssets(this);
        createPlayerAnimations(this);

        this.phase = 'intro';
        this.score = 0;
        this.kills = 0;
        this.hp = MAX_HP;
        this.combo = 0;
        this.comboUntil = 0;
        this.runTime = 0;
        this.hurtUntil = 0;
        this.boltReadyAt = 0;
        this.chainReadyAt = 0;
        this.name = '';
        this.uiObjects = [];
        this.lastEntry = undefined;
        this.best = getLocalBest();
        this.nextSpawnAt = this.time.now + 3200;
        this.nextSwarmAt = this.time.now + 22000;

        this.physics.world.setBounds(0, 0, width, height);
        this.cameras.main.fadeIn(900, 0, 0, 0);

        // Same cave art as scene 1, tinted stormy blue
        this.add.image(width / 2, height / 2, 'bgShadow').setTint(0x6d7fb8);
        const platforms = this.physics.add.staticGroup();
        const floor = platforms.create(width / 2, height, 'platforms').setOrigin(0.5, 1).setTint(0x8a96c8).refreshBody();
        const floorTopY = (floor.body as Phaser.Physics.Arcade.StaticBody).y;
        this.player = new Player(this, width / 2, floorTopY);
        this.player.sprite.setDepth(10);
        this.physics.add.collider(this.player.sprite, platforms);
        this.add.image(width / 2, height / 2, 'overlay').setTint(0x6d7fb8).setDepth(15);

        // Ambient lightning
        this.flash = this.add.rectangle(width / 2, height / 2, width, height, 0xcfe0ff, 0).setDepth(40).setBlendMode(Phaser.BlendModes.ADD);
        this.scheduleAmbientFlash();

        // Groups & particles
        this.enemies = this.physics.add.group({ allowGravity: false });
        this.bolts = this.physics.add.group({ allowGravity: false });
        this.sparks = this.add.particles(0, 0, 'glow', {
            speed: { min: 100, max: 420 },
            angle: { min: 0, max: 360 },
            lifespan: { min: 200, max: 450 },
            scale: { start: 0.3, end: 0 },
            blendMode: 'ADD',
            tint: [0xfff7a8, 0x9fd3ff, 0xffffff],
            emitting: false,
        }).setDepth(35);

        this.physics.add.overlap(this.bolts, this.enemies, (b, e) => {
            const bolt = b as Sprite;
            if (!bolt.active) return;
            bolt.destroy();
            this.damageEnemy(e as Sprite, 1);
        });
        this.physics.add.overlap(this.player.sprite, this.enemies, (_p, e) => this.onPlayerHit(e as Sprite));

        // Input
        const kb = this.input.keyboard!;
        this.keyZ = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = kb.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
            if (this.phase !== 'playing') return;
            const c = this.player.center;
            this.fireBolt(Phaser.Math.Angle.Between(c.x, c.y, p.worldX, p.worldY));
        });

        this.buildHud();

        const intro = this.add.text(width / 2, 250, 'THE STORM VAULT', {
            fontFamily: FONT, fontSize: '72px', fontStyle: 'bold', color: '#cfe3ff', stroke: '#0b1030', strokeThickness: 10,
        }).setOrigin(0.5).setDepth(100);
        const how = this.add.text(width / 2, 330, 'Z or click — lightning bolt     X — chain lightning     ↑ jump\nSurvive as long as you can.', {
            fontFamily: FONT, fontSize: '26px', color: '#ffffff', align: 'center', stroke: '#0b1030', strokeThickness: 5, lineSpacing: 10,
        }).setOrigin(0.5, 0).setDepth(100);
        this.tweens.add({ targets: [intro, how], alpha: 0, delay: 3000, duration: 800, onComplete: () => { intro.destroy(); how.destroy(); } });
        this.time.delayedCall(2200, () => { if (this.phase === 'intro') this.phase = 'playing'; });

        this.events.once('shutdown', () => {
            const k = this.input.keyboard;
            k?.off('keydown', this.onNameKey);
            k?.off('keydown-R', this.playAgain);
            k?.off('keydown-M', this.backToStart);
        });
    }

    // ---------------------------------------------------------------- HUD

    private buildHud(): void {
        const style = (size: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle => ({
            fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color, stroke: '#0b1030', strokeThickness: 5,
        });
        this.scoreText = this.add.text(36, 28, '', style(40, '#fff7a8')).setDepth(100);
        this.comboText = this.add.text(38, 82, '', style(26, '#9fd3ff')).setDepth(100);
        this.heartsText = this.add.text(GAME_W - 36, 28, '', style(40, '#ff6a8a')).setOrigin(1, 0).setDepth(100);
        this.bestText = this.add.text(GAME_W - 36, 84, '', style(22, '#cfe3ff')).setOrigin(1, 0).setDepth(100);
        this.add.text(GAME_W / 2, GAME_H - 64, 'X — CHAIN LIGHTNING', style(18, '#cfe3ff')).setOrigin(0.5).setDepth(100);
        this.cdBar = this.add.graphics().setDepth(100);
        this.refreshHud();
    }

    private refreshHud(): void {
        this.scoreText.setText(String(this.score).padStart(6, '0'));
        const mult = this.multiplier();
        this.comboText.setText(this.combo > 1 ? `COMBO ${this.combo}  ×${mult}` : '');
        this.heartsText.setText('♥'.repeat(this.hp) + '♡'.repeat(MAX_HP - this.hp));
        this.bestText.setText(`BEST ${String(Math.max(this.best, this.score)).padStart(6, '0')}`);
    }

    private multiplier(): number {
        return Math.min(5, 1 + Math.floor(Math.max(0, this.combo - 1) / 4));
    }

    // ---------------------------------------------------------------- ambience

    private scheduleAmbientFlash(): void {
        this.time.delayedCall(Phaser.Math.Between(2500, 7000), () => {
            if (!this.sys.isActive()) return;
            this.tweens.add({ targets: this.flash, alpha: { from: 0.32, to: 0 }, duration: 260, yoyo: false });
            this.time.delayedCall(140, () => this.tweens.add({ targets: this.flash, alpha: { from: 0.2, to: 0 }, duration: 200 }));
            this.scheduleAmbientFlash();
        });
    }

    // ---------------------------------------------------------------- update loop

    update(time: number, delta: number): void {
        this.player.update();
        this.drawCooldown(time);

        if (this.phase === 'dying' || this.phase === 'entry' || this.phase === 'saving' || this.phase === 'board') {
            this.enemies.getChildren().forEach((e) => (e as Sprite).setVelocity(0, 0));
            return;
        }
        if (this.phase === 'intro') return;

        this.runTime += delta;
        if (this.combo > 0 && time > this.comboUntil) {
            this.combo = 0;
            this.refreshHud();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) this.autoBolt();
        if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.chainLightning();

        // spawning (gets faster over time)
        const t = Math.min(1, this.runTime / 120000);
        const alive = this.enemies.countActive(true);
        if (time >= this.nextSpawnAt && alive < 28) {
            this.spawnEnemy();
            this.nextSpawnAt = time + Phaser.Math.Linear(1400, 450, t) * Phaser.Math.FloatBetween(0.7, 1.3);
        }
        if (time >= this.nextSwarmAt) {
            const side = Phaser.Math.Between(0, 1);
            for (let i = 0; i < 4 + Math.floor(t * 5); i++) this.spawnEnemy('bat', side, 110 + i * 70);
            this.nextSwarmAt = time + 20000;
        }

        // enemy movement
        const pc = this.player.center;
        for (const obj of this.enemies.getChildren()) {
            const e = obj as Sprite;
            const type = e.getData('type') as EnemyType;
            const def = ENEMIES[type];
            const dx = pc.x - e.x;
            const dy = pc.y - e.y;
            const d = Math.hypot(dx, dy) || 1;
            const nx = dx / d;
            const ny = dy / d;
            const wob = Math.sin(time * 0.006 + (e.getData('phase') as number)) * def.wobble;
            e.setVelocity(nx * def.speed - ny * wob, ny * def.speed + nx * wob);
            e.setFlipX(e.body!.velocity.x < 0);
        }
    }

    private drawCooldown(time: number): void {
        const w = 300;
        const x = GAME_W / 2 - w / 2;
        const y = GAME_H - 40;
        const ratio = Phaser.Math.Clamp(1 - (this.chainReadyAt - time) / CHAIN_COOLDOWN, 0, 1);
        this.cdBar.clear();
        this.cdBar.fillStyle(0x0b1030, 0.8).fillRoundedRect(x - 4, y - 4, w + 8, 22, 8);
        this.cdBar.fillStyle(ratio >= 1 ? 0x9fd3ff : 0x4a6aa8, 1).fillRoundedRect(x, y, w * ratio, 14, 6);
    }

    // ---------------------------------------------------------------- enemies

    private spawnEnemy(forced?: EnemyType, forcedSide?: number, forcedY?: number): void {
        const { width } = this.scale;
        let type: EnemyType = forced ?? 'bat';
        if (!forced) {
            const r = Math.random();
            if (this.runTime > 45000 && r < 0.18) type = 'brute';
            else if (this.runTime > 18000 && r < 0.45) type = 'razor';
        }
        const def = ENEMIES[type];
        const side = forcedSide ?? Phaser.Math.Between(0, 2);
        let x: number;
        let y: number;
        if (side === 0) {
            x = -70;
            y = forcedY ?? Phaser.Math.Between(120, 700);
        } else if (side === 1) {
            x = width + 70;
            y = forcedY ?? Phaser.Math.Between(120, 700);
        } else {
            x = Phaser.Math.Between(150, width - 150);
            y = -70;
        }
        const e = this.enemies.create(x, y, `${type}_up`) as Sprite;
        e.setScale(def.scale).setDepth(20);
        e.play(`${type}_fly`);
        (e.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(54, 44);
        e.setData({ type, hp: def.hp, phase: Math.random() * 6.28 });
    }

    private damageEnemy(e: Sprite, dmg: number): void {
        if (!e.active) return;
        const hp = (e.getData('hp') as number) - dmg;
        this.sparks.explode(6, e.x, e.y);
        if (hp <= 0) {
            this.killEnemy(e);
        } else {
            e.setData('hp', hp);
            e.setTintFill(0xffffff);
            this.time.delayedCall(80, () => e.active && e.clearTint());
        }
    }

    private killEnemy(e: Sprite): void {
        const def = ENEMIES[e.getData('type') as EnemyType];
        this.combo += 1;
        this.comboUntil = this.time.now + COMBO_WINDOW;
        const gained = def.points * this.multiplier();
        this.score += gained;
        this.kills += 1;
        this.sparks.explode(18, e.x, e.y);
        this.cameras.main.shake(70, 0.002);

        const pop = this.add.text(e.x, e.y - 20, `+${gained}`, {
            fontFamily: FONT, fontSize: '28px', fontStyle: 'bold', color: '#fff7a8', stroke: '#0b1030', strokeThickness: 5,
        }).setOrigin(0.5).setDepth(60);
        this.tweens.add({ targets: pop, y: pop.y - 60, alpha: 0, duration: 700, onComplete: () => pop.destroy() });

        e.destroy();
        this.refreshHud();
    }

    // ---------------------------------------------------------------- player hits

    private onPlayerHit(e: Sprite): void {
        if (this.phase !== 'playing' || !e.active || this.time.now < this.hurtUntil) return;
        const pc = this.player.center;
        if (Phaser.Math.Distance.Between(e.x, e.y, pc.x, pc.y) > 85) return; // forgive the transparent corners

        this.hurtUntil = this.time.now + 900;
        this.hp -= 1;
        this.sparks.explode(14, e.x, e.y);
        e.destroy();
        this.cameras.main.shake(180, 0.008);
        this.cameras.main.flash(120, 255, 60, 60);
        this.combo = 0;
        this.refreshHud();

        const s = this.player.sprite;
        this.tweens.add({ targets: s, alpha: 0.3, duration: 70, yoyo: true, repeat: 5, onComplete: () => s.setAlpha(1) });
        if ((s.body as Phaser.Physics.Arcade.Body).blocked.down) s.setVelocityY(-280);

        if (this.hp <= 0) this.die();
    }

    // ---------------------------------------------------------------- lightning powers

    private autoBolt(): void {
        const c = this.player.center;
        let target: Sprite | undefined;
        let best = Infinity;
        for (const obj of this.enemies.getChildren()) {
            const e = obj as Sprite;
            const d = Phaser.Math.Distance.Between(c.x, c.y, e.x, e.y);
            const ahead = Math.sign(e.x - c.x) === this.player.facingDir;
            const score = ahead ? d * 0.6 : d;
            if (score < best) {
                best = score;
                target = e;
            }
        }
        const angle = target
            ? Phaser.Math.Angle.Between(c.x, c.y, target.x, target.y)
            : this.player.facingDir === 1 ? 0 : Math.PI;
        this.fireBolt(angle);
    }

    private fireBolt(angle: number): void {
        const now = this.time.now;
        if (now < this.boltReadyAt) return;
        this.boltReadyAt = now + BOLT_COOLDOWN;
        const c = this.player.center;
        const bolt = this.bolts.create(c.x + Math.cos(angle) * 40, c.y - 20 + Math.sin(angle) * 40, 'bolt') as Sprite;
        bolt.setRotation(angle).setBlendMode(Phaser.BlendModes.ADD).setDepth(30);
        (bolt.body as Phaser.Physics.Arcade.Body).setAllowGravity(false).setSize(40, 14);
        bolt.setVelocity(Math.cos(angle) * 1150, Math.sin(angle) * 1150);
        this.sparks.explode(5, bolt.x, bolt.y);
        this.time.delayedCall(1000, () => bolt.active && bolt.destroy());
    }

    private chainLightning(): void {
        const now = this.time.now;
        if (now < this.chainReadyAt) return;

        const origin = this.player.center.clone().add(new Phaser.Math.Vector2(0, -20));
        const hit = new Set<Sprite>();
        const chain: Sprite[] = [];
        let cur = origin;
        for (let i = 0; i < 6; i++) {
            const range = i === 0 ? 750 : 420;
            let best: Sprite | undefined;
            let bestD = range;
            for (const obj of this.enemies.getChildren()) {
                const e = obj as Sprite;
                if (hit.has(e)) continue;
                const d = Phaser.Math.Distance.Between(cur.x, cur.y, e.x, e.y);
                if (d < bestD) {
                    bestD = d;
                    best = e;
                }
            }
            if (!best) break;
            hit.add(best);
            chain.push(best);
            cur = new Phaser.Math.Vector2(best.x, best.y);
        }
        if (!chain.length) return; // nothing in range: keep the cooldown

        this.chainReadyAt = now + CHAIN_COOLDOWN;
        this.flash.setAlpha(0.25);
        this.tweens.add({ targets: this.flash, alpha: 0, duration: 200 });

        let prev = origin;
        chain.forEach((e, i) => {
            const from = prev.clone();
            prev = new Phaser.Math.Vector2(e.x, e.y);
            this.time.delayedCall(i * 70, () => {
                if (!e.active) return;
                this.drawLightning(from.x, from.y, e.x, e.y);
                this.damageEnemy(e, 2);
            });
        });
    }

    private drawLightning(x1: number, y1: number, x2: number, y2: number): void {
        const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
        const n = Math.max(4, Math.floor(dist / 40));
        const nx = -(y2 - y1) / (dist || 1);
        const ny = (x2 - x1) / (dist || 1);
        const pts: Phaser.Types.Math.Vector2Like[] = [{ x: x1, y: y1 }];
        for (let i = 1; i < n; i++) {
            const t = i / n;
            const j = Phaser.Math.FloatBetween(-22, 22);
            pts.push({ x: x1 + (x2 - x1) * t + nx * j, y: y1 + (y2 - y1) * t + ny * j });
        }
        pts.push({ x: x2, y: y2 });
        const g = this.add.graphics().setDepth(32).setBlendMode(Phaser.BlendModes.ADD);
        g.lineStyle(14, 0x6fb6ff, 0.3).strokePoints(pts);
        g.lineStyle(5, 0xbfe3ff, 0.9).strokePoints(pts);
        g.lineStyle(2, 0xffffff, 1).strokePoints(pts);
        this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    }

    // ---------------------------------------------------------------- death + high score

    private die(): void {
        this.phase = 'dying';
        this.player.setLocked(true);
        const s = this.player.sprite;
        s.setTint(0xff5555).setAlpha(1);
        s.setVelocityY(-320);
        this.tweens.add({ targets: s, angle: 90, duration: 500, ease: 'Sine.easeIn' });
        this.cameras.main.shake(400, 0.012);
        this.time.timeScale = 1;
        this.time.delayedCall(1100, () => this.beginNameEntry());
    }

    private track<T extends Phaser.GameObjects.GameObject>(o: T): T {
        this.uiObjects.push(o);
        return o;
    }

    private clearUi(): void {
        this.uiObjects.forEach((o) => o.destroy());
        this.uiObjects = [];
    }

    private beginNameEntry(): void {
        this.phase = 'entry';
        const kb = this.input.keyboard!;
        kb.clearCaptures(); // let space etc. be typed
        const cx = GAME_W / 2;
        const heading = (y: number, text: string, size: number, color: string) =>
            this.track(this.add.text(cx, y, text, {
                fontFamily: FONT, fontSize: `${size}px`, fontStyle: 'bold', color, align: 'center', stroke: '#0b1030', strokeThickness: 6,
            }).setOrigin(0.5).setDepth(UI_DEPTH + 1));

        this.track(this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x03050f, 0.82).setDepth(UI_DEPTH));
        heading(250, 'THE STORM CLAIMS YOU', 64, '#ff8aa8');
        heading(350, `SCORE  ${this.score}`, 56, '#fff7a8');
        heading(412, `${this.kills} creatures defeated`, 24, '#cfe3ff');
        heading(520, 'ENTER YOUR NAME', 30, '#ffffff');
        this.track(this.add.rectangle(cx, 600, 560, 80, 0x0b1030).setStrokeStyle(4, 0x9fd3ff).setDepth(UI_DEPTH + 1));
        this.nameText = this.track(this.add.text(cx, 600, '', {
            fontFamily: FONT, fontSize: '44px', fontStyle: 'bold', color: '#ffffff',
        }).setOrigin(0.5).setDepth(UI_DEPTH + 2));
        heading(690, 'Enter — submit score        Esc — skip', 22, '#9fb4e0');
        this.updateNameText();

        this.track(this.time.addEvent({
            delay: 500, loop: true,
            callback: () => { this.caretOn = !this.caretOn; this.updateNameText(); },
        }) as unknown as Phaser.GameObjects.GameObject);
        kb.on('keydown', this.onNameKey);
    }

    private updateNameText(): void {
        this.nameText?.setText(this.name + (this.caretOn && this.phase === 'entry' ? '▌' : ' '));
    }

    private onNameKey = (e: KeyboardEvent): void => {
        if (this.phase !== 'entry') return;
        if (e.key === 'Enter') {
            e.preventDefault();
            void this.submit(true);
        } else if (e.key === 'Escape') {
            void this.submit(false);
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.name = this.name.slice(0, -1);
            this.updateNameText();
        } else if (e.key.length === 1 && this.name.length < 12 && /[\p{L}\p{N} _.\-!]/u.test(e.key)) {
            e.preventDefault();
            this.name += e.key;
            this.updateNameText();
        }
    };

    private async submit(save: boolean): Promise<void> {
        this.phase = 'saving';
        this.input.keyboard!.off('keydown', this.onNameKey);
        this.nameText?.setText('Saving…');
        let entry: ScoreEntry | undefined;
        if (save) {
            entry = { name: sanitizeName(this.name), score: this.score, date: Date.now() };
            await submitScore(entry);
        }
        const board = await fetchTop(10);
        if (!this.sys.isActive()) return;
        this.lastEntry = entry;
        this.showLeaderboard(board);
    }

    private showLeaderboard(board: Leaderboard): void {
        this.phase = 'board';
        this.clearUi();
        const cx = GAME_W / 2;
        this.track(this.add.rectangle(cx, GAME_H / 2, GAME_W, GAME_H, 0x03050f, 0.88).setDepth(UI_DEPTH));
        this.track(this.add.text(cx, 130, 'HIGH SCORES', {
            fontFamily: FONT, fontSize: '60px', fontStyle: 'bold', color: '#fff7a8', stroke: '#0b1030', strokeThickness: 8,
        }).setOrigin(0.5).setDepth(UI_DEPTH + 1));
        this.track(this.add.text(cx, 190, board.source === 'global' ? 'GLOBAL' : 'THIS BROWSER', {
            fontFamily: FONT, fontSize: '20px', color: '#9fb4e0',
        }).setOrigin(0.5).setDepth(UI_DEPTH + 1));

        if (!board.entries.length) {
            this.track(this.add.text(cx, 400, 'No scores yet.', { fontFamily: FONT, fontSize: '30px', color: '#cfe3ff' }).setOrigin(0.5).setDepth(UI_DEPTH + 1));
        }
        board.entries.forEach((e, i) => {
            const mine = !!this.lastEntry && e.date === this.lastEntry.date && e.name === this.lastEntry.name && e.score === this.lastEntry.score;
            const color = mine ? '#fdcffa' : '#ffffff';
            const y = 250 + i * 56;
            const st = { fontFamily: FONT, fontSize: '32px', fontStyle: mine ? 'bold' : 'normal', color };
            this.track(this.add.text(cx - 300, y, `${i + 1}.`, st).setOrigin(1, 0).setDepth(UI_DEPTH + 1));
            this.track(this.add.text(cx - 270, y, e.name, st).setDepth(UI_DEPTH + 1));
            this.track(this.add.text(cx + 300, y, String(e.score).padStart(6, '0'), st).setOrigin(1, 0).setDepth(UI_DEPTH + 1));
        });

        this.track(this.add.text(cx, GAME_H - 130, `Your score: ${this.score}`, {
            fontFamily: FONT, fontSize: '28px', color: '#fff7a8',
        }).setOrigin(0.5).setDepth(UI_DEPTH + 1));
        const again = this.track(this.add.text(cx - 40, GAME_H - 70, 'R — play again', {
            fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#2f5fb0', padding: { x: 16, y: 8 },
        }).setOrigin(1, 0.5).setDepth(UI_DEPTH + 1).setInteractive({ useHandCursor: true }));
        const home = this.track(this.add.text(cx + 40, GAME_H - 70, 'M — back to the cave', {
            fontFamily: FONT, fontSize: '26px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#7b3fd1', padding: { x: 16, y: 8 },
        }).setOrigin(0, 0.5).setDepth(UI_DEPTH + 1).setInteractive({ useHandCursor: true }));
        again.on('pointerdown', this.playAgain);
        home.on('pointerdown', this.backToStart);
        const kb = this.input.keyboard!;
        kb.on('keydown-R', this.playAgain);
        kb.on('keydown-M', this.backToStart);
    }

    private playAgain = (): void => {
        if (this.phase !== 'board') return;
        this.phase = 'intro'; // guard against double triggers
        this.scene.restart();
    };

    private backToStart = (): void => {
        if (this.phase !== 'board') return;
        this.phase = 'intro';
        this.scene.start('MainScene');
    };
}
