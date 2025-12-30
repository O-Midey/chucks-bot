#!/usr/bin/env node

import { RedisTest } from './redis-test.js';

async function runTests() {
  const tester = new RedisTest();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

runTests();