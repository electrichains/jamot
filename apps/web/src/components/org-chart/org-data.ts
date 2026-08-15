export type OrgKind = "dream" | "manager" | "dept" | "human" | "agent";

export interface OrgNode {
  id: string;
  label: string;
  kind: OrgKind;
  parentId: string | null;
  role?: string;
  skills?: string[];
  taskCount?: number;
  memory?: string;
  currentTasks?: string[];
  performance?: string;
}

export interface ChangeRequest {
  nodeId: string;
  nodeLabel: string;
  newParentId: string;
  newParentLabel: string;
}

export const KIND_LABEL: Record<OrgKind, string> = {
  dream: "Dream",
  manager: "Manager",
  dept: "Department",
  human: "Human",
  agent: "Agent",
};

export const orgNodes: OrgNode[] = [
  {
    id: "dream",
    label: "DREAM",
    kind: "dream",
    parentId: null,
    role: "North star and purpose",
    skills: ["Vision", "Alignment", "Stewardship"],
    memory: "The long-term mission that every role ultimately serves.",
    currentTasks: ["Reaffirm quarterly direction"],
    performance: "Guiding — no completion metric",
  },
  {
    id: "manager",
    label: "Main Manager",
    kind: "manager",
    parentId: "dream",
    role: "Coordinates all departments",
    skills: ["Delegation", "Coordination", "Reporting"],
    taskCount: 6,
    memory: "Owns the day-to-day cadence across Sales, Operations and Finance.",
    currentTasks: ["Weekly standup", "Roadmap review", "Hiring screen"],
    performance: "6 open items on track",
  },
  {
    id: "sales",
    label: "Sales",
    kind: "dept",
    parentId: "manager",
    role: "Revenue generation",
    skills: ["Pipeline", "Outbound", "Closing"],
    memory: "Goal: grow recurring revenue while keeping outreach human.",
    currentTasks: ["Q3 pipeline review"],
    performance: "104% of quota",
  },
  {
    id: "operations",
    label: "Operations",
    kind: "dept",
    parentId: "manager",
    role: "Process and delivery",
    skills: ["Process design", "Logistics", "Vendor management"],
    memory: "Keeps delivery reliable as the team scales.",
    currentTasks: ["Vendor contract renewal"],
    performance: "All SLAs green",
  },
  {
    id: "finance",
    label: "Finance",
    kind: "dept",
    parentId: "manager",
    role: "Budgeting and reporting",
    skills: ["FP&A", "Invoicing", "Reconciliation"],
    memory: "Single source of truth for money in and out.",
    currentTasks: ["Close books for last month"],
    performance: "On schedule",
  },
  {
    id: "maria",
    label: "Maria",
    kind: "human",
    parentId: "sales",
    role: "Sales Lead",
    skills: ["CRM", "Pipeline", "Cold outreach"],
    taskCount: 4,
    memory: "Prefers concise updates; owns key accounts.",
    currentTasks: ["Follow up Acme deal", "Draft Q3 forecast"],
    performance: "112% of quota (30d)",
  },
  {
    id: "outreach-agent",
    label: "Outreach Agent",
    kind: "agent",
    parentId: "sales",
    role: "Outbound prospecting agent",
    skills: ["Prospecting", "Email sequencing", "Enrichment"],
    taskCount: 12,
    memory: "Trained on Maria's tone; respects quiet hours.",
    currentTasks: ["Sequence: 40 new leads", "Refresh contact data"],
    performance: "31% reply rate",
  },
  {
    id: "maria-assistant",
    label: "Maria Assistant",
    kind: "agent",
    parentId: "sales",
    role: "Executive assistant for Maria",
    skills: ["Scheduling", "Summaries", "CRM hygiene"],
    taskCount: 3,
    memory: "Keeps Maria's calendar and inbox tidy.",
    currentTasks: ["Prep Monday brief", "Log call notes"],
    performance: "All summaries on time",
  },
  {
    id: "luca",
    label: "Luca",
    kind: "human",
    parentId: "operations",
    role: "Operations Manager",
    skills: ["Process design", "Logistics", "Vendor management"],
    taskCount: 5,
    memory: "Owns the runbook; careful with scope creep.",
    currentTasks: ["Ship Q3 OKRs", "Vendor audit"],
    performance: "100% SLAs (30d)",
  },
  {
    id: "andrea",
    label: "Andrea",
    kind: "human",
    parentId: "finance",
    role: "Finance Lead",
    skills: ["FP&A", "Invoicing", "Budgeting"],
    taskCount: 4,
    memory: "Owns the treasury and monthly close.",
    currentTasks: ["Close books", "Update cash forecast"],
    performance: "Close on schedule",
  },
  {
    id: "finance-ai",
    label: "Finance AI",
    kind: "agent",
    parentId: "finance",
    role: "Bookkeeping & reconciliation agent",
    skills: ["Reconciliation", "Expense coding", "Forecasting"],
    taskCount: 9,
    memory: "Flags anomalies and drafts reports for Andrea.",
    currentTasks: ["Reconcile bank feed", "Code 60 expenses"],
    performance: "99.2% match rate",
  },
];
