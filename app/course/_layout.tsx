import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function CourseLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.txt,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: '课程详情' }} />
      <Stack.Screen
        name="active"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="finish"
        options={{ title: '跟练完成', headerBackVisible: false }}
      />
      <Stack.Screen name="history" options={{ title: '跟练历史' }} />
      <Stack.Screen name="history/[id]" options={{ title: '跟练详情' }} />
    </Stack>
  );
}
