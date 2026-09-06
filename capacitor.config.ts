/// <reference types="@capacitor/status-bar" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibecheck.goldenhour',
  appName: 'Vibe Check',
  webDir: 'dist',
  backgroundColor: '#5A2430',
  loggingBehavior: 'production',
  ios: {
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#5A2430',
    },
  },
};

export default config;
