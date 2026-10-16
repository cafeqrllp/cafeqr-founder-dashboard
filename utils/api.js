import axios from 'axios';

export const getApiUrl = () => {
  let envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const isTestEnv = hostname.includes('test') || hostname.includes('staging');
        if (isTestEnv) {
          return 'https://test-api.cafeqr.in';
        }
        return 'https://app.cafeqr.in';
      }
    }
    envUrl = 'http://localhost:8080';
  }
  return envUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');
};

const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const key = sessionStorage.getItem('founder_key') || process.env.NEXT_PUBLIC_FOUNDER_KEY;
    if (key) {
      config.headers['X-Founder-Key'] = key;
    }
  }
  return config;
});

export default api;
