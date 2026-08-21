import {
  Bot,
  CalendarDays,
  Contact,
  DollarSign,
  FolderKanban,
  LayoutGrid,
  ListChecks,
  Megaphone,
  Package,
  Puzzle,
  Store,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  people: Users,
  agents: Bot,
  tasks: ListChecks,
  canvas: LayoutGrid,
  calendar: CalendarDays,
  inventory: Package,
  suppliers: Truck,
  crm: Contact,
  leads: Users,
  outreach: Megaphone,
  finance: DollarSign,
  whatsapp: Users,
  organization: FolderKanban,
  store: Store,
};

/** Map an app id to a lucide icon. The app registry has no icon field, so this
 * curated map provides sensible defaults; unknown ids fall back to Puzzle. */
export function appIcon(id: string): LucideIcon {
  return ICONS[id] ?? Puzzle;
}
