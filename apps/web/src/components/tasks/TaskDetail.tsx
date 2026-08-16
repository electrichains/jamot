"use client";

import { useRef, useState } from "react";
import { Bot, Paperclip, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ASSIGNEES, type Attachment, type KanbanTask, type TaskDraft } from "./tasks-data";

export interface TaskDetailProps {
  task: KanbanTask | null;
  onSave: (draft: TaskDraft) => void;
  onClose: () => void;
}

export function TaskDetail({ task, onSave, onClose }: TaskDetailProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [assigneeIds, setAssigneeIds] = useState<string[]>(task?.assigneeIds ?? []);
  const [attachments, setAttachments] = useState<Attachment[]>(task?.attachments ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggleAssignee = (id: string) => {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachments((prev) => [
        ...prev,
        {
          id: `a${Date.now()}`,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          data: String(reader.result ?? ""),
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const save = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      assigneeIds,
      attachments,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-display text-sm font-semibold">
            {task ? "Edit task" : "New task"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          <Input
            autoFocus
            placeholder="Task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
          />

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Due date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Assign to
            </label>
            <div className="flex flex-col gap-1">
              {ASSIGNEES.map((a) => {
                const Icon = a.kind === "agent" ? Bot : User;
                const active = assigneeIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAssignee(a.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors",
                      active
                        ? "border-space-accent bg-space-accent/10 text-foreground"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="flex-1">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.kind}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Attachments
            </label>
            <div className="flex flex-col gap-1.5">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm"
                >
                  {a.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.data}
                      alt={a.name}
                      className="size-8 rounded object-cover"
                    />
                  ) : (
                    <Paperclip className="size-4 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{a.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(a.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    aria-label="Remove attachment"
                    onClick={() => removeAttachment(a.id)}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
              >
                <Paperclip className="size-4" />
                Attach a file
              </button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!title.trim()}>
            {task ? "Save" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
