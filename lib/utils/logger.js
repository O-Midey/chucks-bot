export class Logger {
  static logWebhook(req, res) {
    console.log('\n=== WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('========================\n');
  }

  static logAPICall(endpoint, method, data, response) {
    console.log('\n=== API CALL ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Endpoint:', endpoint);
    console.log('Method:', method);
    console.log('Request Data:', JSON.stringify(data, null, 2));
    console.log('Response:', JSON.stringify(response, null, 2));
    console.log('================\n');
  }

  static logError(error, context) {
    console.error('\n=== ERROR ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Context:', context);
    console.error('Error:', error);
    console.error('=============\n');
  }
}