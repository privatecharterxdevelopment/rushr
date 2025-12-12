import type { CapacitorConfig } from '@capacitor/cli';

// Toggle between local development and production
const USE_LOCAL_DEV = false; // Set to false for TestFlight/production builds

const config: CapacitorConfig = {
  appId: 'com.rushr.app',
  appName: 'Rushr',
  webDir: 'out',
  server: USE_LOCAL_DEV ? {
    // Local development - point to your dev server IP
    url: 'http://172.20.10.3:3001',
    cleartext: true // Allow HTTP for local dev
  } : {
    // Production URL for TestFlight
    url: 'https://www.userushr.com',
    cleartext: false
  },
  ios: {
    contentInset: 'never', // Allow content to draw behind status bar for fullscreen map
    scheme: 'Rushr',
    backgroundColor: '#ffffff'
  }
};

export default config;
