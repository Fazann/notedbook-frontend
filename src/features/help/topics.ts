import { CalendarDays, Info, LayoutDashboard, Rocket, Smartphone, Target, Wallet, type LucideIcon } from 'lucide-react';

/** Drawn screens for the install guide (see `components/help-figure.tsx`). */
export const HELP_FIGURES = [
  'homeScreen',
  'iosShare',
  'iosAddToHome',
  'iosConfirm',
  'androidMenu',
  'androidInstall',
  'androidConfirm',
  'desktopInstall',
] as const;

export type HelpFigureId = (typeof HELP_FIGURES)[number];

/**
 * A section of a help article. Its text lives in `help.topics.<topic>.sections.<id>` in messages/*.json:
 * `title`, an optional `body`, and either numbered `steps` or bullet `items` (keys listed here, in order).
 * `figure` is a picture under the body; `stepFigures` puts a picture under a step.
 */
export type HelpSection = {
  id: string;
  steps?: string[];
  items?: string[];
  figure?: HelpFigureId;
  stepFigures?: Partial<Record<string, HelpFigureId>>;
};

export type HelpTopic = {
  /** URL segment: /help/<slug>. */
  slug: string;
  /** Key under `help.topics` in the messages. */
  key: string;
  icon: LucideIcon;
  group: 'start' | 'modules';
  /** The module page this topic explains, linked at the end of the article. */
  appHref?: `/${string}`;
  sections: HelpSection[];
};

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: 'about',
    key: 'about',
    icon: Info,
    group: 'start',
    sections: [
      { id: 'what' },
      { id: 'modules', items: ['dashboard', 'expenses', 'planning', 'schedule'] },
      { id: 'languages' },
      { id: 'data' },
    ],
  },
  {
    slug: 'getting-started',
    key: 'gettingStarted',
    icon: Rocket,
    group: 'start',
    sections: [
      { id: 'account', steps: ['s1', 's2', 's3'] },
      { id: 'navigate', items: ['phone', 'desktop', 'search'] },
      { id: 'quickAdd' },
      { id: 'settings', items: ['language', 'theme', 'profile', 'password'] },
    ],
  },
  {
    slug: 'install',
    key: 'install',
    icon: Smartphone,
    group: 'start',
    sections: [
      { id: 'why', figure: 'homeScreen' },
      {
        id: 'iphone',
        steps: ['s1', 's2', 's3', 's4'],
        stepFigures: { s2: 'iosShare', s3: 'iosAddToHome', s4: 'iosConfirm' },
      },
      {
        id: 'android',
        steps: ['s1', 's2', 's3', 's4'],
        stepFigures: { s2: 'androidMenu', s3: 'androidInstall', s4: 'androidConfirm' },
      },
      { id: 'desktop', steps: ['s1', 's2', 's3'], stepFigures: { s2: 'desktopInstall' } },
      { id: 'offline' },
    ],
  },
  {
    slug: 'dashboard',
    key: 'dashboard',
    icon: LayoutDashboard,
    group: 'modules',
    appHref: '/dashboard',
    sections: [
      { id: 'overview' },
      { id: 'cards', items: ['spent', 'daily', 'category', 'recent', 'today', 'goals'] },
      { id: 'month' },
    ],
  },
  {
    slug: 'expenses',
    key: 'expenses',
    icon: Wallet,
    group: 'modules',
    appHref: '/expenses',
    sections: [
      { id: 'add', steps: ['s1', 's2', 's3', 's4'] },
      { id: 'list', items: ['month', 'filter', 'totals'] },
      { id: 'edit' },
      { id: 'currencies' },
      { id: 'categories' },
    ],
  },
  {
    slug: 'planning',
    key: 'planning',
    icon: Target,
    group: 'modules',
    appHref: '/planning',
    sections: [
      { id: 'create', steps: ['s1', 's2', 's3'] },
      { id: 'steps' },
      { id: 'track', items: ['tabs', 'filters', 'stats'] },
    ],
  },
  {
    slug: 'schedule',
    key: 'schedule',
    icon: CalendarDays,
    group: 'modules',
    appHref: '/schedule',
    sections: [
      { id: 'views', items: ['week', 'day', 'agenda'] },
      { id: 'add', steps: ['s1', 's2', 's3'] },
      { id: 'move' },
      { id: 'shortcuts', items: ['arrows', 'today', 'create', 'views'] },
    ],
  },
];

export function findHelpTopic(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find((topic) => topic.slug === slug);
}

/** The topics before and after `slug` in reading order, for the "Previous / Next" links. */
export function adjacentHelpTopics(slug: string): { previous?: HelpTopic; next?: HelpTopic } {
  const index = HELP_TOPICS.findIndex((topic) => topic.slug === slug);
  if (index === -1) return {};
  return { previous: HELP_TOPICS[index - 1], next: HELP_TOPICS[index + 1] };
}
