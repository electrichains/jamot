export type ProvenanceSource =
  | "self_declared"
  | "assessment"
  | "observed"
  | "manager_feedback"
  | "inferred";

export interface Attribute {
  value: string;
  source: ProvenanceSource;
  confidence: number;
}

export interface PersonProfile {
  id: string;
  actorId?: string;
  name: string;
  role: string;
  avatar?: string;
  identity: {
    email: string;
    department: string;
    location: string;
    timezone: string;
    reportsTo?: string;
  };
  selfDescribed: Record<string, Attribute>;
  integral: Record<string, Attribute>;
  skills: string[];
  experience: string[];
  preferences: Record<string, Attribute>;
  goals: string[];
  availability: string;
  contributions: string[];
  reputation: Record<string, number>;
  memory: {
    interactions: number;
    notes: string[];
  };
}

export function overallReputation(reputation: Record<string, number>): number {
  const values = Object.values(reputation);
  if (values.length === 0) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.round(average * 100);
}

export const PEOPLE: PersonProfile[] = [
  {
    id: "maria",
    name: "Maria",
    role: "Sales Lead",
    identity: {
      email: "maria@example.com",
      department: "Sales",
      location: "Lisbon",
      timezone: "UTC+1",
      reportsTo: "Andrea",
    },
    selfDescribed: {
      "In my own words": {
        value:
          "I care most about making customers feel heard and closing loops quickly.",
        source: "self_declared",
        confidence: 1,
      },
      "Strengths": {
        value: "Empathetic listener, calm under pressure.",
        source: "self_declared",
        confidence: 1,
      },
      "Areas to grow": {
        value: "Delegating instead of doing everything myself.",
        source: "self_declared",
        confidence: 0.8,
      },
    },
    integral: {
      "Working style": {
        value: "Collaborative, prefers written async updates.",
        source: "observed",
        confidence: 0.85,
      },
      "Decision style": {
        value: "Consensus-driven; avoids unilateral calls.",
        source: "observed",
        confidence: 0.72,
      },
      "Cognitive strengths": {
        value: "Strong synthesis across customer signals.",
        source: "assessment",
        confidence: 0.9,
      },
      "Growth vector": {
        value: "Ready for people-leadership scope.",
        source: "manager_feedback",
        confidence: 0.68,
      },
      "Likely preference": {
        value: "Values autonomy over oversight.",
        source: "inferred",
        confidence: 0.55,
      },
    },
    skills: ["CRM", "Pipeline", "Cold outreach", "Customer success", "Async writing"],
    experience: [
      "3 yrs at a B2B SaaS scale-up",
      "Led CS for 40 enterprise accounts",
      "Built the onboarding playbook",
    ],
    preferences: {
      "Communication": {
        value: "Slack for quick questions, email for summaries.",
        source: "observed",
        confidence: 0.9,
      },
      "Meeting rhythm": {
        value: "Prefers mornings; avoids Friday afternoons.",
        source: "self_declared",
        confidence: 1,
      },
      "Feedback style": {
        value: "Direct but private.",
        source: "manager_feedback",
        confidence: 0.75,
      },
      "Energy peaks": {
        value: "High-output mid-morning.",
        source: "inferred",
        confidence: 0.6,
      },
    },
    goals: [
      "Grow renewal rate to 95%",
      "Mentor two CS associates",
      "Ship the customer health score",
    ],
    availability: "Available · UTC+1 · 9–18",
    contributions: [
      "Closed 3 key accounts this quarter",
      "Authored the onboarding playbook",
      "Reduced churn by 6% YoY",
    ],
    reputation: {
      helpfulness: 0.94,
      reliability: 0.9,
      collaboration: 0.96,
      delivery: 0.88,
    },
    memory: {
      interactions: 214,
      notes: [
        "Prefers concise updates before 10am",
        "Owns the Acme relationship",
        "Quiet hours 19:00–08:00",
      ],
    },
  },
  {
    id: "luca",
    name: "Luca",
    role: "Operations Manager",
    identity: {
      email: "luca@example.com",
      department: "Operations",
      location: "Milan",
      timezone: "UTC+1",
      reportsTo: "Andrea",
    },
    selfDescribed: {
      "In my own words": {
        value: "I keep delivery predictable and hate surprises in scope.",
        source: "self_declared",
        confidence: 1,
      },
      "Strengths": {
        value: "Operational discipline and clear documentation.",
        source: "self_declared",
        confidence: 1,
      },
      "Areas to grow": {
        value: "Being more comfortable with fast, reversible decisions.",
        source: "self_declared",
        confidence: 0.7,
      },
    },
    integral: {
      "Working style": {
        value: "Process-first; keeps a tight runbook.",
        source: "observed",
        confidence: 0.9,
      },
      "Decision style": {
        value: "Risk-averse on untested changes.",
        source: "observed",
        confidence: 0.74,
      },
      "Cognitive strengths": {
        value: "Operational discipline under load.",
        source: "assessment",
        confidence: 0.88,
      },
      "Documentation habit": {
        value: "Prefers written specs over ad-hoc chats.",
        source: "inferred",
        confidence: 0.62,
      },
    },
    skills: ["Process design", "Logistics", "Vendor management", "Runbooks", "Risk review"],
    experience: [
      "6 yrs operations in logistics",
      "Scaled delivery from 10 to 60 orders/week",
      "Led vendor consolidation",
    ],
    preferences: {
      "Communication": {
        value: "Written specs over ad-hoc chats.",
        source: "observed",
        confidence: 0.85,
      },
      "Meeting rhythm": {
        value: "Weekly cadence, agenda required.",
        source: "self_declared",
        confidence: 1,
      },
      "Feedback style": {
        value: "Appreciates structured, evidence-based feedback.",
        source: "manager_feedback",
        confidence: 0.8,
      },
    },
    goals: [
      "Cut delivery lead time by 20%",
      "Automate vendor reporting",
      "Standardize the runbook",
    ],
    availability: "Available · UTC+1 · 9–18",
    contributions: [
      "Shipped Q3 OKRs on schedule",
      "Vendor audit completed",
      "Documented 30+ SOPs",
    ],
    reputation: {
      reliability: 0.97,
      delivery: 0.95,
      collaboration: 0.84,
      helpfulness: 0.86,
    },
    memory: {
      interactions: 158,
      notes: [
        "Careful with scope creep",
        "Owns the runbook",
        "Prefers evidence in proposals",
      ],
    },
  },
  {
    id: "andrea",
    name: "Andrea",
    role: "Founder & Owner",
    identity: {
      email: "andrea@example.com",
      department: "Executive",
      location: "Turin",
      timezone: "UTC+1",
    },
    selfDescribed: {
      "In my own words": {
        value: "Building a calmer way to run things.",
        source: "self_declared",
        confidence: 1,
      },
      "Strengths": {
        value: "Long-term vision, calm presence.",
        source: "self_declared",
        confidence: 1,
      },
      "Areas to grow": {
        value: "Staying hands-off on execution details.",
        source: "self_declared",
        confidence: 0.7,
      },
    },
    integral: {
      "Working style": {
        value: "Vision-level; delegates execution.",
        source: "observed",
        confidence: 0.88,
      },
      "Decision style": {
        value: "Decisive on direction, deferential on tactics.",
        source: "observed",
        confidence: 0.78,
      },
      "Cognitive strengths": {
        value: "Strategic clarity under uncertainty.",
        source: "assessment",
        confidence: 0.92,
      },
      "Risk appetite": {
        value: "Comfortable with asymmetric bets.",
        source: "inferred",
        confidence: 0.6,
      },
    },
    skills: ["Vision", "Strategy", "Fundraising", "Hiring"],
    experience: [
      "Founded 2 ventures",
      "8 yrs product leadership",
      "Advisor to early-stage teams",
    ],
    preferences: {
      "Communication": {
        value: "Async by default; weekly sync.",
        source: "self_declared",
        confidence: 1,
      },
      "Meeting rhythm": {
        value: "Short, decision-oriented meetings.",
        source: "observed",
        confidence: 0.82,
      },
      "Feedback style": {
        value: "Prefers written context before decisions.",
        source: "self_declared",
        confidence: 0.9,
      },
    },
    goals: [
      "Reach profitability this year",
      "Hire a COO",
      "Publish the operating principles",
    ],
    availability: "Flexible · UTC+1",
    contributions: [
      "Defined the operating principles",
      "Closed the seed extension",
      "Onboarded the leadership team",
    ],
    reputation: {
      vision: 0.96,
      fairness: 0.9,
      decisiveness: 0.85,
      transparency: 0.93,
    },
    memory: {
      interactions: 341,
      notes: [
        "Prefers decisions with written context",
        "Owner — final approval on budget",
        "Keeps Friday afternoons clear",
      ],
    },
  },
  {
    id: "sofia",
    name: "Sofia",
    role: "Design Lead",
    identity: {
      email: "sofia@example.com",
      department: "Product",
      location: "Berlin",
      timezone: "UTC+1",
      reportsTo: "Andrea",
    },
    selfDescribed: {
      "In my own words": {
        value: "I turn fuzzy ideas into clear, calm interfaces.",
        source: "self_declared",
        confidence: 1,
      },
      "Strengths": {
        value: "Systems thinking and visual taste.",
        source: "self_declared",
        confidence: 1,
      },
      "Areas to grow": {
        value: "Speaking up earlier in reviews.",
        source: "self_declared",
        confidence: 0.7,
      },
    },
    integral: {
      "Working style": {
        value: "Iterative; prototypes early.",
        source: "observed",
        confidence: 0.9,
      },
      "Decision style": {
        value: "Evidence via prototypes over debate.",
        source: "observed",
        confidence: 0.8,
      },
      "Cognitive strengths": {
        value: "Visual systems and information architecture.",
        source: "assessment",
        confidence: 0.9,
      },
      "Ambiguity comfort": {
        value: "Thrives in loosely-defined briefs.",
        source: "inferred",
        confidence: 0.66,
      },
    },
    skills: ["Product design", "Design systems", "Prototyping", "Research"],
    experience: [
      "5 yrs product design",
      "Built design system for 2 products",
      "Led the research practice",
    ],
    preferences: {
      "Communication": {
        value: "Miro/Figma links plus short notes.",
        source: "observed",
        confidence: 0.88,
      },
      "Meeting rhythm": {
        value: "Design crits, no status meetings.",
        source: "self_declared",
        confidence: 1,
      },
      "Feedback style": {
        value: "Prefers async written critiques.",
        source: "manager_feedback",
        confidence: 0.72,
      },
    },
    goals: [
      "Ship the v2 design system",
      "Reduce support tickets via UX",
      "Grow the design practice",
    ],
    availability: "Available · UTC+1 · 9–18",
    contributions: [
      "Shipped design system v1",
      "Ran 12 customer interviews",
      "Improved the onboarding flow",
    ],
    reputation: {
      craft: 0.95,
      collaboration: 0.92,
      delivery: 0.87,
      helpfulness: 0.9,
    },
    memory: {
      interactions: 187,
      notes: [
        "Prefers feedback in writing",
        "Owns the design system",
        "Works in focused blocks",
      ],
    },
  },
];
