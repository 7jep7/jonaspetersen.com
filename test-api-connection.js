// Test script to verify API client connection
import { apiClient } from './app/lib/api-client.js';

console.log('Testing PLC API client...');

// Test context
const testContext = {
  device_constants: {},
  information: "Test connection"
};

try {
  console.log('Making test API call...');
  const response = await apiClient.updateContext(
    testContext,
    'gathering_requirements',
    'Test message'
  );
  console.log('API call successful!', response);
} catch (error) {
  console.error('API call failed:', error);
}