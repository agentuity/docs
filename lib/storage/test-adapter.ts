/**
 * Test script for Agentuity KV Adapter
 *
 * Run with: npx tsx lib/storage/test-adapter.ts
 * Or: node --loader tsx lib/storage/test-adapter.ts
 */

import { config } from 'dotenv';
import { AgentuityKVAdapter } from './agentuity-kv-adapter';

// Load .env.local file
config({ path: '.env.local' });

async function testAdapter() {
  console.log('🧪 Testing Agentuity KV Adapter...\n');

  const adapter = new AgentuityKVAdapter();
  const testBucket = 'test-bucket';
  const testKey = 'test-key';
  const testData = {
    message: 'Hello from storage adapter!',
    timestamp: new Date().toISOString(),
    nested: {
      data: 'works',
    },
  };

  try {
    // Test 1: SET
    console.log('✅ Test 1: SET operation');
    await adapter.set(testBucket, testKey, testData);
    console.log('   ✓ Successfully set test data\n');

    // Test 2: GET (should exist)
    console.log('✅ Test 2: GET operation (existing key)');
    const result1 = await adapter.get(testBucket, testKey);
    console.log('   Result:', JSON.stringify(result1, null, 2));

    if (result1.exists && result1.data) {
      console.log('   ✓ Successfully retrieved data\n');
    } else {
      console.error('   ✗ Expected data to exist\n');
    }

    // Test 3: GET (non-existent key)
    console.log('✅ Test 3: GET operation (non-existent key)');
    const result2 = await adapter.get(testBucket, 'non-existent-key');
    console.log('   Result:', JSON.stringify(result2, null, 2));

    if (!result2.exists) {
      console.log('   ✓ Correctly returns exists: false\n');
    } else {
      console.error('   ✗ Expected exists to be false\n');
    }

    // Test 4: SET with TTL
    console.log('✅ Test 4: SET with TTL (60 seconds)');
    await adapter.set(testBucket, `${testKey}-ttl`, testData, { ttl: 60 });
    console.log('   ✓ Successfully set data with TTL\n');

    // Test 5: DELETE
    console.log('✅ Test 5: DELETE operation');
    await adapter.delete(testBucket, testKey);
    console.log('   ✓ Successfully deleted key\n');

    // Test 6: GET (should not exist after delete)
    console.log('✅ Test 6: GET after DELETE');
    const result3 = await adapter.get(testBucket, testKey);
    console.log('   Result:', JSON.stringify(result3, null, 2));

    if (!result3.exists) {
      console.log('   ✓ Key correctly deleted\n');
    } else {
      console.error('   ✗ Expected key to be deleted\n');
    }

    // Cleanup TTL test key
    await adapter.delete(testBucket, `${testKey}-ttl`);

    console.log('🎉 All tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAdapter();
