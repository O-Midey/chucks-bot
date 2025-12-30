import { SessionManager } from "../session/sessionManager.js";
import { cacheService } from "./cacheService.js";

class SchedulerService {
  constructor() {
    this.intervals = [];
  }

  start() {
    // In serverless environments (e.g. Vercel) setInterval-based background
    // jobs are unreliable. Only start the scheduler when explicitly enabled.
    if (process.env.RUN_SCHEDULER !== "true") {
      console.log("Scheduler service not started (RUN_SCHEDULER!=true)");
      return;
    }

    // Session cleanup every 10 minutes
    const sessionCleanup = setInterval(async () => {
      try {
        await SessionManager.cleanupOldSessions();
      } catch (error) {
        console.error("Session cleanup error:", error);
      }
    }, 600000); // 10 minutes

    // Cache cleanup every hour (optional, Redis handles TTL automatically)
    const cacheCleanup = setInterval(async () => {
      try {
        await cacheService.cleanup();
      } catch (error) {
        console.error("Cache cleanup error:", error);
      }
    }, 3600000); // 1 hour

    this.intervals.push(sessionCleanup, cacheCleanup);
    console.log("Scheduler service started");
  }

  stop() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
    console.log("Scheduler service stopped");
  }
}

export const schedulerService = new SchedulerService();
