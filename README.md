# 🎨 Nurhax Portfolio Gallery

A **game-like portfolio website** built with **Phaser 3**, **TypeScript**, and **Vite**.  
The site is designed as a **2D side-scroller gallery**, where visitors can move a character left, right, climb ladders, and interact with exhibits showcasing:

- 🖌️ Art portfolio  
- 💻 Software engineering projects  
- 🧪 QA-focused case studies  
- 🎥 Content creation work  

---

## 🚀 Features
- 2D **side-scroller gameplay** (inspired by Hollow Knight / Silksong style).
- **Gallery-themed environment** with background, platforms, and overlay layers.
- Playable **character with animations** (idle, walk, jump, climb).
- **Interactive exhibits** that display portfolio projects.
- **Responsive fullscreen scaling** (no scrollbars).
- **Reader mode** for people who wants go through the portfolio quickly.

---

## 🛠️ Tech Stack
- [Phaser 3](https://phaser.io/) (game framework)
- [TypeScript](https://www.typescriptlang.org/) (type safety)
- [Vite](https://vitejs.dev/) (fast dev server + bundler)
- [Node.js](https://nodejs.org/) (for dependency management)

---

## License

MIT © 2025 Muhammad Iqbal Nurhaq

---

## 🗺️ The journey

1. **Cave** – walk right, into the light.
2. **Work Gallery** – one big painting per job (oldest → newest), ends at a door.
3. **Library** – stand near a glowing book and press **E**: projects, art portfolio, content showcase.
4. **Storm Vault** – lightning-powered survival. **Z / click** bolt, **X** chain lightning. Submit your name + score when you fall.

Reader Mode (📖) is optional and pauses the game while open. Add `#gallery`, `#library` or `#storm` to the URL to jump straight to a scene while developing.

### High scores
Scores are stored in the browser (`localStorage`) by default. For a shared leaderboard, set `VITE_HIGHSCORE_URL` (see `.env.example` and `src/services/highscores.ts` for the tiny GET/POST contract).
