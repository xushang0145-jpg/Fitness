import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { AMapSdk } from 'react-native-amap3d';
import { colors } from '@/theme';
import { recoverActiveWorkout } from '@/services/trackingEngine';

const amapKey = Platform.select({
  ios: Constants.expoConfig?.extra?.amapIosKey ?? '',
  android: Constants.expoConfig?.extra?.amapAndroidKey ?? '',
});
if (amapKey) {
  AMapSdk.init(amapKey);
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    recoverActiveWorkout().then((recovered) => {
      if (recovered) {
        router.push('/workout/live');
      }
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.txt,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="workout"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            title: '设置',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
