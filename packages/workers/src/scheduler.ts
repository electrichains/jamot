import { pathToFileURL } from "node:url";
import { createDb, getDatabaseUrl } from "@jamot/core";
import { createPgRepository } from "@jamot/core/repository/pg";
import {
  createScheduler,
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

  scheduler.register({
    id: "heartbeats",
    cron: "* * * * *",
    async run() {
      const now = new Date();
      const agents = await repo.listAgents();
      for (const agent of agents) {
        if (!isHeartbeatDue(agent.heartbeat, now)) continue;
        for (const action of DEFAULT_HEARTBEAT_ACTIONS) {
          console.log("[heartbeat]", agent.id, action);
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
