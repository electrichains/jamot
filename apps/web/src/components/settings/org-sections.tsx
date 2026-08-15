"use client";

import { SectionHeading, Card } from "./section-primitives";

function OrgStub({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <SectionHeading title={title} description={description} />
      <Card className="max-w-xl">
        <p className="text-sm text-muted-foreground">
          This section is a placeholder and will be fleshed out in a later phase.
        </p>
      </Card>
    </div>
  );
}

export function GeneralOrgSection() {
  return <OrgStub title="General" description="Organization-wide settings." />;
}

export function PeopleOrgSection() {
  return <OrgStub title="People" description="Manage people in your organization." />;
}

export function RolesOrgSection() {
  return <OrgStub title="Roles" description="Define roles and permissions." />;
}

export function OrganicChartSection() {
  return (
    <OrgStub
      title="OrganicChart"
      description="The living org chart of your organization."
    />
  );
}

export function OrgAgentsSection() {
  return <OrgStub title="Agents" description="Shared organization agents." />;
}

export function AppsOrgSection() {
  return <OrgStub title="Apps" description="Apps connected to the organization." />;
}

export function ChannelsOrgSection() {
  return <OrgStub title="Channels" description="Shared communication channels." />;
}

export function SharedSkillsSection() {
  return <OrgStub title="Shared Skills" description="Skills shared across teams." />;
}

export function PoliciesSection() {
  return <OrgStub title="Policies" description="Policies that govern agent behavior." />;
}

export function TreasurySection() {
  return <OrgStub title="Treasury" description="Budgets and financial controls." />;
}

export function DreamSection() {
  return <OrgStub title="Dream" description="Long-term goals and vision." />;
}

export function OrgMemorySection() {
  return <OrgStub title="Memory" description="Shared organizational memory." />;
}

export function AuditSection() {
  return <OrgStub title="Audit" description="Audit logs and compliance." />;
}
