import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rushr.app',
  appName: 'Rushr',
  webDir: 'out',
  server: {
    // For development: use local server
    // For production: change to your deployed URL
    url: 'http://localhost:3001',
    cleartext: true
  },
  ios: {
    contentInset: 'never', // Allow content to draw behind status bar for fullscreen map
    scheme: 'Rushr',
    backgroundColor: '#ffffff'
  }
};

export default config;
