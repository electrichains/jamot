import type { AgentProfile } from "@/components/agents/agents-data";
import type { PersonProfile } from "@/components/people/people-data";
import type { ApiAgent, OrganizationMember } from "@/lib/api-client";
import type { OrgNode } from "@/components/org-chart/org-data";

const MEMBER_KIND_LABEL: Record<OrganizationMember["kind"], string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function memberToPersonProfile(
  member: OrganizationMember,
  orgName: string,
): PersonProfile {
  const role = member.title ?? MEMBER_KIND_LABEL[member.kind];
  return {
    id: `member-${member.personId}`,
    name: member.displayName,
    role,
    identity: {
      email: member.email ?? "",
      department: "",
      location: "Remote",
      timezone: "",
    },
    selfDescribed: {},
    integral: {},
    skills: [],
    experience: [],
    preferences: {},
    goals: [],
    availability: "Available",
    contributions: [],
    reputation: {
      reliability: 0.5,
      helpfulness: 0.5,
    },
    memory: {
      interactions: 0,
      notes: member.email
        ? [`Member of ${orgName} — reachable at ${member.email}.`]
        : [`Member of ${orgName} since ${new Date(member.membershipSince).toLocaleDateString()}.`],
    },
  };
}

export function agentToAgentProfile(agent: ApiAgent): AgentProfile {
  return {
    id: agent.id,
    name: agent.role ?? "Agent",
    role: agent.role ?? "Digital worker",
    availability: agent.availability,
    autonomy: agent.autonomy,
    skills: Object.entries(agent.performance).map(([name, proficiency]) => ({
      name,
      proficiency,
    })),
    channels: [],
    reportsTo: "",
    memory: { interactions: 0, notes: [] },
    tasks: { active: 0 },
    reputation: agent.performance,
  };
}

export function buildOrgNodes(input: {
  organizationId: string;
  spaceName: string;
  dream: string;
  members: OrganizationMember[];
  agents?: ApiAgent[];
}): OrgNode[] {
  const id = input.organizationId;
  const orgAgents = (input.agents ?? []).filter((agent) =>
    agent.organizationIds.includes(id),
  );

  const nodes: OrgNode[] = [
    {
      id: `org-${id}`,
      label: input.spaceName || "Organization",
      kind: "dream",
      parentId: null,
      role: input.dream || "North star and purpose",
      skills: ["Vision", "Alignment"],
      memory: input.dream || "The long-term mission every role serves.",
      performance: "Guiding — no completion metric",
    },
  ];

  const managers = input.members.filter(
    (member) => member.kind === "owner" || member.kind === "admin",
  );
  const members = input.members.filter((member) => member.kind === "member");

  const managerIds = managers.map(
    (member) => `org-${id}-mgr-${member.personId}`,
  );
  managers.forEach((member, index) => {
    nodes.push({
      id: managerIds[index],
      label: member.displayName,
      kind: "manager",
      parentId: `org-${id}`,
      role: member.title ?? MEMBER_KIND_LABEL[member.kind],
      skills: [],
      memory: member.email
        ? `Reachable at ${member.email}.`
        : "Administrative lead for this organization.",
    });
  });

  const memberParent = managerIds[0] ?? `org-${id}`;
  members.forEach((member) => {
    nodes.push({
      id: `org-${id}-member-${member.personId}`,
      label: member.displayName,
      kind: "human",
      parentId: memberParent,
      role: member.title ?? MEMBER_KIND_LABEL[member.kind],
      skills: [],
      memory: member.email
        ? `Reachable at ${member.email}.`
        : "Member of this organization.",
    });
  });

  orgAgents.forEach((agent) => {
    nodes.push({
      id: `org-${id}-agent-${agent.id}`,
      label: agent.role ?? agent.id,
      kind: "agent",
      parentId: memberParent,
      role: agent.role ?? "Digital worker",
      skills: Object.keys(agent.performance),
      memory: `Autonomy: ${agent.autonomy}.`,
    });
  });

  return nodes;
}