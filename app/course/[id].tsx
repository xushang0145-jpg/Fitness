import { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCourseById } from '@/services/courseConfig';
import { startCourse } from '@/services/courseEngine';
import {
  formatCourseCategory,
  formatDifficulty,
} from '@/domain/format';
import type { CourseAction } from '@/domain/course';
import { colors, typography, spacing, radius } from '@/theme';

function actionCaption(action: CourseAction): string {
  if (action.type === 'counter') {
    return `计数 · ${action.targetReps ?? 0} 次`;
  }
  const label = action.type === 'rest' ? '休息' : '计时';
  return `${label} · ${action.targetDurationS ?? 0} 秒`;
}

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = useMemo(() => (id ? getCourseById(id) : null), [id]);

  if (!course) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>未找到课程</Text>
      </View>
    );
  }

  const estimatedCalories = Math.round(
    (course.caloriesPerMin ?? 8) * (course.durationS / 60)
  );

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
      <ScrollView style={styles.container}>
        <View style={styles.cover}>
          <Text style={styles.coverEmoji}>{course.coverImage}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.pillsRow}>
            <View style={[styles.pill, styles.pillCategory]}>
              <Text style={[styles.pillText, { color: colors.red }]}>
                {formatCourseCategory(course.category)}
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {formatDifficulty(course.difficulty)}
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>{course.equipment}</Text>
            </View>
          </View>

          <Text style={styles.title}>
            {course.title} · {Math.round(course.durationS / 60)} 分钟
          </Text>
          <Text style={styles.subtitle}>{course.subtitle}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(course.durationS / 60)}
                <Text style={styles.statUnit}>min</Text>
              </Text>
              <Text style={styles.statLabel}>预计时长</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>~{estimatedCalories}</Text>
              <Text style={styles.statLabel}>千卡</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{course.actions.length}</Text>
              <Text style={styles.statLabel}>动作</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{course.equipment}</Text>
              <Text style={styles.statLabel}>器械</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>课程简介</Text>
          <Text style={styles.description}>{course.description}</Text>

          <Text style={styles.sectionTitle}>动作列表</Text>
          <View style={styles.actionList}>
            {course.actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionItem,
                  action.type === 'rest' && styles.actionItemRest,
                ]}
                onPress={() => router.push(`/exercise/${action.id}`)}
                disabled={action.type === 'rest'}
              >
                <View style={styles.actionThumb}>
                  {action.type === 'rest' ? (
                    <Text style={styles.actionRestText}>休息</Text>
                  ) : (
                    <Text style={styles.actionEmoji}>{action.image}</Text>
                  )}
                </View>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionCaption}>{actionCaption(action)}</Text>
                </View>
                {action.type !== 'rest' && (
                  <Ionicons name="chevron-forward" size={16} color={colors.txt3} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Ionicons name="play" size={18} color={colors.bg} />
          <Text style={styles.startButtonText}>开始跟练</Text>
        </TouchableOpacity>
      </View>
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
    height: 200,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEmoji: { fontSize: 88 },
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
    backgroundColor: 'rgba(255,91,106,0.12)',
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
    color: colors.txt2,
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
  statUnit: {
    fontSize: 11,
    color: colors.txt3,
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
  description: {
    ...typography.label,
    color: colors.txt2,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  actionList: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionItemRest: {
    opacity: 0.7,
  },
  actionThumb: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 26 },
  actionRestText: {
    fontSize: 12,
    color: colors.txt3,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.txt,
  },
  actionCaption: {
    ...typography.label,
    color: colors.txt3,
    marginTop: 2,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  startButton: {
    backgroundColor: colors.acc,
    height: 54,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
  },
});
