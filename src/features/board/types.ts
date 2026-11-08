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

export const BOARD_NAME_MAX = 100;
export const COLUMN_NAME_MAX = 50;
export const CARD_TITLE_MAX = 255;
export const CARD_DESCRIPTION_MAX = 5000;

/** Form schemas. Messages are translation keys (`board.validation.*`), translated in the form components. */
export const boardFormSchema = z.object({
  name: z.string().trim().min(1, 'required').max(BOARD_NAME_MAX, 'tooLong'),
});
export type BoardFormValues = z.infer<typeof boardFormSchema>;

export const columnFormSchema = z.object({
  name: z.string().trim().min(1, 'required').max(COLUMN_NAME_MAX, 'tooLong'),
});

export const cardFormSchema = z.object({
  title: z.string().trim().min(1, 'required').max(CARD_TITLE_MAX, 'tooLong'),
  description: z.string().max(CARD_DESCRIPTION_MAX, 'tooLong'),
  /** Plain date `YYYY-MM-DD`, or '' for none. */
  due_date: z.string(),
  label: z.enum(LABEL_COLORS).nullable(),
});
export type CardFormValues = z.infer<typeof cardFormSchema>;

/** What `POST /columns/:id/cards` and `PUT /cards/:id` take (PUT replaces every field). */
export type CardInput = { title: string; description: string; due_date: string | null; label: LabelColor | null };

export const boardListItemSchema = z.object({ id: z.number(), name: z.string(), card_count: z.number() });
