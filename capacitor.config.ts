import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rushr.app',
  appName: 'Rushr',
  webDir: 'public',
  server: {
    // Point to your live/staging server - the app loads from there
    url: 'https://staging-rushr.netlify.app',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'Rushr',
    backgroundColor: '#ffffff'
  }
};

export default config;
