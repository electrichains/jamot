"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskCard } from "./TaskCard";
import { TaskDetail } from "./TaskDetail";
import {
  MOCK_LISTS,
  MOCK_TASKS,
  type KanbanList,
  type KanbanTask,
  type TaskDraft,
} from "./tasks-data";

export function TasksBoard() {
  const [lists, setLists] = useState<KanbanList[]>(MOCK_LISTS);
  const [tasks, setTasks] = useState<KanbanTask[]>(MOCK_TASKS);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [creatingInList, setCreatingInList] = useState<string | null>(null);
  const [renamingList, setRenamingList] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksFor = (listId: string) =>
    tasks.filter((t) => t.listId === listId);

  const listIdOf = (id: string): string | undefined => {
    if (lists.some((l) => l.id === id)) return id;
    return tasks.find((t) => t.id === id)?.listId;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
    const targetList = listIdOf(overId);
    if (!targetList || targetList === activeTask.listId) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === activeId ? { ...t, listId: targetList } : t)),
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // Reorder lists
    if (lists.some((l) => l.id === activeId)) {
      setLists((prev) => {
        const from = prev.findIndex((l) => l.id === activeId);
        const to = prev.findIndex((l) => l.id === overId);
        if (from === -1 || to === -1) return prev;
        return arrayMove(prev, from, to);
      });
      return;
    }

    // Reorder tasks within a list
    const activeTask = tasks.find((t) => t.id === activeId);
    const overTask = tasks.find((t) => t.id === overId);
    if (activeTask && overTask && activeTask.listId === overTask.listId) {
      setTasks((prev) => {
        const inList = prev.filter((t) => t.listId === activeTask.listId);
        const others = prev.filter((t) => t.listId !== activeTask.listId);
        const from = inList.findIndex((t) => t.id === activeId);
        const to = inList.findIndex((t) => t.id === overId);
        if (from === -1 || to === -1) return prev;
        return [...others, ...arrayMove(inList, from, to)];
      });
    }
  };

  const addList = () => {
    const name = nameDraft.trim();
    if (!name) return;
    setLists((prev) => [...prev, { id: `l${Date.now()}`, name }]);
    setNameDraft("");
  };

  const renameList = (id: string, name: string) => {
    const next = name.trim();
    if (next) setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: next } : l)));
    setRenamingList(null);
  };

  const deleteList = (id: string) => {
    setLists((prev) => prev.filter((l) => l.id !== id));
    setTasks((prev) => prev.filter((t) => t.listId !== id));
  };

  const createTask = (listId: string, draft: TaskDraft) => {
    setTasks((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        listId,
        title: draft.title,
        description: draft.description,
        dueDate: draft.dueDate,
        assigneeIds: draft.assigneeIds,
        attachments: draft.attachments,
      },
    ]);
  };

  const updateTask = (id: string, draft: TaskDraft) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title: draft.title,
              description: draft.description,
              dueDate: draft.dueDate,
              assigneeIds: draft.assigneeIds,
              attachments: draft.attachments,
            }
          : t,
      ),
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="font-display text-sm font-semibold">Tasks</span>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lists.map((l) => l.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex h-full items-start gap-3 p-4">
              {lists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  tasks={tasksFor(list.id)}
                  renaming={renamingList === list.id}
                  nameDraft={nameDraft}
                  onNameDraft={setNameDraft}
                  onStartRename={() => {
                    setRenamingList(list.id);
                    setNameDraft(list.name);
                  }}
                  onCommitRename={(name) => renameList(list.id, name)}
                  onDelete={() => deleteList(list.id)}
                  onAddCard={() => setCreatingInList(list.id)}
                  onOpenTask={setEditingTask}
                />
              ))}

              <div className="w-72 shrink-0">
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2">
                  <Input
                    placeholder="Add list…"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addList()}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    aria-label="Add list"
                    onClick={addList}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {editingTask ? (
        <TaskDetail
          task={editingTask}
          onSave={(draft) => {
            updateTask(editingTask.id, draft);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      ) : null}

      {creatingInList ? (
        <TaskDetail
          task={null}
          onSave={(draft) => {
            createTask(creatingInList, draft);
            setCreatingInList(null);
          }}
          onClose={() => setCreatingInList(null)}
        />
      ) : null}
    </div>
  );
}

interface ListColumnProps {
  list: KanbanList;
  tasks: KanbanTask[];
  renaming: boolean;
  nameDraft: string;
  onNameDraft: (v: string) => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onDelete: () => void;
  onAddCard: () => void;
  onOpenTask: (task: KanbanTask) => void;
}

function ListColumn({
  list,
  tasks,
  renaming,
  nameDraft,
  onNameDraft,
  onStartRename,
  onCommitRename,
  onDelete,
  onAddCard,
  onOpenTask,
}: ListColumnProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex max-h-full w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/40"
    >
      <div
        {...attributes}
        {...listeners}
        className="group flex h-10 shrink-0 cursor-grab items-center gap-2 border-b border-border px-3"
      >
        {renaming ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => onNameDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCommitRename(nameDraft);
              if (e.key === "Escape") onCommitRename(list.name);
            }}
            onBlur={() => onCommitRename(nameDraft)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
          />
        ) : (
          <button
            type="button"
            onDoubleClick={onStartRename}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold"
          >
            {list.name}
          </button>
        )}
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
        <button
          type="button"
          aria-label={`Delete ${list.name}`}
          onClick={onDelete}
          className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpenTask} />
          ))}
        </div>
      </SortableContext>

      <div className="shrink-0 p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={onAddCard}
        >
          <Plus className="size-4" />
          Add card
        </Button>
      </div>
    </div>
  );
}
