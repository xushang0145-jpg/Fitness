import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCourses } from '@/services/courseConfig';
import {
  formatCourseCategory,
  formatDifficulty,
} from '@/domain/format';
import type { CourseCategory } from '@/domain/course';
import { colors, typography, spacing, radius } from '@/theme';

const CATEGORY_FILTERS: { key: CourseCategory | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'fat_burn', label: '燃脂' },
  { key: 'shaping', label: '塑形' },
  { key: 'stretch', label: '拉伸' },
  { key: 'full_body', label: '全身' },
];

const CATEGORY_COLORS: Record<CourseCategory, string> = {
  fat_burn: colors.red,
  shaping: colors.blue,
  stretch: colors.acc,
  full_body: colors.orange,
};

export default function TrainScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<CourseCategory | 'all'>('all');

  const courses = useMemo(() => getCourses(), []);
  const filtered =
    category === 'all'
      ? courses
      : courses.filter((c) => c.category === category);
  const recommended = courses[0];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>跟练课程</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/course/history')}
        >
          <Ionicons name="time-outline" size={18} color={colors.txt} />
        </TouchableOpacity>
      </View>

      <View style={styles.chipsRow}>
        {CATEGORY_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, category === f.key && styles.chipActive]}
            onPress={() => setCategory(f.key)}
          >
            <Text
              style={[styles.chipText, category === f.key && styles.chipTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {recommended && (
        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => router.push(`/course/${recommended.id}`)}
        >
          <View style={styles.heroEmojiWrap}>
            <Text style={styles.heroEmoji}>{recommended.coverImage}</Text>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Text style={styles.heroTagText}>今日推荐</Text>
            </View>
            <Text style={styles.heroTitle}>
              {recommended.title} · {Math.round(recommended.durationS / 60)} 分钟
            </Text>
            <Text style={styles.heroCaption}>
              {recommended.actions.length} 个动作 ·{' '}
              {formatDifficulty(recommended.difficulty)} · {recommended.equipment}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {category === 'all' ? '全部课程' : formatCourseCategory(category)}
        </Text>
        <Text style={styles.sectionCount}>{filtered.length} 门课程</Text>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>该分类暂无课程</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => router.push(`/course/${course.id}`)}
            >
              <View
                style={[
                  styles.courseCover,
                  { backgroundColor: colors.card2 },
                ]}
              >
                <Text style={styles.courseEmoji}>{course.coverImage}</Text>
              </View>
              <View style={styles.courseBody}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.courseMeta}>
                  <View
                    style={[
                      styles.pill,
                      { backgroundColor: `${CATEGORY_COLORS[course.category]}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: CATEGORY_COLORS[course.category] },
                      ]}
                    >
                      {formatCourseCategory(course.category)}
                    </Text>
                  </View>
                  <Text style={styles.courseMinutes}>
                    {Math.round(course.durationS / 60)} 分钟
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingHorizontal: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  pageTitle: {
    ...typography.sectionTitle,
    fontSize: 24,
    color: colors.txt,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.acc,
    borderColor: colors.acc,
  },
  chipText: {
    fontSize: 13,
    color: colors.txt2,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.bg,
  },
  heroCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroEmojiWrap: {
    height: 110,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 56 },
  heroContent: {
    padding: spacing.lg,
  },
  heroTag: {
    backgroundColor: colors.acc,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bg,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.txt,
    marginTop: spacing.sm,
  },
  heroCaption: {
    ...typography.label,
    color: colors.txt3,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.txt,
  },
  sectionCount: {
    ...typography.label,
    color: colors.txt3,
  },
  empty: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.label,
    color: colors.txt3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  courseCard: {
    width: '47.5%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  courseCover: {
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseEmoji: { fontSize: 44 },
  courseBody: {
    padding: spacing.md,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.txt,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  courseMinutes: {
    fontSize: 10,
    color: colors.txt3,
  },
});
