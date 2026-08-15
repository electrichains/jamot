export type Autonomy = "suggest" | "approve" | "autonomous";

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  availability: "available" | "busy" | "offline";
  autonomy: Autonomy;
  skills: { name: string; proficiency: number }[];
  channels: string[];
  reportsTo: string;
  memory: { interactions: number };
  tasks: { active: number };
  reputation: Record<string, number>;
}

export const AUTONOMY_OPTIONS: { value: Autonomy; label: string }[] = [
  { value: "suggest", label: "Suggest" },
  { value: "approve", label: "Act with approval" },
  { value: "autonomous", label: "Autonomous" },
];

export const AUTONOMY_LABEL: Record<Autonomy, string> = {
  suggest: "Suggest",
  approve: "Act with approval",
  autonomous: "Autonomous",
};

export const AGENTS: AgentProfile[] = [
  {
    id: "maria-assistant",
    name: "Maria Assistant",
    role: "Customer Relationship Agent",
    availability: "available",
    autonomy: "autonomous",
    skills: [
      { name: "Customer Service", proficiency: 92 },
      { name: "Sales", proficiency: 81 },
      { name: "Scheduling", proficiency: 74 },
    ],
    channels: ["WhatsApp"],
    reportsTo: "Main Manager",
    memory: { interactions: 1240 },
    tasks: { active: 3 },
    reputation: {
      responsiveness: 94,
      helpfulness: 91,
      follow_through: 88,
    },
  },
  {
    id: "outreach-agent",
    name: "Outreach Agent",
    role: "Outbound prospecting agent",
    availability: "busy",
    autonomy: "approve",
    skills: [
      { name: "Prospecting", proficiency: 87 },
      { name: "Email sequencing", proficiency: 79 },
      { name: "Enrichment", proficiency: 68 },
    ],
    channels: ["Email", "Telegram"],
    reportsTo: "Main Manager",
    memory: { interactions: 3420 },
    tasks: { active: 12 },
    reputation: {
      reply_rate: 87,
      data_quality: 82,
      deliverability: 90,
    },
  },
  {
    id: "finance-ai",
    name: "Finance AI",
    role: "Bookkeeping & reconciliation agent",
    availability: "offline",
    autonomy: "autonomous",
    skills: [
      { name: "Reconciliation", proficiency: 95 },
      { name: "Expense coding", proficiency: 89 },
      { name: "Forecasting", proficiency: 73 },
    ],
    channels: ["Email"],
    reportsTo: "Main Manager",
    memory: { interactions: 2105 },
    tasks: { active: 9 },
    reputation: {
      accuracy: 96,
      timeliness: 93,
      anomaly_detection: 85,
    },
  },
];
