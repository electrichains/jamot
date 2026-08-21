"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AppWindow,
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  Cpu,
  Database,
  FileText,
  Layers,
  Lock,
  MemoryStick,
  MessageSquare,
  Moon,
  Network,
  Palette,
  Plug,
  Scroll,
  ShieldCheck,
  Sparkles,
  User,
  UserCog,
  UserRound,
  Users,
  Vault as VaultIcon,
  Wallet,
  Wand,
  Zap,
} from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { useAuth } from "@/components/auth/auth-context";
import { useActiveOrg } from "@/components/settings/use-active-org";
import { SettingsLayout, type SettingsGroup, type SettingsSection } from "@/components/settings/settings-layout";
import {
  AccountSection,
  AppearanceSection,
  ConnectorsSection,
  MemorySection,
  NotificationsSection,
  PersonalAgentsSection,
  PrivacyConsentSection,
  ProfileSection,
  SecuritySection,
  SkillsSection,
} from "@/components/settings/personal-sections";
import {
  AppsOrgSection,
  AuditSection,
  CapabilitiesOrgSection,
  ChannelsOrgSection,
  ConnectorsOrgSection,
  DreamSection,
  GeneralOrgSection,
  KnowledgeOrgSection,
  OrganicChartSection,
  OrgAgentsSection,
  OrgMemorySection,
  PeopleOrgSection,
  PoliciesSection,
  RolesOrgSection,
  SharedSkillsSection,
  TreasurySection,
  WorkspaceSettingsSection,
} from "@/components/settings/org-sections";
import { Vault } from "@/components/settings/Vault";
import { ModelsSection } from "@/components/settings/models-section";

const MAIN_SECTIONS: SettingsSection[] = [
  { id: "account", label: "Account", icon: User, body: <AccountSection /> },
  { id: "profile", label: "Profile", icon: UserRound, body: <ProfileSection /> },
  { id: "memory", label: "Memory", icon: MemoryStick, body: <MemorySection /> },
  {
    id: "privacy",
    label: "Privacy & Consent",
    icon: Lock,
    body: <PrivacyConsentSection />,
  },
  { id: "vault", label: "Vault", icon: VaultIcon, body: <Vault /> },
  { id: "models", label: "Models", icon: Cpu, body: <ModelsSection /> },
  { id: "connectors", label: "Connectors", icon: Plug, body: <ConnectorsSection /> },
  { id: "skills", label: "Skills", icon: Sparkles, body: <SkillsSection /> },
  {
    id: "personal-agents",
    label: "Personal Agents",
    icon: Bot,
    body: <PersonalAgentsSection />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    body: <NotificationsSection />,
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    body: <AppearanceSection />,
  },
  {
    id: "security",
    label: "Security",
    icon: ShieldCheck,
    body: <SecuritySection />,
  },
];

const ORG_GROUP: SettingsGroup = {
  title: "Organization",
  sections: [
    { id: "org-general", label: "General", icon: Building2, body: <GeneralOrgSection /> },
    { id: "org-people", label: "People", icon: Users, body: <PeopleOrgSection /> },
    { id: "org-roles", label: "Roles", icon: UserCog, body: <RolesOrgSection /> },
    {
      id: "org-chart",
      label: "OrganicChart",
      icon: Network,
      body: <OrganicChartSection />,
    },
    { id: "org-agents", label: "Agents", icon: Bot, body: <OrgAgentsSection /> },
    { id: "org-apps", label: "Apps", icon: AppWindow, body: <AppsOrgSection /> },
    {
      id: "org-connectors",
      label: "Connectors",
      icon: Plug,
      body: <ConnectorsOrgSection />,
    },
    {
      id: "org-channels",
      label: "Channels",
      icon: MessageSquare,
      body: <ChannelsOrgSection />,
    },
    {
      id: "org-shared-skills",
      label: "Shared Skills",
      icon: Wand,
      body: <SharedSkillsSection />,
    },
    {
      id: "org-capabilities",
      label: "Capabilities",
      icon: Zap,
      body: <CapabilitiesOrgSection />,
    },
    {
      id: "org-knowledge",
      label: "Knowledge",
      icon: Database,
      body: <KnowledgeOrgSection />,
    },
    { id: "org-policies", label: "Policies", icon: Scroll, body: <PoliciesSection /> },
    { id: "org-treasury", label: "Treasury", icon: Wallet, body: <TreasurySection /> },
    { id: "org-dream", label: "Dream", icon: Moon, body: <DreamSection /> },
    {
      id: "org-memory",
      label: "Memory",
      icon: Database,
      body: <OrgMemorySection />,
    },
    { id: "org-audit", label: "Audit", icon: FileText, body: <AuditSection /> },
  ],
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { space, isOrg } = useActiveOrg();

  const groups = useMemo<SettingsGroup[]>(() => {
    const mainGroup: SettingsGroup = {
      title: space.name,
      sections: isOrg
        ? [
            ...MAIN_SECTIONS,
            {
              id: "ws-settings",
              label: "Workspace settings",
              icon: Layers,
              body: <WorkspaceSettingsSection />,
            },
          ]
        : MAIN_SECTIONS,
    };
    const result: SettingsGroup[] = [mainGroup];
    if (user?.isSuperAdmin) result.push(ORG_GROUP);
    return result;
  }, [user?.isSuperAdmin, isOrg, space.name]);

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          <BrandLogo className="size-5" />
        </Link>
        <span className="font-display text-sm font-semibold">Settings</span>
      </header>
      <div className="min-h-0 flex-1">
        <SettingsLayout groups={groups} />
      </div>
    </div>
  );
}
