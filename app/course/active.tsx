import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  AppState,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import Svg, { Circle } from 'react-native-svg';
import { useCourseStore } from '@/stores/courseStore';
import {
  pauseCourse,
  resumeCourse,
  completeCurrent,
  skipCurrent,
  incrementReps,
  decrementReps,
  stopCourse,
} from '@/services/courseEngine';
import { calcProgress } from '@/domain/course';
import { colors, typography, spacing, radius } from '@/theme';

const RING_SIZE = 190;
const RING_R = 82;
const RING_C = 2 * Math.PI * RING_R;

export default function CourseActiveScreen() {
  useKeepAwake();
  const router = useRouter();
  const session = useCourseStore();
  const finishedRecordId = useRef<string | null>(null);

  const { course, status, currentIndex, elapsedS, completedReps, totalElapsedS } =
    session;

  // 课程结算后（store 被 reset）跳转到完成页
  useEffect(() => {
    if (course) {
      finishedRecordId.current = session.recordId;
    } else if (finishedRecordId.current) {
      router.replace(`/course/finish?id=${finishedRecordId.current}`);
      finishedRecordId.current = null;
    }
  }, [course, session.recordId, router]);

  // 切后台自动暂停，回来需手动继续
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        pauseCourse();
      }
    });
    return () => sub.remove();
  }, []);

  if (!course) {
    return (
      <View style={styles.container}>
        <Text style={styles.caption}>暂无进行中的课程</Text>
      </View>
    );
  }

  const action = course.actions[currentIndex];
  const nextAction = course.actions[currentIndex + 1];
  const total = course.actions.length;

  const isCounter = action.type === 'counter';
  const targetS = action.targetDurationS ?? 0;
  const remainingS = Math.max(targetS - elapsedS, 0);

  let ringProgress = 0;
  if (isCounter) {
    ringProgress = action.targetReps ? completedReps / action.targetReps : 0;
  } else if (targetS > 0) {
    ringProgress = elapsedS / targetS;
  }
  ringProgress = Math.min(ringProgress, 1);

  const overallProgress = calcProgress(currentIndex, total);

  const handleEnd = () => {
    Alert.alert('结束跟练', '已完成的动作会被保存，确定结束吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '结束',
        style: 'destructive',
        onPress: () => void stopCourse(),
      },
    ]);
  };

  const paused = status === 'paused';

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={handleEnd} hitSlop={12}>
          <Ionicons name="close" size={18} color={colors.txt} />
        </TouchableOpacity>
        <Text style={styles.topLabel}>
          {course.title} · 第 {currentIndex + 1} / {total} 个动作
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.overallTrack}>
        <View style={[styles.overallFill, { width: `${overallProgress}%` }]} />
      </View>

      <View style={styles.imageCard}>
        <Text style={styles.imageEmoji}>{action.image ?? '⏸️'}</Text>
        <View style={styles.imageOverlay}>
          <Text style={styles.actionTitle}>{action.title}</Text>
          <Text style={styles.actionCaption} numberOfLines={1}>
            {action.instruction?.split('\n')[0] ?? ''}
          </Text>
        </View>
        {action.type === 'rest' && (
          <View style={styles.restTag}>
            <Text style={styles.restTagText}>休息</Text>
          </View>
        )}
      </View>

      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
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
            strokeDashoffset={RING_C * (1 - ringProgress)}
            rotation={-90}
            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          {isCounter ? (
            <>
              <Text style={styles.ringLabel}>
                计数 · 目标 {action.targetReps ?? 0} 次
              </Text>
              <Text style={styles.ringValue}>{completedReps}</Text>
              <Text style={styles.ringHint}>点击 +1 计数</Text>
            </>
          ) : (
            <>
              <Text style={styles.ringLabel}>
                {action.type === 'rest' ? '休息' : '计时'} · {targetS} 秒
              </Text>
              <Text style={styles.ringValue}>{remainingS}</Text>
              <Text style={styles.ringHint}>
                {paused ? '已暂停' : action.type === 'rest' ? '放松一下' : '保持节奏'}
              </Text>
            </>
          )}
        </View>
      </View>

      {isCounter && (
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={decrementReps}
            disabled={paused || completedReps <= 0}
          >
            <Text style={styles.counterButtonText}>−1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.counterButton, styles.counterButtonPrimary]}
            onPress={incrementReps}
            disabled={paused}
          >
            <Text style={[styles.counterButtonText, styles.counterButtonPrimaryText]}>
              +1
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => void skipCurrent()}
        >
          <Text style={styles.controlText}>
            {action.type === 'rest' ? '跳过休息' : '跳过动作'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => (paused ? resumeCourse() : pauseCourse())}
        >
          <Text style={styles.controlText}>{paused ? '继续' : '暂停'}</Text>
        </TouchableOpacity>
        {action.type !== 'rest' && (
          <TouchableOpacity
            style={[styles.controlButton, styles.controlPrimary]}
            onPress={() => void completeCurrent()}
          >
            <Text style={styles.controlPrimaryText}>完成本组 ✓</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.nextCaption}>
        {nextAction
          ? `下一动作：${nextAction.title} · ${
              nextAction.type === 'counter'
                ? `${nextAction.targetReps ?? 0} 次`
                : `${nextAction.targetDurationS ?? 0} 秒`
            }`
          : '这是最后一个动作'}
      </Text>

      {paused && (
        <TouchableOpacity style={styles.pauseOverlay} onPress={resumeCourse}>
          <Text style={styles.pauseOverlayText}>已暂停，点击继续</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  caption: {
    ...typography.label,
    color: colors.txt2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  topLabel: {
    ...typography.label,
    color: colors.txt2,
  },
  overallTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.card2,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  overallFill: {
    height: 4,
    backgroundColor: colors.acc,
  },
  imageCard: {
    marginTop: spacing.lg,
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageEmoji: { fontSize: 88 },
  imageOverlay: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
  },
  actionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.txt,
  },
  actionCaption: {
    ...typography.label,
    color: colors.txt2,
    marginTop: 2,
  },
  restTag: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  restTagText: {
    fontSize: 11,
    color: colors.txt2,
    fontWeight: '600',
  },
  ringWrap: {
    alignItems: 'center',
    marginTop: spacing.lg,
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
  ringLabel: {
    ...typography.label,
    color: colors.txt3,
  },
  ringValue: {
    ...typography.num,
    fontSize: 54,
    color: colors.txt,
    marginTop: 2,
  },
  ringHint: {
    ...typography.label,
    color: colors.acc,
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  counterButton: {
    width: 72,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonPrimary: {
    backgroundColor: colors.acc,
    borderColor: colors.acc,
    width: 110,
  },
  counterButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.txt2,
  },
  counterButtonPrimaryText: {
    color: colors.bg,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  controlButton: {
    flex: 1,
    height: 54,
    borderRadius: radius.full,
    backgroundColor: colors.card2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.txt2,
  },
  controlPrimary: {
    backgroundColor: colors.acc,
    borderColor: colors.acc,
    flex: 1.3,
  },
  controlPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.bg,
  },
  nextCaption: {
    ...typography.label,
    color: colors.txt3,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13,15,18,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseOverlayText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.txt,
  },
});
