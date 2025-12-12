import type { CapacitorConfig } from '@capacitor/cli';

// For development: set to true to load from localhost
// For TestFlight/App Store: set to false to load from production
const USE_LOCAL_DEV = false; // Set to true for simulator testing

const config: CapacitorConfig = {
  appId: 'com.rushr.app',
  appName: 'Rushr',
  webDir: 'out',
  server: USE_LOCAL_DEV ? {
    // Local development - loads from dev server
    url: 'http://localhost:3001',
    cleartext: true
  } : {
    // Production - loads from deployed site
    url: 'https://www.userushr.com',
    cleartext: false
  },
  ios: {
    contentInset: 'never',
    scheme: 'Rushr',
    backgroundColor: '#ffffff'
  }
};

export default config;
