import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import {
  getRecordById,
  getStepsByRecordId,
  type CourseRecordRow,
  type CourseRecordStepRow,
} from '@/services/courseRepo';
import { getCourseById } from '@/services/courseConfig';
import { calcCompletion } from '@/domain/course';
import { formatCourseDuration } from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

const RING_SIZE = 200;
const RING_R = 88;
const RING_C = 2 * Math.PI * RING_R;

export default function CourseFinishScreen() {
  const router = useRouter();
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

  if (!id || !record) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>加载中...</Text>
      </View>
    );
  }

  const completion = calcCompletion(record.completed_count, record.total_count);

  const stepTitle = (step: CourseRecordStepRow): string => {
    const action = course?.actions.find((a) => a.id === step.action_id);
    return action?.title ?? step.action_id;
  };

  const stepCaption = (step: CourseRecordStepRow): string => {
    if (step.target_reps) {
      return step.status === 'done'
        ? `${step.actual_reps} 次`
        : `目标 ${step.target_reps} 次`;
    }
    const target = step.target_duration_s ?? 0;
    return step.status === 'done'
      ? `${step.actual_duration_s} 秒`
      : `目标 ${target} 秒`;
  };

  const statusLabel = (s: string) =>
    s === 'done' ? '完成' : s === 'skipped' ? '跳过' : '未完成';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerLabel}>训练完成</Text>

        <View style={styles.ringWrap}>
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          >
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke={colors.card2}
              strokeWidth={10}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke={colors.acc}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - completion / 100)}
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringValue}>
              {completion}
              <Text style={styles.ringUnit}>%</Text>
            </Text>
            <Text style={styles.ringLabel}>完成度</Text>
          </View>
        </View>

        <Text style={styles.courseTitle}>
          {course?.title ?? record.course_id} ·{' '}
          {course ? Math.round(course.durationS / 60) : '?'} 分钟
        </Text>
        <Text style={styles.courseCaption}>
          {record.total_count} 个动作 · 完成 {record.completed_count} 个
        </Text>

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
            <Text style={styles.statValue}>
              {record.completed_count}/{record.total_count}
            </Text>
            <Text style={styles.statLabel}>完成动作</Text>
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

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)/train')}
        >
          <Text style={styles.primaryButtonText}>返回课程列表</Text>
        </TouchableOpacity>
        {course && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace(`/course/${course.id}`)}
          >
            <Text style={styles.secondaryButtonText}>再练一次</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  loading: {
    ...typography.label,
    color: colors.txt2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.acc,
  },
  ringWrap: {
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: {
    ...typography.num,
    fontSize: 48,
    color: colors.txt,
  },
  ringUnit: {
    fontSize: 18,
  },
  ringLabel: {
    ...typography.label,
    color: colors.txt3,
    marginTop: 2,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.txt,
    marginTop: spacing.lg,
  },
  courseCaption: {
    ...typography.label,
    color: colors.txt2,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
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
    fontSize: 22,
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
    alignSelf: 'flex-start',
  },
  stepList: {
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
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
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.acc,
    height: 54,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.bg,
  },
  secondaryButton: {
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.txt,
  },
});
