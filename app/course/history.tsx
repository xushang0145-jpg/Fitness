import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { listRecords, type CourseRecordRow } from '@/services/courseRepo';
import { getCourseById } from '@/services/courseConfig';
import { calcCompletion } from '@/domain/course';
import {
  formatCourseDuration,
  formatDate,
  formatTime,
} from '@/domain/format';
import { colors, typography, spacing, radius } from '@/theme';

export default function CourseHistoryScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<CourseRecordRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      listRecords().then(setRecords);
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      {records.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧘</Text>
          <Text style={styles.emptyTitle}>还没有跟练记录</Text>
          <Text style={styles.emptyCaption}>完成一门课程后会在这里展示</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)/train')}
          >
            <Text style={styles.emptyButtonText}>去跟练</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {records.map((record) => {
            const course = getCourseById(record.course_id);
            const completion = calcCompletion(
              record.completed_count,
              record.total_count
            );
            return (
              <TouchableOpacity
                key={record.id}
                style={styles.card}
                onPress={() => router.push(`/course/history/${record.id}`)}
              >
                <View style={styles.cardEmoji}>
                  <Text style={styles.emoji}>{course?.coverImage ?? '🏋️'}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>
                    {course?.title ?? record.course_id}
                  </Text>
                  <Text style={styles.cardCaption}>
                    {formatDate(record.start_time)} {formatTime(record.start_time)}{' '}
                    · {formatCourseDuration(record.duration_s)} ·{' '}
                    {record.calories} 千卡
                  </Text>
                </View>
                <Text
                  style={[
                    styles.completion,
                    { color: completion === 100 ? colors.acc : colors.txt2 },
                  ]}
                >
                  {completion}%
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.txt,
    marginTop: spacing.lg,
  },
  emptyCaption: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.sm,
  },
  emptyButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.acc,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardEmoji: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.txt,
  },
  cardCaption: {
    ...typography.label,
    color: colors.txt3,
    marginTop: 2,
  },
  completion: {
    ...typography.num,
    fontSize: 16,
  },
});
