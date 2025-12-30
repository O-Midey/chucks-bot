import { SessionManager } from "../lib/session/sessionManager.js";
import { MessageRouter } from "../lib/messageRouter.js";
import { QuoteHandler } from "../lib/handlers/quoteHandler.js";
import { cacheService } from "../lib/services/cacheService.js";
import { STATES } from "../lib/config/constants.js";

class EnhancedTests {
  constructor() {
    this.testResults = [];
  }

  log(test, status, message = "") {
    const result = {
      test,
      status,
      message,
      timestamp: new Date().toISOString(),
    };
    this.testResults.push(result);
    const emoji = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏳";
    console.log(`${emoji} ${test}: ${status} ${message}`);
  }

  async testClearSessionNotification() {
    const testUser = "enhanced-test-user-1";
    try {
      process.env.TEST_MODE = "true";

      // Create a session and persist it
      await SessionManager.updateSession(testUser, STATES.HEALTH_REG_SURNAME, {
        surname: "Tester",
      });

      // Clear with notify=true should return a friendly message in TEST_MODE
      const cleared = await SessionManager.clearSession(testUser, true);
      if (!cleared || !cleared.toLowerCase().includes("session cleared")) {
        this.log(
          "Clear Session Notification",
          "FAIL",
          "Expected cleared message to be returned in TEST_MODE"
        );
        return false;
      }

      // Session should no longer exist in cache
      const s = await cacheService.getSession(testUser);
      if (s) {
        this.log(
          "Clear Session Notification",
          "FAIL",
          "Session still present after clearSession"
        );
        return false;
      }

      this.log(
        "Clear Session Notification",
        "PASS",
        "clearSession returned message and removed session"
      );
      return true;
    } catch (err) {
      this.log(
        "Clear Session Notification",
        "FAIL",
        err.message || String(err)
      );
      return false;
    }
  }

  async testGreetingClearsAndWelcomes() {
    const testUser = "enhanced-test-user-2";
    try {
      process.env.TEST_MODE = "true";

      // Ensure there is a session to be cleared
      await SessionManager.updateSession(testUser, STATES.HEALTH_REG_SURNAME, {
        surname: "Greeting",
      });

      const response = await MessageRouter.route(testUser, "Hi");
      const msg = response?.message || "";

      if (
        !msg.toLowerCase().includes("session cleared") ||
        !msg.includes("*MAIN MENU*")
      ) {
        this.log(
          "Greeting Clears and Welcomes",
          "FAIL",
          `Unexpected router response: ${msg.slice(0, 120)}`
        );
        return false;
      }

      this.log(
        "Greeting Clears and Welcomes",
        "PASS",
        "Greeting triggers session clear and returns welcome/menu"
      );
      return true;
    } catch (err) {
      this.log(
        "Greeting Clears and Welcomes",
        "FAIL",
        err.message || String(err)
      );
      return false;
    }
  }

  async testQuoteHandlerComingSoon() {
    const testUser = "enhanced-test-user-3";
    try {
      process.env.TEST_MODE = "true";

      // Call QuoteHandler with a non-health option (2 => Auto)
      const result = await QuoteHandler.handle(testUser, "2", "2");

      if (!result || !result.message || result.state !== STATES.MAIN_MENU) {
        this.log(
          "Quote Handler Coming Soon",
          "FAIL",
          `Unexpected result: ${JSON.stringify(result)}`
        );
        return false;
      }

      if (!result.message.toLowerCase().includes("coming soon")) {
        this.log(
          "Quote Handler Coming Soon",
          "FAIL",
          "Message did not indicate coming soon"
        );
        return false;
      }

      // Session should be set to MAIN_MENU
      const session = await SessionManager.getSession(testUser);
      if (!session || session.state !== STATES.MAIN_MENU) {
        this.log(
          "Quote Handler Coming Soon",
          "FAIL",
          "Session state not set to MAIN_MENU after handling coming-soon"
        );
        return false;
      }

      this.log(
        "Quote Handler Coming Soon",
        "PASS",
        "QuoteHandler returned coming-soon message and set MAIN_MENU"
      );
      return true;
    } catch (err) {
      this.log("Quote Handler Coming Soon", "FAIL", err.message || String(err));
      return false;
    }
  }

  async runAllTests() {
    const tests = [
      {
        name: "Clear Session Notification",
        fn: () => this.testClearSessionNotification(),
      },
      {
        name: "Greeting Clears and Welcomes",
        fn: () => this.testGreetingClearsAndWelcomes(),
      },
      {
        name: "Quote Handler Coming Soon",
        fn: () => this.testQuoteHandlerComingSoon(),
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const t of tests) {
      console.log("");
      this.log(t.name, "RUNNING", "Starting test...");
      try {
        const ok = await t.fn();
        if (ok) passed++;
        else failed++;
      } catch (err) {
        this.log(t.name, "FAIL", err.message || String(err));
        failed++;
      }
    }

    console.log("\n📊 Enhanced Test Results:");
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    return { passed, failed, results: this.testResults };
  }
}

export { EnhancedTests };
