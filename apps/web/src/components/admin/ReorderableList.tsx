import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import type { Reorderable } from "../../lib/types";

type ReorderableListProps<T extends Reorderable> = {
  items: T[];
  onReorder: (items: T[]) => void | Promise<void>;
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
};

function SortableRow<T extends Reorderable>({
  item,
  children,
}: {
  item: T;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`border-b border-mist py-3 flex items-start gap-3 bg-fog ${
        isDragging ? "opacity-80" : ""
      }`}
    >
      <button
        type="button"
        className="font-mono text-xs text-graphite/50 cursor-grab active:cursor-grabbing mt-1 px-1"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        ∷
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export function ReorderableList<T extends Reorderable>({
  items,
  onReorder,
  renderItem,
  emptyMessage = "Nothing here yet.",
}: ReorderableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex);
    await onReorder(next);
  }

  if (items.length === 0) {
    return (
      <p className="font-body text-graphite/60 border border-dashed border-mist px-4 py-8 text-center">
        {emptyMessage}
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="list-none p-0 m-0">
          {items.map((item) => (
            <SortableRow key={item.id} item={item}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
