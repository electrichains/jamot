export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  entities: string[];
  capabilities: string[];
  tools: string[];
  events: string[];
  hooks: string[];
  settings: Record<string, unknown>;
  canvas: string[];
  permissions: string[];
}

export interface AppRegistry {
  register(manifest: AppManifest): void;
  list(): AppManifest[];
  get(id: string): AppManifest | null;
}

export const SAMPLE_APPS: AppManifest[] = [
  {
    id: "crm",
    name: "CRM",
    version: "1.0.0",
    description: "Contacts, pipelines and deals.",
    entities: ["contact", "deal", "pipeline"],
    capabilities: ["contact.manage", "pipeline.track", "deal.close"],
    tools: ["contact.search", "deal.update"],
    events: ["contact.created", "deal.stage.changed"],
    hooks: ["on.deal.close"],
    settings: {},
    canvas: ["pipeline-board"],
    permissions: ["member"],
  },
  {
    id: "restaurant-reservations",
    name: "Restaurant Reservations",
    version: "1.0.0",
    description: "Table availability and reservation management.",
    entities: ["reservation", "table"],
    capabilities: ["reservation.create", "reservation.confirm", "table.assign"],
    tools: ["table.availability", "reservation.book"],
    events: ["reservation.created", "reservation.confirmed"],
    hooks: ["on.reservation.confirm"],
    settings: { timezone: "UTC" },
    canvas: ["floor-plan"],
    permissions: ["member"],
  },
  {
    id: "event-management",
    name: "Event Management",
    version: "1.0.0",
    description: "Scheduling, invitations and RSVP tracking.",
    entities: ["event", "invitation"],
    capabilities: ["event.schedule", "event.invite", "event.rsvp"],
    tools: ["event.schedule", "invitation.send"],
    events: ["event.scheduled", "event.rsvp.received"],
    hooks: ["on.event.rsvp"],
    settings: {},
    canvas: ["event-calendar"],
    permissions: ["admin"],
  },
];

export function createAppRegistry(seed: AppManifest[] = SAMPLE_APPS): AppRegistry {
  const apps = new Map<string, AppManifest>();
  for (const manifest of seed) {
    apps.set(manifest.id, manifest);
  }

  return {
    register(manifest) {
      apps.set(manifest.id, manifest);
    },
    list() {
      return [...apps.values()].sort((a, b) => a.id.localeCompare(b.id));
    },
    get(id) {
      return apps.get(id) ?? null;
    },
  };
}
