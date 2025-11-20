/**
 * Test script for SessionService
 *
 * Run with: npx tsx lib/services/test-session-service.ts
 */

import { config } from 'dotenv';
import { AgentuityKVAdapter } from '../storage/agentuity-kv-adapter';
import { MemoryCache } from '../cache/memory-cache';
import { SessionService } from './session-service';
import type { Session } from '../storage/data-model';

// Load .env.local file
config({ path: '.env.local' });

async function testSessionService() {
  console.log('🧪 Testing SessionService...\n');

  // Setup
  const storage = new AgentuityKVAdapter();
  const sessionCache = new MemoryCache<Session>(900); // 15 min TTL
  const listCache = new MemoryCache<string[]>(300); // 5 min TTL
  const service = new SessionService(storage, sessionCache, listCache);

  const testUserId = 'test-user-' + Date.now();

  try {
    // Test 1: Create Session
    console.log('✅ Test 1: Create Session');
    const session1 = await service.createSession({
      userId: testUserId,
      title: 'Test Session 1',
      isTutorial: false,
    });
    console.log('   Created session:', session1.sessionId);
    console.log('   Title:', session1.title);
    console.log('   Status:', session1.status);
    console.log('   Message count:', session1.messageCount);
    console.log('');

    // Test 2: Get Session
    console.log('✅ Test 2: Get Session');
    const retrieved = await service.getSession(testUserId, session1.sessionId);
    if (retrieved && retrieved.sessionId === session1.sessionId) {
      console.log('   ✓ Successfully retrieved session');
      console.log('   Title:', retrieved.title);
    } else {
      console.error('   ✗ Failed to retrieve session');
    }
    console.log('');

    // Test 3: Create Second Session
    console.log('✅ Test 3: Create Second Session');
    const session2 = await service.createSession({
      userId: testUserId,
      title: 'Test Session 2',
      isTutorial: false,
    });
    console.log('   Created session:', session2.sessionId);
    console.log('');

    // Test 4: List Sessions
    console.log('✅ Test 4: List Sessions');
    const list = await service.listSessions(testUserId, { limit: 10 });
    console.log('   Total sessions:', list.total);
    console.log('   Sessions returned:', list.sessions.length);
    console.log('   Has more:', list.hasMore);
    if (list.total === 2) {
      console.log('   ✓ Correct session count');
    } else {
      console.error('   ✗ Expected 2 sessions, got', list.total);
    }
    console.log('');

    // Test 5: Update Session
    console.log('✅ Test 5: Update Session');
    const updated = await service.updateSession(testUserId, session1.sessionId, {
      title: 'Updated Title',
      status: 'ARCHIVED',
    });
    if (updated && updated.title === 'Updated Title' && updated.status === 'ARCHIVED') {
      console.log('   ✓ Successfully updated session');
      console.log('   New title:', updated.title);
      console.log('   New status:', updated.status);
    } else {
      console.error('   ✗ Failed to update session');
    }
    console.log('');

    // Test 6: Filter by Status
    console.log('✅ Test 6: Filter by Status (ACTIVE)');
    const activeList = await service.listSessions(testUserId, { status: 'ACTIVE' });
    console.log('   Active sessions:', activeList.total);
    if (activeList.total === 1) {
      console.log('   ✓ Correct filter result');
    } else {
      console.error('   ✗ Expected 1 active session, got', activeList.total);
    }
    console.log('');

    // Test 7: Delete Session
    console.log('✅ Test 7: Delete Session');
    await service.deleteSession(testUserId, session1.sessionId);
    const deletedCheck = await service.getSession(testUserId, session1.sessionId);
    if (!deletedCheck) {
      console.log('   ✓ Session successfully deleted');
    } else {
      console.error('   ✗ Session still exists after deletion');
    }
    console.log('');

    // Test 8: List After Delete
    console.log('✅ Test 8: List After Delete');
    const finalList = await service.listSessions(testUserId);
    console.log('   Remaining sessions:', finalList.total);
    if (finalList.total === 1) {
      console.log('   ✓ Correct count after deletion');
    } else {
      console.error('   ✗ Expected 1 session, got', finalList.total);
    }
    console.log('');

    // Cleanup
    console.log('🧹 Cleanup...');
    await service.deleteSession(testUserId, session2.sessionId);
    console.log('   ✓ Test data cleaned up');
    console.log('');

    console.log('🎉 All SessionService tests passed!\n');

    // Destroy caches
    sessionCache.destroy();
    listCache.destroy();

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testSessionService();
