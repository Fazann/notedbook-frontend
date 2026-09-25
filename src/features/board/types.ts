import { z } from 'zod';

export const LABEL_COLORS = ['red', 'yellow', 'green', 'blue', 'purple'] as const;
export type LabelColor = (typeof LABEL_COLORS)[number];

export const cardSchema = z.object({
  id: z.number(),
  column_id: z.number(),
  title: z.string(),
  description: z.string(),
  /** Plain date `YYYY-MM-DD` or null. */
  due_date: z.string().nullable(),
  label: z.enum(LABEL_COLORS).nullable(),
  position: z.number(),
});
export type Card = z.infer<typeof cardSchema>;

export const columnSchema = z.object({
  id: z.number(),
  board_id: z.number(),
  name: z.string(),
  position: z.number(),
  cards: z.array(cardSchema),
});
export type Column = z.infer<typeof columnSchema>;

export const boardSchema = z.object({
  id: z.number(),
  name: z.string(),
  columns: z.array(columnSchema),
});
export type Board = z.infer<typeof boardSchema>;

export type BoardListItem = { id: number; name: string; card_count: number };

/** A card with the board and column it belongs to — used by "Tasks due soon". */
export type DueCard = Card & { board_id: number; board_name: string; column_name: string };
