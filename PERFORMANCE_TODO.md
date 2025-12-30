# Performance Optimization TODO

## 🔥 Critical Issues (Fix ASAP)

### 1. API Caching System
- [x] **Cache states data** (1 hour TTL)
  - File: `lib/handlers/healthInsuranceHandler/steps/LocationStep.js`
  - Method: `fetchAndShowStates()`
  - Impact: 2-5s → 200ms response time
  - ✅ **COMPLETED**: Redis caching implemented

- [x] **Cache LGAs data** (1 hour TTL)
  - File: `lib/handlers/healthInsuranceHandler/steps/LocationStep.js`
  - Method: `fetchAndShowLGAs()`
  - Impact: Reduce API calls by 80%
  - ✅ **COMPLETED**: Redis caching implemented

- [x] **Cache providers data** (30 min TTL)
  - File: `lib/handlers/healthInsuranceHandler/steps/ProviderSelectionStep.js`
  - Method: `loadAndShowProviders()`
  - Impact: Handle 10x more concurrent users
  - ✅ **COMPLETED**: Redis caching implemented

### 2. Memory Management
- [x] **Implement session cleanup scheduler**
  - File: `lib/session/sessionManager.js`
  - Add: `setInterval(SessionManager.cleanupOldSessions, 600000)`
  - Impact: Prevent memory leaks and server crashes
  - ✅ **COMPLETED**: Scheduler service created

- [x] **Redis session persistence**
  - File: `lib/session/sessionManager.js`
  - Impact: Sessions survive server restarts
  - ✅ **COMPLETED**: Full Redis implementation with fallback

- [ ] **Add provider pagination**
  - File: `lib/handlers/healthInsuranceHandler/steps/ProviderSelectionStep.js`
  - Limit: Show 20 providers at a time
  - Impact: Reduce memory usage by 70%

## ⚠️ Medium Priority

### 3. Request Optimization
- [ ] **Add request debouncing**
  - Files: All API service calls
  - Prevent: Duplicate requests within 1 second
  - Impact: Reduce API costs and confusion

- [ ] **Optimize string building**
  - Files: All formatter classes
  - Replace: String concatenation with array.join()
  - Impact: Better memory usage for large lists

### 4. Session Performance
- [ ] **Batch session updates**
  - File: `lib/session/sessionManager.js`
  - Combine: Multiple session operations
  - Impact: Faster response times

## 🚀 Nice to Have

### 5. Advanced Optimizations
- [ ] **Add Redis for session persistence**
  - Impact: Survive server restarts, enable scaling
  - Effort: 4-6 hours

- [ ] **Implement response compression**
  - Impact: Faster message delivery
  - Effort: 2 hours

- [ ] **Add monitoring and metrics**
  - Track: Response times, error rates, user flows
  - Effort: 3-4 hours

## 📊 Expected Results After Implementation

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Response Time | 2-5s | 200-500ms | 80-90% faster |
| Memory Usage | High | -70% | Much more stable |
| API Calls | Every request | -80% | Lower costs |
| Concurrent Users | ~10 | 100+ | 10x capacity |
| Server Uptime | Hours | Days/Weeks | Much more reliable |

## 🎯 Implementation Order

1. **Week 1**: API caching (items 1.1, 1.2, 1.3)
2. **Week 1**: Session cleanup (item 2.1)  
3. **Week 2**: Provider pagination (item 2.2)
4. **Week 2**: Request debouncing (item 3.1)
5. **Week 3**: String optimization (item 3.2)
6. **Future**: Redis implementation (item 5.1)

## 🔧 Quick Wins (30 min each)
- [ ] Session cleanup scheduler
- [ ] Basic API response caching
- [ ] Request deduplication

---
*Priority: Start with API caching for immediate 80% performance improvement*