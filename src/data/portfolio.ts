// Content for the gallery (jobs) and library (projects / art / content).
// Mirrors the Reader Mode text in index.html.
//
// NOTE: the `quote` on every book is a PLACEHOLDER (famous public quotes). Replace each one with your own favourite.

export interface Job {
    title: string;
    company: string;
    date: string;
    description: string;
    tags: string[];
    emoji: string;
    hue: number;
}

/** Chronological: oldest first, so walking right = walking through time. */
export const JOBS: Job[] = [
    {
        title: 'Game Developer Lead',
        company: 'Chevalier Laboratory',
        date: 'Jan 2023 – Aug 2024',
        description: 'Team leader & QA — Best rating award for the game development division.',
        tags: ['Unity', 'BeepBox', 'Aseprite', 'Photoshop', 'C#'],
        emoji: '🛡️',
        hue: 350,
    },
    {
        title: 'Data Structures Practicum Assistant',
        company: 'Informatics Laboratory',
        date: 'Sep 2024 – Jan 2025',
        description:
            'Practicum Assistant & Mentor — Assisted 40+ students weekly in debugging and troubleshooting code related to data structures.',
        tags: ['Microsoft Excel', 'C++', 'Codeblocks', 'Trees', 'Linked Lists'],
        emoji: '🌳',
        hue: 120,
    },
    {
        title: 'OOP Basics Practicum Assistant',
        company: 'Informatics Laboratory',
        date: 'Feb 2025 – Jun 2025',
        description:
            'Practicum Assistant & Mentor — Assisted 40+ students weekly in learning object-oriented programming principles and best practices.',
        tags: ['Microsoft Excel', 'Java', 'Eclipse IDE', 'Maven', 'OOP'],
        emoji: '☕',
        hue: 25,
    },
    {
        title: 'Software Construction Practicum Assistant',
        company: 'Informatics Laboratory',
        date: 'Feb 2025 – Jun 2025',
        description:
            'Practicum Assistant & Mentor — Assisted 40+ students weekly in learning software construction principles and best practices.',
        tags: ['Microsoft Excel', 'C#', '.NET', 'Visual Studio', 'Git'],
        emoji: '🧱',
        hue: 15,
    },
    {
        title: 'QA/Logistics Laboratory Assistant',
        company: 'HES Laboratory',
        date: 'May 2025 – May 2026',
        description: 'Web Quality Assurance and Tester, Logistics — Manual and Automation Testing, V&V Inventory.',
        tags: ['JMeter', 'Katalon Studio'],
        emoji: '🧪',
        hue: 170,
    },
    {
        title: 'Software Engineer Intern',
        company: 'Siemens',
        date: 'Jun 2025 – Sep 2025',
        description: 'Developer and Tester — 200+ P2P data systems testing, developed digitalized P2P testing form.',
        tags: ['Python', 'Behave', 'Cucumber', 'Manual Testing', 'TkInter'],
        emoji: '⚙️',
        hue: 195,
    },
    {
        title: 'Quality Assurance (Game Tester) Intern',
        company: 'Agate',
        date: 'Nov 2025 – Feb 2026',
        description:
            'Manual Game Tester — Game testing and Quality Assurance for an isometric RPG game, ensuring bug-free releases and optimal user experience.',
        tags: ['JIRA', 'Unreal Engine', 'Test Case Automation', 'AIO Jira Extension'],
        emoji: '🐞',
        hue: 265,
    },
    {
        title: 'Game Tester Freelance FSKU',
        company: 'Agate',
        date: 'Feb 2026 – Jul 2026',
        description:
            'Manual Game Tester — Game testing and Quality Assurance for an isometric RPG game, ensuring bug-free releases and optimal user experience for paid playtest builds and internal demos.',
        tags: ['JIRA', 'Unreal Engine', 'Test Case Automation', 'AIO Jira Extension'],
        emoji: '⚔️',
        hue: 285,
    },
    {
        title: 'Game Tester Freelance Porting',
        company: 'Agate',
        date: 'Jul 2026 – Oct 2026',
        description:
            'Manual Game Tester — Game testing and Quality Assurance for a roguelike cardbuilding game that is currently in development and ported to multiple console platforms.',
        tags: ['JIRA', 'C#', '.NET Framework', 'Microsoft Excel', 'Nintendo SDK', 'Xbox SDK', 'PlayStation SDK'],
        emoji: '🃏',
        hue: 305,
    },
];

export type BookKind = 'project' | 'art' | 'content' | 'link';

export interface Quote {
    text: string;
    author: string;
}

export const CV = {
    path: 'documents/Muhammad_Iqbal_Nurhaq_CV.pdf',
    filename: 'Muhammad_Iqbal_Nurhaq_CV.pdf',
};

export interface BookEntry {
    kind: BookKind;
    /** Shown when the player walks past the book. One per book. */
    quote: Quote;
    title: string;
    /** Short label printed on the book's spine. */
    spine: string;
    blurb: string;
    tags?: string[];
    url: string;
    linkLabel: string;
    /** Texture key + optional file (relative to /public) for the cover picture. */
    coverKey?: string;
    coverPath?: string;
}

export interface LibrarySection {
    title: string;
    sub: string;
    kind: BookKind;
    entries: BookEntry[];
}

export const LIBRARY: LibrarySection[] = [
    {
        title: 'PROJECTS',
        sub: 'things I have built',
        kind: 'project',
        entries: [
            {
                kind: 'project',
                quote: { text: 'Wherever the art of medicine is loved, there is also a love of humanity.', author: 'Hippocrates' },
                title: 'CERDIK',
                spine: 'CERDIK',
                blurb:
                    'A medications reminder app with two key roles: health workers and patients. Health workers manage medication schedules, while patients receive clear reminders of what and when to take their prescribed medication.',
                tags: ['Figma', 'Flutter', 'PHP', 'MySQL', 'Flutter Test'],
                url: 'https://github.com/Nurhax/CERDIKMOBILE',
                linkLabel: 'View repository',
                coverKey: 'cover_cerdik',
                coverPath: 'images/Cerdik.jpg',
            },
            {
                kind: 'project',
                quote: { text: 'No man is an island.', author: 'John Donne' },
                title: 'Social Palace (SoPal)',
                spine: 'SoPal',
                blurb:
                    'A personal social relationship tracker inspired by the Confidant mechanic from Persona 5. Add confidants, level them up, track confidant logs and keep your favorites in check.',
                tags: ['Flutter', 'Appium', 'SQFlite', 'Figma'],
                url: 'https://github.com/Nurhax/Social-Palace-2026',
                linkLabel: 'View repository',
                coverKey: 'cover_sopal',
                coverPath: 'images/SoPal.png',
            },
            {
                kind: 'project',
                quote: { text: 'Any sufficiently advanced technology is indistinguishable from magic.', author: 'Arthur C. Clarke' },
                title: 'Lemmy Bot',
                spine: 'Lemmy Bot',
                blurb:
                    'A virtual assistant for YouTube livestreams. Reads chat every 60 seconds, talks to viewers and provides real-time responses.',
                tags: ['ElevenLabs', 'Python', 'CharAI', 'OBS WebSockets'],
                url: 'https://github.com/Nurhax/LemmyBot',
                linkLabel: 'View repository',
                coverKey: 'cover_lemmy',
                coverPath: 'images/LemmyBot.png',
            },
            {
                kind: 'project',
                quote: { text: 'Not all those who wander are lost.', author: 'J.R.R. Tolkien' },
                title: 'Pargantara: The Untold Stories',
                spine: 'Pargantara',
                blurb:
                    'A roguelike story-driven game inspired by the Java kingdom, featuring a gacha system and a wide variety of unlockable characters.',
                tags: ['Unity', 'BeepBox', 'Aseprite', 'C#', 'Itch.io'],
                url: 'https://nurhax.itch.io/',
                linkLabel: 'Play on itch.io',
                coverKey: 'cover_pargantara',
                coverPath: 'images/Pargantara.png',
            },
            {
                kind: 'link',
                quote: { text: 'Talk is cheap. Show me the code.', author: 'Linus Torvalds' },
                title: 'All Projects',
                spine: 'GitHub',
                blurb: 'The complete shelf: every repository, experiment and half-finished idea lives on my GitHub.',
                url: 'https://github.com/Nurhax',
                linkLabel: 'Open GitHub',
            },
        ],
    },
    {
        title: 'ART PORTFOLIO',
        sub: 'illustration & fan art',
        kind: 'art',
        entries: [
            {
                kind: 'art',
                quote: { text: 'Every artist was first an amateur.', author: 'Ralph Waldo Emerson' },
                title: 'Kafka — Honkai: Star Rail',
                spine: 'Kafka',
                blurb: 'Fan illustration of Kafka from Honkai: Star Rail.',
                url: 'https://www.instagram.com/nurhax.dev/',
                linkLabel: 'See more on Instagram',
                coverKey: 'cover_kafka',
                coverPath: 'images/Kafka1.png',
            },
            {
                kind: 'art',
                quote: { text: 'Art is not what you see, but what you make others see.', author: 'Edgar Degas' },
                title: 'Hoshiguma — Arknights',
                spine: 'Hoshiguma',
                blurb: 'Fan illustration of Hoshiguma from Arknights.',
                url: 'https://www.instagram.com/nurhax.dev/',
                linkLabel: 'See more on Instagram',
                coverKey: 'cover_hoshiguma',
                coverPath: 'images/Hoshiguma2.png',
            },
            {
                kind: 'art',
                quote: { text: 'Art enables us to find ourselves and lose ourselves at the same time.', author: 'Thomas Merton' },
                title: 'Shinobu — Monogatari',
                spine: 'Shinobu',
                blurb: 'Fan illustration of Shinobu from the Monogatari series.',
                url: 'https://www.instagram.com/nurhax.dev/',
                linkLabel: 'See more on Instagram',
                coverKey: 'cover_shinobu',
                coverPath: 'images/Shinobu3.png',
            },
            {
                kind: 'art',
                quote: { text: 'Creativity takes courage.', author: 'Henri Matisse' },
                title: 'Hachikuji — Monogatari',
                spine: 'Hachikuji',
                blurb: 'Fan illustration of Hachikuji from the Monogatari series.',
                url: 'https://www.instagram.com/nurhax.dev/',
                linkLabel: 'See more on Instagram',
                coverKey: 'cover_hachikuji',
                coverPath: 'images/Hachikuji4.png',
            },
            {
                kind: 'link',
                quote: { text: 'I dream my painting and I paint my dream.', author: 'Vincent van Gogh' },
                title: 'Full Art Portfolio',
                spine: 'Instagram',
                blurb: 'More illustrations, sketches and works in progress.',
                url: 'https://www.instagram.com/nurhax.dev/',
                linkLabel: 'Open Instagram',
            },
        ],
    },
    {
        title: 'CONTENT SHOWCASE',
        sub: 'anime & music analysis',
        kind: 'content',
        entries: [
            {
                kind: 'content',
                quote: { text: 'Where words fail, music speaks.', author: 'Hans Christian Andersen' },
                title: 'Fakta Baru [ADO] Yang Harus Kamu Ketahui!',
                spine: 'ADO Facts',
                blurb: "A breakdown of ADO's latest facts in 2025, also explaining the implications in her music videos.",
                tags: ['YouTube', 'Music analysis'],
                url: 'https://www.youtube.com/watch?v=FqltIqB4Hrw',
                linkLabel: 'Watch on YouTube',
                coverKey: 'cover_ado',
                coverPath: 'images/AdoThumb.png',
            },
            {
                kind: 'content',
                quote: { text: 'The heart has its reasons which reason knows nothing of.', author: 'Blaise Pascal' },
                title: 'FRIENDZONE TERBRUTAL DI ANIME (Hanekawa & Araragi)',
                spine: 'Friendzone',
                blurb: 'An exploration of the complex relationship dynamics between Hanekawa and Araragi in the Monogatari series.',
                tags: ['YouTube', 'Anime analysis'],
                url: 'https://www.youtube.com/watch?v=BsfFqoGR6HM',
                linkLabel: 'Watch on YouTube',
                coverKey: 'cover_friendzone',
                coverPath: 'images/FriendzoneThumb.png',
            },
            {
                kind: 'link',
                quote: { text: 'Quality means doing it right when no one is looking.', author: 'Henry Ford' },
                title: 'The @Nurhax Channel',
                spine: 'YouTube',
                blurb:
                    'A "philosophical QA approach" to anime and otaku media — because storytelling deserves the same scrutiny and care as software.',
                url: 'https://www.youtube.com/@Nurhax/',
                linkLabel: 'Open channel',
            },
        ],
    },
];