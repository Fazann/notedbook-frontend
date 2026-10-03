import { addDays, format, startOfMonth, subMonths } from 'date-fns';

import type { User } from '@/features/auth/types';
import type { Board, LabelColor } from '@/features/board/types';
import type { Category, CategoryColor, CategoryIcon, Expense } from '@/features/expense/types';
import type { GoalArea, GoalDetail, GoalPriority, GoalStatus, Milestone } from '@/features/planning/types';
import { computeProgress } from '@/features/planning/utils';
import type { Activity, ActivityType, Recurrence } from '@/features/schedule/types';
import type { Currency } from '@/lib/money';
import { addDays as addDayStrings, startOfWeek, todayInTz } from '@/lib/time';

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

export const demoUser: User = {
  id: 1,
  username: 'demo',
  fullname: 'John doe',
  email: 'demo@example.com',
  avatar: null,
  created_at: '2026-01-01T00:00:00Z',
};

/** Stored shape: `expenseCount` is computed from the expenses when read. */
export type StoredCategory = Omit<Category, 'expenseCount'>;

type CategorySeed = [
  id: number,
  key: string | null,
  name: string,
  icon: CategoryIcon,
  color: CategoryColor,
  /** Khmer name of a user category (a few are left without one, to show the fallback). */
  nameKm?: string,
];

const CATEGORY_SEEDS: CategorySeed[] = [
  // Defaults (translated by key, cannot be deleted)
  [1, 'food', 'Food', 'utensils', 'chart-1'],
  [2, 'coffee', 'Coffee', 'coffee', 'amber'],
  [3, 'transport', 'Transport', 'bike', 'blue'],
  [4, 'rent', 'Rent', 'home', 'violet'],
  [5, 'phoneInternet', 'Phone & Internet', 'wifi', 'teal'],
  [6, 'family', 'Family', 'users', 'pink'],
  [7, 'shopping', 'Shopping', 'shopping-bag', 'orange'],
  [8, 'health', 'Health', 'heart-pulse', 'red'],
  [9, 'education', 'Education', 'book-open', 'chart-2'],
  [10, 'other', 'Other', 'ellipsis', 'slate'],
  // User-created (shown as typed)
  [11, null, 'Gym', 'dumbbell', 'green', 'ហាត់ប្រាណ'],
  [12, null, 'Netflix', 'gamepad-2', 'red'],
  [13, null, 'Wedding gifts', 'gift', 'pink', 'ចំណងដៃការ'],
  [14, null, 'Motorbike repair', 'bike', 'orange', 'ជួសជុលម៉ូតូ'],
  [15, null, 'Pet food', 'dog', 'amber', 'ចំណីសត្វ'],
  [16, null, 'Books', 'book-open', 'blue', 'សៀវភៅ'],
  [17, null, 'Haircut', 'receipt', 'violet', 'កាត់សក់'],
  [18, null, 'Water & electricity', 'receipt', 'teal', 'ទឹក និងភ្លើង'],
  [19, null, 'Clothes', 'shirt', 'chart-4', 'សម្លៀកបំពាក់'],
  [20, null, 'Medicine', 'pill', 'green', 'ថ្នាំពេទ្យ'],
  [21, null, 'Travel', 'plane', 'chart-5', 'ដំណើរកម្សាន្ត'],
  [22, null, 'Baby supplies', 'baby', 'pink', 'សម្ភារៈទារក'],
  [23, null, 'Savings', 'piggy-bank', 'chart-2', 'សន្សំ'],
  [24, null, 'Taxi', 'car', 'slate'],
  [25, null, 'Online courses', 'graduation-cap', 'chart-3', 'វគ្គសិក្សាអនឡាញ'],
];

export function seedCategories(today: Date): StoredCategory[] {
  return CATEGORY_SEEDS.map(([id, key, name, icon, color, nameKm = '']) => {
    // Defaults exist from "sign-up" (2 months ago); user categories were added one by one since then.
    const created = key ? subMonths(today, 2) : addDays(subMonths(today, 2), (id - 10) * 3);
    const stamp = `${iso(created)}T09:00:00+07:00`;
    return { id, key, name, nameKm, icon, color, isDefault: key !== null, createdAt: stamp, updatedAt: stamp };
  });
}

type Template = { note: string; category_id: number; amount: number; currency: Currency };

/** Everyday expenses, picked in rotation for each day. */
const DAILY: Template[] = [
  { note: 'Bai sach chrouk breakfast', category_id: 1, amount: 8000, currency: 'KHR' },
  { note: 'Iced latte', category_id: 2, amount: 225, currency: 'USD' },
  { note: 'PassApp to office', category_id: 3, amount: 6000, currency: 'KHR' },
  { note: 'Lunch with team', category_id: 1, amount: 450, currency: 'USD' },
  { note: 'Num banh chok', category_id: 1, amount: 6000, currency: 'KHR' },
  { note: 'Iced coffee with milk', category_id: 2, amount: 4000, currency: 'KHR' },
  { note: 'Motorbike fuel', category_id: 3, amount: 20000, currency: 'KHR' },
  { note: 'Dinner at night market', category_id: 1, amount: 650, currency: 'USD' },
  { note: 'Pharmacy', category_id: 8, amount: 15000, currency: 'KHR' },
  { note: 'Aeon Mall shopping', category_id: 7, amount: 3850, currency: 'USD' },
  { note: 'Fruit shake', category_id: 1, amount: 5000, currency: 'KHR' },
  { note: 'Grab to Russian Market', category_id: 3, amount: 350, currency: 'USD' },
  { note: 'Amazon Café', category_id: 2, amount: 275, currency: 'USD' },
  { note: 'Groceries at Lucky', category_id: 7, amount: 1840, currency: 'USD' },
  { note: 'Haircut', category_id: 17, amount: 12000, currency: 'KHR' },
  { note: 'Taxi home in the rain', category_id: 24, amount: 300, currency: 'USD' },
  { note: 'Dog food', category_id: 15, amount: 850, currency: 'USD' },
  { note: 'Nasi lemak at KL airport', category_id: 1, amount: 1250, currency: 'MYR' },
  { note: 'Teh tarik', category_id: 2, amount: 350, currency: 'MYR' },
];

/** Fixed monthly expenses: [day of month, template]. */
const MONTHLY: [number, Template][] = [
  [1, { note: 'Monthly rent', category_id: 4, amount: 25000, currency: 'USD' }],
  [3, { note: 'Smart top-up', category_id: 5, amount: 500, currency: 'USD' }],
  [5, { note: 'Send to parents', category_id: 6, amount: 5000, currency: 'USD' }],
  [10, { note: 'English course', category_id: 9, amount: 6000, currency: 'USD' }],
  [15, { note: 'Home internet', category_id: 5, amount: 1500, currency: 'USD' }],
  [2, { note: 'Gym membership', category_id: 11, amount: 2500, currency: 'USD' }],
  [8, { note: 'Netflix', category_id: 12, amount: 999, currency: 'USD' }],
  [20, { note: 'EDC electricity bill', category_id: 18, amount: 95000, currency: 'KHR' }],
];

export function seedExpenses(today: Date): Expense[] {
  const expenses: Expense[] = [];
  let id = 1;
  const push = (t: Template, date: Date) => {
    const spent_at = iso(date);
    expenses.push({ id: id++, ...t, spent_at, created_at: `${spent_at}T08:00:00+07:00` });
  };

  const from = startOfMonth(subMonths(today, 1));
  let rotation = 0;
  for (let day = from; day <= today; day = addDays(day, 1)) {
    const dayOfMonth = day.getDate();
    for (const [d, t] of MONTHLY) {
      if (d === dayOfMonth) push(t, day);
    }
    // 0–2 everyday expenses, in a fixed pattern so the demo is stable between reloads.
    const perDay = [1, 0, 1, 1, 0, 1, 2][dayOfMonth % 7];
    for (let i = 0; i < perDay; i++) {
      push(DAILY[rotation % DAILY.length], day);
      rotation += 1;
    }
  }
  return expenses;
}

type GoalSeed = {
  title: string;
  description: string;
  area: GoalArea;
  priority: GoalPriority;
  status: GoalStatus;
  /** Days from today; null = no target date. */
  target: number | null;
  /** Days ago the goal was created. */
  createdDaysAgo: number;
  /** Days ago a done goal was completed. */
  completedDaysAgo?: number;
  /** [title, done, due in N days (optional)] */
  steps: [string, boolean, number?][];
};

const GOAL_SEEDS: GoalSeed[] = [
  {
    title: 'Save $500 for a new laptop',
    description: 'I need a laptop for my Golang course. Put money aside every payday.',
    area: 'finance',
    priority: 'high',
    status: 'in_progress',
    target: 6,
    createdDaysAgo: 40,
    steps: [
      ['Open a separate savings account', true],
      ['Save $100 in September', true],
      ['Save $100 in October', false, 20],
      ['Compare laptop prices', false],
      ['Buy the laptop', false],
    ],
  },
  {
    title: 'Pass IELTS 6.5',
    description: 'Study 1 hour every evening.',
    area: 'learning',
    priority: 'high',
    status: 'in_progress',
    target: 150,
    createdDaysAgo: 60,
    steps: [
      ['Take a practice test', true],
      ['Finish the grammar book', false],
      ['Join a speaking club', false],
      ['Book the exam', false, 90],
    ],
  },
  {
    title: 'Run a 10K',
    description: 'Train 3 times a week along the riverside.',
    area: 'health',
    priority: 'medium',
    status: 'in_progress',
    target: -3,
    createdDaysAgo: 90,
    steps: [
      ['Run 3K without stopping', true],
      ['Run 5K', true],
      ['Run 8K', true],
      ['Run the 10K race', false],
    ],
  },
  {
    title: 'Visit Siem Reap with family',
    description: 'Angkor Wat at sunrise.',
    area: 'family',
    priority: 'medium',
    status: 'done',
    target: -30,
    createdDaysAgo: 120,
    completedDaysAgo: 28,
    steps: [
      ['Book the bus', true],
      ['Book the guesthouse', true],
      ['Buy temple passes', true],
    ],
  },
  {
    title: 'Build an emergency fund of $1,000',
    description: 'Three months of basic costs, kept in a separate account.',
    area: 'finance',
    priority: 'high',
    status: 'in_progress',
    target: 120,
    createdDaysAgo: 75,
    steps: [
      ['Write down monthly costs', true],
      ['Set up an automatic transfer', true],
      ['Reach $250', false],
      ['Reach $500', false],
      ['Reach $750', false],
      ['Reach $1,000', false],
    ],
  },
  {
    title: 'Read 12 books this year',
    description: 'One book a month, mixing Khmer and English.',
    area: 'learning',
    priority: 'low',
    status: 'in_progress',
    target: 97,
    createdDaysAgo: 260,
    steps: [
      ['Book 1', true],
      ['Book 2', true],
      ['Book 3', true],
      ['Book 4', true],
      ['Book 5', true],
      ['Book 6', false],
      ['Book 7', false],
      ['Book 8', false],
    ],
  },
  {
    title: 'Learn basic Golang',
    description: 'Enough to build a small REST API.',
    area: 'career',
    priority: 'high',
    status: 'in_progress',
    target: 3,
    createdDaysAgo: 50,
    steps: [
      ['Finish the Go tour', true],
      ['Build a CLI tool', true],
      ['Learn goroutines', true],
      ['Build a REST API', false, 2],
      ['Write tests', false],
    ],
  },
  {
    title: 'Get a driving licence',
    description: '',
    area: 'personal',
    priority: 'medium',
    status: 'not_started',
    target: 60,
    createdDaysAgo: 10,
    steps: [
      ['Get a medical check', false],
      ['Register at a driving school', false],
      ['Pass the theory test', false],
      ['Pass the driving test', false],
    ],
  },
  {
    title: 'Sleep before 11pm for 30 days',
    description: 'No phone in bed.',
    area: 'health',
    priority: 'low',
    status: 'in_progress',
    target: -10,
    createdDaysAgo: 45,
    steps: [
      ['First 10 days', true],
      ['Next 10 days', false],
      ['Last 10 days', false],
    ],
  },
  {
    title: "Renovate parents' kitchen",
    description: 'New sink, shelves and better light.',
    area: 'family',
    priority: 'medium',
    status: 'not_started',
    target: null,
    createdDaysAgo: 5,
    steps: [],
  },
  {
    title: 'Get AWS certification',
    description: 'Cloud Practitioner first, then Solutions Architect Associate.',
    area: 'career',
    priority: 'medium',
    status: 'not_started',
    target: 200,
    createdDaysAgo: 20,
    steps: [
      ['Pick a course', false],
      ['Finish the course', false],
      ['Do 3 practice exams', false],
      ['Book the exam', false],
      ['Pass the exam', false],
    ],
  },
  {
    title: 'Lose 5 kg',
    description: 'Less sugar in coffee, walk after dinner.',
    area: 'health',
    priority: 'medium',
    status: 'in_progress',
    target: 45,
    createdDaysAgo: 70,
    steps: [
      ['Lose 1 kg', true],
      ['Lose 2 kg', true],
      ['Lose 3 kg', false],
      ['Lose 4 kg', false],
      ['Lose 5 kg', false],
    ],
  },
  {
    title: 'Visit Kampot and Kep',
    description: 'Pepper farm and crab market.',
    area: 'personal',
    priority: 'low',
    status: 'done',
    target: -60,
    createdDaysAgo: 150,
    completedDaysAgo: 62,
    steps: [
      ['Book the minivan', true],
      ['Book a room in Kampot', true],
      ['Visit a pepper farm', true],
    ],
  },
  {
    title: 'Start a side project',
    description: '',
    area: 'career',
    priority: 'low',
    status: 'not_started',
    target: null,
    createdDaysAgo: 3,
    steps: [
      ['Choose an idea', false],
      ['Build a first version', false],
    ],
  },
  {
    title: 'Learn to cook 10 Khmer dishes',
    description: 'Ask Mum for her recipes and write them down.',
    area: 'personal',
    priority: 'medium',
    status: 'in_progress',
    target: 30,
    createdDaysAgo: 80,
    steps: [
      ['Samlor korko', true],
      ['Fish amok', true],
      ['Lok lak', true],
      ['Nom banh chok', true],
      ['Kuy teav', false],
      ['Bai sach chrouk', false],
      ['Num pang', false],
    ],
  },
  {
    title: 'Pay off phone installment',
    description: '',
    area: 'finance',
    priority: 'medium',
    status: 'done',
    target: -15,
    createdDaysAgo: 200,
    completedDaysAgo: 14,
    steps: [
      ['Pay half', true],
      ['Pay the rest', true],
    ],
  },
];

/** ~16 goals with dates relative to today: 2 overdue, 2 due within 7 days, one without steps, 3 done. */
export function seedGoals(today: Date): GoalDetail[] {
  const at = (daysAgo: number) => `${iso(addDays(today, -daysAgo))}T08:00:00+07:00`;

  return GOAL_SEEDS.map((seed, index) => {
    const id = index + 1;
    const milestones: Milestone[] = seed.steps.map(([title, isDone, dueIn], i) => ({
      id: id * 100 + i,
      goalId: id,
      title,
      isDone,
      dueDate: dueIn === undefined ? null : iso(addDays(today, dueIn)),
      position: (i + 1) * 1000,
      doneAt: isDone ? at(Math.max(0, seed.createdDaysAgo - (i + 1) * 5)) : null,
    }));
    const milestonesDone = milestones.filter((m) => m.isDone).length;
    return {
      id,
      title: seed.title,
      description: seed.description,
      area: seed.area,
      priority: seed.priority,
      status: seed.status,
      targetDate: seed.target === null ? null : iso(addDays(today, seed.target)),
      milestonesTotal: milestones.length,
      milestonesDone,
      progress: computeProgress(milestonesDone, milestones.length, seed.status),
      completedAt: seed.completedDaysAgo === undefined ? null : at(seed.completedDaysAgo),
      createdAt: at(seed.createdDaysAgo),
      updatedAt: at(Math.min(seed.createdDaysAgo, seed.completedDaysAgo ?? seed.createdDaysAgo)),
      milestones,
    };
  });
}

type ActivitySeed = [
  title: string,
  type: ActivityType,
  start: string,
  end: string,
  /** Days from this week's Monday (series: the first day, 4 weeks back so earlier weeks have data too). */
  day: number,
  recurrence: Recurrence,
  location?: string,
  /** Days from this week's Monday removed from the series. */
  exceptions?: number[],
];

const SERIES_START = -28;

const ACTIVITY_SEEDS: ActivitySeed[] = [
  [
    'Run by the riverside',
    'exercise',
    '06:00',
    '06:45',
    SERIES_START,
    { kind: 'weekly', days: [1, 3, 5], until: null },
  ],
  ['Office work', 'work', '08:00', '12:00', SERIES_START, { kind: 'weekdays', until: null }, 'Office'],
  // Overlaps the morning office work on purpose.
  ['Team stand-up meeting', 'meeting', '10:10', '10:40', SERIES_START, { kind: 'weekdays', until: null }, 'Zoom'],
  ['Lunch break', 'personal', '12:00', '13:30', SERIES_START, { kind: 'weekdays', until: null }],
  ['Office work', 'work', '13:30', '17:30', SERIES_START, { kind: 'weekdays', until: null }, 'Office'],
  // No English class next Thursday, so an exception is visible.
  [
    'English class (IELTS)',
    'learning',
    '18:30',
    '20:00',
    SERIES_START,
    { kind: 'weekly', days: [2, 4], until: null },
    'ACE, Toul Kork',
    [10],
  ],
  ['Golang self-study', 'learning', '20:30', '21:30', SERIES_START, { kind: 'weekly', days: [1, 3], until: null }],
  ['Golang weekend project', 'learning', '09:00', '11:00', SERIES_START, { kind: 'weekly', days: [6], until: null }],
  ['Gym', 'exercise', '16:00', '17:00', SERIES_START, { kind: 'weekly', days: [6], until: null }],
  ['Dinner with family', 'family', '17:30', '19:00', SERIES_START, { kind: 'weekly', days: [7], until: null }],
  ['Meeting with client', 'meeting', '10:10', '11:00', 3, { kind: 'none' }, 'Coffee shop, BKK1'],
  ['Dentist appointment', 'personal', '14:00', '14:30', 2, { kind: 'none' }],
  ['Call parents', 'family', '20:00', '20:20', 8, { kind: 'none' }],
];

/** A weekly routine around the current week (in Asia/Phnom_Penh). */
export function seedActivities(today: Date): Activity[] {
  const monday = startOfWeek(todayInTz(undefined, today));
  const createdAt = `${addDayStrings(monday, SERIES_START - 1)}T08:00:00+07:00`;
  return ACTIVITY_SEEDS.map(
    ([title, type, startTime, endTime, day, recurrence, location = '', exceptions = []], i) => ({
      id: i + 1,
      title,
      type,
      date: addDayStrings(monday, day),
      startTime,
      endTime,
      location,
      note: '',
      recurrence,
      exceptions: exceptions.map((d) => addDayStrings(monday, d)),
      createdAt,
      updatedAt: createdAt,
    })
  );
}

/** [title, due in N days (null = no date), label, description] */
type CardSeed = [title: string, dueInDays: number | null, label: LabelColor | null, description?: string];

function buildBoard(
  id: number,
  name: string,
  columns: [string, CardSeed[]][],
  today: Date,
  cardId: { n: number }
): Board {
  return {
    id,
    name,
    columns: columns.map(([colName, cards], ci) => {
      const columnId = id * 10 + ci;
      return {
        id: columnId,
        board_id: id,
        name: colName,
        position: (ci + 1) * 1000,
        cards: cards.map(([title, due, label, description = ''], i) => ({
          id: cardId.n++,
          column_id: columnId,
          title,
          description,
          due_date: due === null ? null : iso(addDays(today, due)),
          label,
          position: (i + 1) * 1000,
        })),
      };
    }),
  };
}

export function seedBoards(today: Date): Board[] {
  const cardId = { n: 1 };
  return [
    buildBoard(
      1,
      'Personal',
      [
        [
          'Todo',
          [
            ['Pay electricity bill', 2, 'red', 'EDC bill, pay with ABA app.'],
            ['Renew motorbike tax', 7, 'yellow'],
            ['Call bank about card', 1, 'blue'],
            ['Clean room', null, 'green'],
            ['Buy gift for Mum', 4, 'purple'],
          ],
        ],
        [
          'Doing',
          [
            ['Plan weekend trip to Kampot', 5, 'green'],
            ['Fix bike brakes', -1, 'red'],
            ['Read "Atomic Habits"', null, 'blue'],
          ],
        ],
        [
          'Done',
          [
            ['Book dentist appointment', null, 'green'],
            ['Pay water bill', null, 'yellow'],
          ],
        ],
      ],
      today,
      cardId
    ),
    buildBoard(
      2,
      'Side project',
      [
        [
          'Backlog',
          [
            ['Write landing page copy', 12, 'purple'],
            ['Pick a logo font', null, 'blue'],
          ],
        ],
        [
          'In progress',
          [
            ['Design dashboard mockup', 3, 'blue', 'Desktop + phone layouts.'],
            ['Set up Go API project', 6, 'green'],
          ],
        ],
        ['Review', [['Khmer translations', 0, 'yellow']]],
        [
          'Done',
          [
            ['Choose tech stack', null, 'green'],
            ['Buy domain name', null, 'purple'],
            ['Write project brief', null, null],
          ],
        ],
      ],
      today,
      cardId
    ),
  ];
}
