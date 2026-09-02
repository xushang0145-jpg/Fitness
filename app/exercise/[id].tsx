import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getActionById } from '@/services/courseConfig';
import { startCourse } from '@/services/courseEngine';
import { formatCourseCategory, formatDifficulty } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const found = useMemo(() => (id ? getActionById(id) : null), [id]);

  if (!found) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: '动作详情' }} />
        <Text style={styles.loading}>未找到动作</Text>
      </View>
    );
  }

  const { action, course } = found;
  const steps = (action.instruction ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const targetText =
    action.type === 'counter'
      ? `${action.targetReps ?? 0} 次`
      : `${action.targetDurationS ?? 0} 秒`;

  const handleStart = async () => {
    try {
      await startCourse(course.id);
      router.push('/course/active');
    } catch (error) {
      Alert.alert('启动失败', error instanceof Error ? error.message : '请重试');
    }
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: action.title }} />
      <ScrollView>
        <View style={styles.cover}>
          <Text style={styles.coverEmoji}>{action.image ?? '🏋️'}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.pillsRow}>
            <View style={[styles.pill, styles.pillCategory]}>
              <Text style={[styles.pillText, { color: colors.blue }]}>
                {formatCourseCategory(course.category)} · {course.title}
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{course.equipment}</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {formatDifficulty(course.difficulty)}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{action.title}</Text>
          <Text style={styles.subtitle}>{course.subtitle}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{action.sets ?? 1}</Text>
              <Text style={styles.statLabel}>组数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{targetText}</Text>
              <Text style={styles.statLabel}>
                {action.type === 'counter' ? '每组次数' : '每组时长'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {action.restBetweenSetsS ? `${action.restBetweenSetsS}s` : '—'}
              </Text>
              <Text style={styles.statLabel}>组间休息</Text>
            </View>
          </View>

          {steps.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>动作要领</Text>
              <View style={styles.stepList}>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {action.breathing && (
            <View style={styles.breathingCard}>
              <View style={styles.breathingHeader}>
                <Ionicons name="leaf-outline" size={15} color={colors.blue} />
                <Text style={[styles.breathingTitle, { color: colors.blue }]}>
                  呼吸节奏
                </Text>
              </View>
              <Text style={styles.breathingText}>{action.breathing}</Text>
            </View>
          )}

          {action.commonMistake && (
            <View style={styles.mistakeCard}>
              <View style={styles.breathingHeader}>
                <Ionicons name="warning-outline" size={15} color={colors.orange} />
                <Text style={[styles.breathingTitle, { color: colors.orange }]}>
                  常见错误
                </Text>
              </View>
              <Text style={styles.breathingText}>{action.commonMistake}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Ionicons name="play" size={18} color={colors.bg} />
            <Text style={styles.startButtonText}>开始本课程</Text>
          </TouchableOpacity>

          <View style={{ height: spacing.xl }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    ...typography.label,
    color: colors.txt2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  cover: {
    height: 240,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 96 },
  body: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: colors.card2,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillCategory: {
    backgroundColor: 'rgba(91,200,245,0.14)',
    borderColor: 'transparent',
  },
  pillText: {
    fontSize: 12,
    color: colors.txt2,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.txt,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...typography.num,
    fontSize: 18,
    color: colors.txt,
  },
  statLabel: {
    ...typography.label,
    color: colors.txt3,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.txt,
    marginTop: spacing.xl,
  },
  stepList: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.accSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.acc,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: colors.txt,
  },
  breathingCard: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(91,200,245,0.07)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(91,200,245,0.25)',
    padding: spacing.md,
  },
  mistakeCard: {
    marginTop: spacing.md,
    backgroundColor: 'rgba(255,138,91,0.07)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,138,91,0.25)',
    padding: spacing.md,
  },
  breathingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  breathingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  breathingText: {
    fontSize: 12,
    lineHeight: 19,
    color: colors.txt2,
    marginTop: spacing.sm,
  },
  startButton: {
    backgroundColor: colors.acc,
    height: 54,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
  },
});
