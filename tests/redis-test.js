import { cacheService } from '../lib/services/cacheService.js';
import { SessionManager } from '../lib/session/sessionManager.js';
import { STATES } from '../lib/config/constants.js';

class RedisTest {
  constructor() {
    this.testResults = [];
  }

  log(test, status, message = '') {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
    console.log(`${emoji} ${test}: ${status} ${message}`);
  }

  async testRedisConnection() {
    try {
      await cacheService.set('test:connection', 'hello', 10);
      const result = await cacheService.get('test:connection');
      
      if (result === 'hello') {
        this.log('Redis Connection', 'PASS', 'Successfully connected and stored data');
        await cacheService.del('test:connection');
        return true;
      } else {
        this.log('Redis Connection', 'FAIL', 'Data mismatch');
        return false;
      }
    } catch (error) {
      this.log('Redis Connection', 'FAIL', error.message);
      return false;
    }
  }

  async testCacheOperations() {
    try {
      // Test states caching
      const mockStates = [
        { id: 1, name: 'Lagos' },
        { id: 2, name: 'Abuja' }
      ];
      
      await cacheService.setStates(mockStates);
      const cachedStates = await cacheService.getStates();
      
      if (JSON.stringify(cachedStates) === JSON.stringify(mockStates)) {
        this.log('States Caching', 'PASS', 'States cached and retrieved correctly');
      } else {
        this.log('States Caching', 'FAIL', 'States data mismatch');
        return false;
      }

      // Test LGAs caching
      const mockLGAs = [
        { id: 1, local_name: 'Ikeja' },
        { id: 2, local_name: 'Victoria Island' }
      ];
      
      await cacheService.setLGAs('1', mockLGAs);
      const cachedLGAs = await cacheService.getLGAs('1');
      
      if (JSON.stringify(cachedLGAs) === JSON.stringify(mockLGAs)) {
        this.log('LGAs Caching', 'PASS', 'LGAs cached and retrieved correctly');
      } else {
        this.log('LGAs Caching', 'FAIL', 'LGAs data mismatch');
        return false;
      }

      return true;
    } catch (error) {
      this.log('Cache Operations', 'FAIL', error.message);
      return false;
    }
  }

  async testSessionManagement() {
    try {
      const testUserId = 'test-user-123';
      
      // Test session creation
      const session = await SessionManager.getSession(testUserId);
      if (session && session.state === STATES.MAIN_MENU) {
        this.log('Session Creation', 'PASS', 'Session created with correct initial state');
      } else {
        this.log('Session Creation', 'FAIL', 'Session not created properly');
        return false;
      }

      // Test session update
      await SessionManager.updateSession(testUserId, STATES.HEALTH_REG_SURNAME, { 
        surname: 'TestSurname' 
      });
      
      const updatedSession = await SessionManager.getSession(testUserId);
      if (updatedSession.state === STATES.HEALTH_REG_SURNAME && 
          updatedSession.data.surname === 'TestSurname') {
        this.log('Session Update', 'PASS', 'Session updated correctly');
      } else {
        this.log('Session Update', 'FAIL', 'Session update failed');
        return false;
      }

      // Cleanup
      await SessionManager.clearSession(testUserId);
      
      return true;
    } catch (error) {
      this.log('Session Management', 'FAIL', error.message);
      return false;
    }
  }

  async runAllTests() {
    console.log('🧪 Starting Redis Implementation Tests...\n');
    
    const tests = [
      { name: 'Redis Connection', fn: () => this.testRedisConnection() },
      { name: 'Cache Operations', fn: () => this.testCacheOperations() },
      { name: 'Session Management', fn: () => this.testSessionManagement() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(test.name, 'RUNNING', 'Starting test...');
      try {
        const result = await test.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.log(test.name, 'FAIL', `Unexpected error: ${error.message}`);
        failed++;
      }
      console.log('');
    }

    console.log('📊 Test Results Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! Redis implementation is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }

    return { passed, failed, results: this.testResults };
  }
}

export { RedisTest };