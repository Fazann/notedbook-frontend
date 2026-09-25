'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { positionForMove } from '@/lib/position';
import { cn } from '@/lib/utils';

export type SortableListItem = { id: number | string; position: number };

/** Screen-reader text for each drag step. `position` is 1-based. Pass translated strings. */
export type SortableListAnnouncements<T> = {
  picked: (item: T, position: number, total: number) => string;
  moved: (item: T, position: number, total: number) => string;
  dropped: (item: T, position: number, total: number) => string;
  cancelled: (item: T) => string;
};

export type SortableItemState = {
  /** The drag handle button; place it where the grip should be. */
  handle: React.ReactNode;
  /** True for the placeholder left in the list while this item is being dragged. */
  isDragging: boolean;
};

export type SortableListProps<T extends SortableListItem> = {
  /** Sorted by `position`. */
  items: readonly T[];
  /** Called on drop with the item's new position (see `calcPosition`). Not called when nothing moved. */
  onMove: (id: T['id'], position: number) => void;
  renderItem: (item: T, state: SortableItemState) => React.ReactNode;
  /** Accessible name of the drag handle, e.g. "Drag to reorder". */
  handleLabel: string;
  announcements?: SortableListAnnouncements<T>;
  /** How to drag with the keyboard (translated). Read by screen readers when a handle gets focus. */
  screenReaderInstructions?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

/**
 * A vertical list whose items can be reordered with a mouse, touch (press and hold the handle) or the keyboard
 * (Space to pick up, arrows to move, Space to drop, Esc to cancel). Only the new position is reported.
 */
export function SortableList<T extends SortableListItem>({
  items,
  onMove,
  renderItem,
  handleLabel,
  announcements,
  screenReaderInstructions,
  disabled,
  className,
  ...aria
}: SortableListProps<T>) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // A short press-and-hold, so a swipe on the handle still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const indexOf = (id: UniqueIdentifier | undefined) => items.findIndex((item) => item.id === id);
  const find = (id: UniqueIdentifier) => items.find((item) => item.id === id);
  const activeItem = activeId === null ? undefined : find(activeId);

  const toAnnouncements = (a: SortableListAnnouncements<T>): Announcements => {
    const say = (fn: (item: T, position: number, total: number) => string, id: UniqueIdentifier, at: number) => {
      const item = find(id);
      return item ? fn(item, at + 1, items.length) : undefined;
    };
    return {
      onDragStart: ({ active }) => say(a.picked, active.id, indexOf(active.id)),
      onDragOver: ({ active, over }) => (over ? say(a.moved, active.id, indexOf(over.id)) : undefined),
      onDragEnd: ({ active, over }) => say(a.dropped, active.id, indexOf(over?.id ?? active.id)),
      onDragCancel: ({ active }) => {
        const item = find(active.id);
        return item ? a.cancelled(item) : undefined;
      },
    };
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    onMove(active.id as T['id'], positionForMove(items, active.id as T['id'], indexOf(over.id)));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        announcements: announcements && toAnnouncements(announcements),
        screenReaderInstructions: screenReaderInstructions ? { draggable: screenReaderInstructions } : undefined,
      }}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy} disabled={disabled}>
        <ul className={cn('space-y-1', className)} {...aria}>
          {items.map((item) => (
            <SortableRow key={item.id} item={item} handleLabel={handleLabel} renderItem={renderItem} />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay>
        {activeItem && (
          <div className="bg-card rounded-lg shadow-lg">
            {renderItem(activeItem, { handle: <HandleIcon label={handleLabel} />, isDragging: false })}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function SortableRow<T extends SortableListItem>({
  item,
  handleLabel,
  renderItem,
}: {
  item: T;
  handleLabel: string;
  renderItem: SortableListProps<T>['renderItem'];
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const handle = (
    <Button
      ref={setActivatorNodeRef}
      type="button"
      variant="ghost"
      size="icon-touch"
      className="text-muted-foreground cursor-grab touch-manipulation active:cursor-grabbing"
      aria-label={handleLabel}
      {...attributes}
      {...listeners}
    >
      <GripVertical aria-hidden />
    </Button>
  );

  return (
    <li
      ref={setNodeRef}
      // dnd-kit positions items with inline transforms (allowed by AGENTS.md).
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative', isDragging && 'opacity-40')}
    >
      {renderItem(item, { handle, isDragging })}
    </li>
  );
}

/** Non-interactive copy of the handle for the drag overlay. */
function HandleIcon({ label }: { label: string }) {
  return (
    <span className="text-muted-foreground flex size-11 items-center justify-center" aria-label={label}>
      <GripVertical className="size-4" aria-hidden />
    </span>
  );
}
