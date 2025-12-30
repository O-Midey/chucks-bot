#!/usr/bin/env node

import { RedisTest } from "./redis-test.js";
import { EnhancedTests } from "./enhanced-tests.js";

async function runTests() {
  const redisTester = new RedisTest();
  const enhancedTester = new EnhancedTests();

  try {
    await redisTester.runAllTests();
    console.log("\n--- Now running enhanced tests ---");
    await enhancedTester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error("❌ Test runner failed:", error);
    process.exit(1);
  }
}

runTests();
