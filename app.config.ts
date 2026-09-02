import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'FitApp',
  slug: 'fitapp',
  scheme: 'fitapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.shangxu.fitapp',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'FitApp 需要访问您的位置以记录运动轨迹',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'FitApp 需要在后台持续记录您的运动轨迹',
      UIBackgroundModes: ['location'],
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    package: 'com.shangxu.fitapp',
    permissions: [
      'ACCESS_FINE_LOCATION',
      'ACCESS_COARSE_LOCATION',
      'ACCESS_BACKGROUND_LOCATION',
      'FOREGROUND_SERVICE',
      'FOREGROUND_SERVICE_LOCATION',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-sharing'],
  extra: {
    amapIosKey: process.env.AMAP_IOS_KEY ?? '',
    amapAndroidKey: process.env.AMAP_ANDROID_KEY ?? '',
  },
});
