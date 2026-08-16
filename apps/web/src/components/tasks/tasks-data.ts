export type AssigneeKind = "human" | "agent";

export interface Assignee {
  id: string;
  name: string;
  kind: AssigneeKind;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string; // data URL (mock) / base64 (backend)
}

export interface KanbanTask {
  id: string;
  listId: string;
  title: string;
  description: string;
  dueDate: string | null;
  assigneeIds: string[];
  attachments: Attachment[];
}

export interface KanbanList {
  id: string;
  name: string;
}

export interface TaskDraft {
  title: string;
  description: string;
  dueDate: string | null;
  assigneeIds: string[];
  attachments: Attachment[];
}

export const ASSIGNEES: Assignee[] = [
  { id: "maria", name: "Maria Lopez", kind: "human" },
  { id: "jonas", name: "Jonas Weber", kind: "human" },
  { id: "priya", name: "Priya Nair", kind: "human" },
  { id: "scheduler", name: "Scheduler", kind: "agent" },
  { id: "inbox", name: "Inbox triage", kind: "agent" },
  { id: "inventory", name: "Inventory watcher", kind: "agent" },
];

export const MOCK_LISTS: KanbanList[] = [
  { id: "l1", name: "To Do" },
  { id: "l2", name: "In Progress" },
  { id: "l3", name: "Done" },
];

export const MOCK_TASKS: KanbanTask[] = [
  {
    id: "t1",
    listId: "l1",
    title: "Draft supplier comparison",
    description: "Compare ACME, BuildCo and XYZ on price and lead time.",
    dueDate: "2026-08-20",
    assigneeIds: ["maria"],
    attachments: [],
  },
  {
    id: "t2",
    listId: "l1",
    title: "Send opening invite",
    description: "Email the guest list for the restaurant opening.",
    dueDate: null,
    assigneeIds: ["scheduler"],
    attachments: [],
  },
  {
    id: "t3",
    listId: "l2",
    title: "Finalize menu",
    description: "Lock the opening menu with the chef.",
    dueDate: "2026-08-22",
    assigneeIds: ["jonas", "inventory"],
    attachments: [],
  },
  {
    id: "t4",
    listId: "l2",
    title: "Onboard new designer",
    description: "Walk through the brand kit and tooling.",
    dueDate: null,
    assigneeIds: ["priya"],
    attachments: [],
  },
  {
    id: "t5",
    listId: "l3",
    title: "Website copy pass",
    description: "Review and approve the new landing copy.",
    dueDate: "2026-08-15",
    assigneeIds: ["inbox"],
    attachments: [],
  },
];
