import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  getRecordById,
  getStepsByRecordId,
  type CourseRecordRow,
  type CourseRecordStepRow,
} from '@/services/courseRepo';
import { getCourseById } from '@/services/courseConfig';
import { calcCompletion } from '@/domain/course';
import {
  formatCourseDuration,
  formatDate,
  formatTime,
} from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function CourseHistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<CourseRecordRow | null>(null);
  const [steps, setSteps] = useState<CourseRecordStepRow[]>([]);

  useEffect(() => {
    if (!id) return;
    getRecordById(id).then(setRecord);
    getStepsByRecordId(id).then(setSteps);
  }, [id]);

  const course = useMemo(
    () => (record ? getCourseById(record.course_id) : null),
    [record]
  );

  if (!record) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>加载中...</Text>
      </View>
    );
  }

  const completion = calcCompletion(record.completed_count, record.total_count);

  const statusLabel = (s: string) =>
    s === 'done' ? '完成' : s === 'skipped' ? '跳过' : '未完成';

  const stepTitle = (step: CourseRecordStepRow): string =>
    course?.actions.find((a) => a.id === step.action_id)?.title ?? step.action_id;

  const stepCaption = (step: CourseRecordStepRow): string => {
    if (step.target_reps) {
      return step.status === 'done'
        ? `完成 ${step.actual_reps} / ${step.target_reps} 次`
        : `目标 ${step.target_reps} 次`;
    }
    const target = step.target_duration_s ?? 0;
    return step.status === 'done'
      ? `完成 ${step.actual_duration_s} / ${target} 秒`
      : `目标 ${target} 秒`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{course?.coverImage ?? '🏋️'}</Text>
        <Text style={styles.title}>{course?.title ?? record.course_id}</Text>
        <Text style={styles.caption}>
          {formatDate(record.start_time)} {formatTime(record.start_time)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCourseDuration(record.duration_s)}
          </Text>
          <Text style={styles.statLabel}>训练时长</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{record.calories}</Text>
          <Text style={styles.statLabel}>消耗千卡</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{completion}%</Text>
          <Text style={styles.statLabel}>完成度</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>动作明细</Text>
      <View style={styles.stepList}>
        {steps.map((step) => (
          <View
            key={step.order_index}
            style={[styles.stepItem, step.status !== 'done' && styles.stepItemDim]}
          >
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    step.status === 'done' ? colors.acc : colors.txt3,
                },
              ]}
            />
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{stepTitle(step)}</Text>
              <Text style={styles.stepCaption}>{stepCaption(step)}</Text>
            </View>
            <Text
              style={[
                styles.stepStatus,
                { color: step.status === 'done' ? colors.acc : colors.txt3 },
              ]}
            >
              {statusLabel(step.status)}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  loading: {
    ...typography.label,
    color: colors.txt2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emoji: { fontSize: 64 },
  title: {
    ...typography.sectionTitle,
    fontSize: 22,
    color: colors.txt,
    marginTop: spacing.md,
  },
  caption: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stepItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepItemDim: {
    opacity: 0.7,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.txt,
  },
  stepCaption: {
    ...typography.label,
    fontSize: 11,
    color: colors.txt3,
  },
  stepStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
});
