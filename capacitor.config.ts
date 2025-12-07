import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rushr.app',
  appName: 'Rushr',
  webDir: 'out',
  server: {
    // For development: use local server
    // For production: change to your deployed URL
    url: 'http://127.0.0.1:3001',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Rushr',
    backgroundColor: '#ffffff'
  }
};

export default config;
