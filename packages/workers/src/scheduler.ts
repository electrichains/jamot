import { pathToFileURL } from "node:url";
import { createDb, getDatabaseUrl } from "@jamot/core";
import { createPgRepository } from "@jamot/core/repository/pg";
import {
  createScheduler,
  createOutreachProcessor,
  isHeartbeatDue,
  withAdvisoryLock,
  DEFAULT_HEARTBEAT_ACTIONS,
} from "@jamot/core/scheduler";

export interface SchedulerWorkerOptions {
  databaseUrl?: string;
  intervalMs?: number;
}

export async function startSchedulerWorker(
  opts: SchedulerWorkerOptions = {},
): Promise<void> {
  const databaseUrl = opts.databaseUrl ?? getDatabaseUrl();
  const dbHandle = createDb(databaseUrl);
  const repo = createPgRepository(dbHandle);
  const scheduler = createScheduler();
  const outreach = createOutreachProcessor(repo);

  scheduler.register({
    id: "outreach",
    cron: "* * * * *",
    async run() {
      const result = await outreach.processDue(new Date());
      if (result.created > 0 || result.skipped > 0) {
        console.log("[outreach]", result);
      }
    },
  });

  scheduler.register({
    id: "heartbeats",
    cron: "* * * * *",
    async run() {
      const now = new Date();
      const agents = await repo.listAgents();
      for (const agent of agents) {
        if (!isHeartbeatDue(agent.heartbeat, now)) continue;
        const scopes =
          agent.heartbeat.check.length > 0
            ? agent.heartbeat.check
            : DEFAULT_HEARTBEAT_ACTIONS;
        for (const scope of scopes) {
          console.log("[heartbeat]", agent.id, scope, {
            onAction: agent.heartbeat.onAction,
          });
        }
      }
    },
  });

  const intervalMs = opts.intervalMs ?? 30_000;

  for (;;) {
    await withAdvisoryLock(dbHandle.pool, 0x4a616d6f74, async () => {
      await scheduler.runDue(new Date());
    });
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  void startSchedulerWorker();
}
