import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function testProfileAPI() {
  try {
    console.log('Testing profile API...');
    console.log('API Base URL:', API_BASE_URL);
    
    // First, let's try to login to get a token
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'rubaiyat2009@gmail.com', // User with USD balance from our check
      password: 'password123' // Assuming this is the password
    });
    
    console.log('Login response:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      
      // Now test the profile endpoint
      const profileResponse = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Profile response:', profileResponse.data);
      console.log('User balances:', profileResponse.data.user?.balances);
    }
    
  } catch (error: any) {
    console.error('Error testing profile API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProfileAPI();