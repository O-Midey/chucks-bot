// Debug payment configuration
console.log('🔍 Payment Configuration Check:');
console.log('GLOBALPAY_BASE_URL:', process.env.GLOBALPAY_BASE_URL ? '✅ Set' : '❌ Missing');
console.log('PAYMENT_BASIC_AUTH_USERNAME:', process.env.PAYMENT_BASIC_AUTH_USERNAME ? '✅ Set' : '❌ Missing');
console.log('PAYMENT_BASIC_AUTH_PASSWORD:', process.env.PAYMENT_BASIC_AUTH_PASSWORD ? '✅ Set' : '❌ Missing');

// Test API connection
import { GlobalPayAPIService } from './lib/services/globalPayApiService.js';

async function testPaymentAPI() {
  try {
    const service = new GlobalPayAPIService();
    
    // Test with minimal payment data
    const testPayment = {
      amount: 100,
      currency: 'NGN',
      customerFirstName: 'Test',
      customerLastName: 'User',
      customerEmail: 'test@example.com',
      customerPhone: '08012345678',
      customerAddress: 'Test Address',
      merchantTransactionReference: `TEST_${Date.now()}`
    };
    
    console.log('\n🧪 Testing payment initialization...');
    const result = await service.initiatePayment(testPayment);
    
    if (result.success) {
      console.log('✅ Payment API is working');
      console.log('Response:', result.data);
    } else {
      console.log('❌ Payment API failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Payment test failed');
    console.log('Error:', error.message);
  }
}

testPaymentAPI();