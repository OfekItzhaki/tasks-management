const axios = require('axios');

async function testLogin() {
  try {
    console.log('Attempting login...');
    const response = await axios.post(
      'http://localhost:3000/api/v1/auth/login',
      {
        email: 'test@example.com',
        password: 'password',
      },
    );
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Full error object:', error);
    if (error.response) {
      console.error('Login failed with status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Login failed (no response):', error.message);
      console.error('Error code:', error.code);
    }
  }
}

testLogin();
