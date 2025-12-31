import { cacheService } from '../lib/services/cacheService.js';
import { SessionManager } from '../lib/session/sessionManager.js';
import { STATES } from '../lib/config/constants.js';

class VercelCacheTest {
  constructor() {
    this.testResults = [];
  }

  log(test, status, message = '') {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳';
    console.log(`${emoji} ${test}: ${status} ${message}`);
  }

  testInMemoryCache() {
    try {
      // Test basic cache operations
      cacheService.set('test:basic', 'hello world', 10);
      const result = cacheService.get('test:basic');
      
      if (result === 'hello world') {
        this.log('In-Memory Cache', 'PASS', 'Basic cache operations work');
      } else {
        this.log('In-Memory Cache', 'FAIL', 'Cache data mismatch');
        return false;
      }

      // Test TTL expiration (simulate with past timestamp)
      const pastTime = Date.now() - 1000; // 1 second ago
      cacheService.cache.set('test:ttl', {
        data: 'expires',
        expires: pastTime,
        created: pastTime - 1000
      });
      const expiredResult = cacheService.get('test:ttl');
      
      if (expiredResult === null) {
        this.log('Cache TTL', 'PASS', 'TTL expiration works correctly');
      } else {
        this.log('Cache TTL', 'FAIL', 'TTL not working');
        return false;
      }

      return true;
    } catch (error) {
      this.log('In-Memory Cache', 'FAIL', error.message);
      return false;
    }
  }

  testApiCaching() {
    try {
      // Test states caching
      const mockStates = [
        { id: 1, name: 'Lagos' },
        { id: 2, name: 'Abuja' }
      ];
      
      cacheService.setStates(mockStates);
      const cachedStates = cacheService.getStates();
      
      if (JSON.stringify(cachedStates) === JSON.stringify(mockStates)) {
        this.log('States Caching', 'PASS', 'States cached correctly');
      } else {
        this.log('States Caching', 'FAIL', 'States data mismatch');
        return false;
      }

      // Test LGAs caching
      const mockLGAs = [
        { id: 1, local_name: 'Ikeja' },
        { id: 2, local_name: 'Victoria Island' }
      ];
      
      cacheService.setLGAs('1', mockLGAs);
      const cachedLGAs = cacheService.getLGAs('1');
      
      if (JSON.stringify(cachedLGAs) === JSON.stringify(mockLGAs)) {
        this.log('LGAs Caching', 'PASS', 'LGAs cached correctly');
      } else {
        this.log('LGAs Caching', 'FAIL', 'LGAs data mismatch');
        return false;
      }

      return true;
    } catch (error) {
      this.log('API Caching', 'FAIL', error.message);
      return false;
    }
  }

  testSessionManagement() {
    try {
      const testUserId = 'test-user-vercel-123';
      
      // Test session creation
      const session = SessionManager.getSession(testUserId);
      if (session && session.state === STATES.MAIN_MENU) {
        this.log('Session Creation', 'PASS', 'Session created correctly');
      } else {
        this.log('Session Creation', 'FAIL', 'Session not created properly');
        return false;
      }

      // Test session update
      SessionManager.updateSession(testUserId, STATES.HEALTH_REG_SURNAME, { 
        surname: 'TestSurname' 
      });
      
      const updatedSession = SessionManager.getSession(testUserId);
      if (updatedSession.state === STATES.HEALTH_REG_SURNAME && 
          updatedSession.data.surname === 'TestSurname') {
        this.log('Session Update', 'PASS', 'Session updated correctly');
      } else {
        this.log('Session Update', 'FAIL', 'Session update failed');
        return false;
      }

      // Test session persistence across function calls
      const persistedSession = SessionManager.getSession(testUserId);
      if (persistedSession.data.surname === 'TestSurname') {
        this.log('Session Persistence', 'PASS', 'Session persisted in global cache');
      } else {
        this.log('Session Persistence', 'FAIL', 'Session not persisted');
        return false;
      }

      // Cleanup
      SessionManager.clearSession(testUserId);
      
      return true;
    } catch (error) {
      this.log('Session Management', 'FAIL', error.message);
      return false;
    }
  }

  testCacheStats() {
    try {
      // Add some test data
      cacheService.set('test:stats1', 'data1', 3600);
      cacheService.set('test:stats2', 'data2', 3600);
      cacheService.set('test:expired', 'expired', 0);
      
      const stats = cacheService.getStats();
      
      if (stats.total >= 2) {
        this.log('Cache Stats', 'PASS', `Cache contains ${stats.total} items, ${stats.active} active`);
      } else {
        this.log('Cache Stats', 'FAIL', 'Stats not working correctly');
        return false;
      }

      return true;
    } catch (error) {
      this.log('Cache Stats', 'FAIL', error.message);
      return false;
    }
  }

  runAllTests() {
    console.log('🧪 Starting Vercel Cache Tests...\n');
    
    const tests = [
      { name: 'In-Memory Cache', fn: () => this.testInMemoryCache() },
      { name: 'API Caching', fn: () => this.testApiCaching() },
      { name: 'Session Management', fn: () => this.testSessionManagement() },
      { name: 'Cache Stats', fn: () => this.testCacheStats() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(test.name, 'RUNNING', 'Starting test...');
      try {
        const result = test.fn();
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
      console.log('\n🎉 All tests passed! Vercel cache implementation is working correctly.');
      console.log('🚀 Your app is now optimized for serverless deployment!');
    } else {
      console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }

    return { passed, failed, results: this.testResults };
  }
}

export { VercelCacheTest };