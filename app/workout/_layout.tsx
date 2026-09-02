import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme';

export default function WorkoutLayout() {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.txt,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="live" options={{ title: '运动记录', headerBackVisible: false }} />
      <Stack.Screen name="finish" options={{ title: '运动完成', headerBackVisible: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: '运动详情',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
              <Ionicons name="chevron-back" size={26} color={colors.txt} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
