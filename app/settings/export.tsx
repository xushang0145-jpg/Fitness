import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';
import { exportGpx, exportCsv } from '@/services/exportService';
import { colors, typography, spacing, radius } from '@/theme';

type ExportFormat = 'gpx' | 'csv';

export default function DataExportScreen() {
  const [generating, setGenerating] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (generating) return;
    setGenerating(format);

    let fileUri: string | null = null;
    try {
      fileUri = format === 'gpx' ? await exportGpx() : await exportCsv();

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('导出失败', '暂无可用的分享目标');
        return;
      }

      // 用户取消分享时系统面板正常关闭，不视为错误
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'gpx' ? 'application/gpx+xml' : 'text/csv',
        UTI: format === 'gpx' ? 'com.topografix.gpx' : 'public.comma-separated-values-text',
        dialogTitle: format === 'gpx' ? '导出 GPX 轨迹' : '导出 CSV 汇总',
      });
    } catch (error) {
      Alert.alert('导出失败', error instanceof Error ? error.message : '文件生成失败，请重试');
    } finally {
      if (fileUri) {
        try {
          new File(fileUri).delete();
        } catch {
          // 临时文件清理失败可忽略，系统会自行回收 cache
        }
      }
      setGenerating(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          你的运动记录仅存储在本机。导出后可将文件保存到「文件」App，或通过微信 / 邮件发送给第三方应用。
        </Text>
      </View>

      <View style={styles.exportCard}>
        <View style={styles.cardBody}>
          <Text style={styles.exportTitle}>导出 GPX 轨迹</Text>
          <Text style={styles.exportDesc}>
            包含全部运动的完整 GPS 轨迹点，可导入 Keep、Strava、高德等应用。
          </Text>
          <Text style={styles.exportTag}>.gpx · 标准格式</Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          disabled={generating !== null}
          onPress={() => handleExport('gpx')}
        >
          {generating === 'gpx' ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.exportButtonText}>导出</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.exportCard}>
        <View style={styles.cardBody}>
          <Text style={styles.exportTitle}>导出 CSV 汇总</Text>
          <Text style={styles.exportDesc}>
            按日期倒序的每次运动统计，可用 Excel / Numbers 打开分析。
          </Text>
          <Text style={styles.exportTag}>.csv · UTF-8 BOM</Text>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          disabled={generating !== null}
          onPress={() => handleExport('csv')}
        >
          {generating === 'csv' ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.exportButtonText}>导出</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.footerNote}>
        数据不会上传任何服务器 · 文件生成后调用系统分享面板
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accSoft,
    borderWidth: 1,
    borderColor: 'rgba(200,243,29,0.25)',
  },
  infoText: {
    ...typography.label,
    color: colors.txt,
    fontSize: 13,
    lineHeight: 20,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  cardBody: {
    flex: 1,
    marginRight: spacing.md,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.txt,
  },
  exportDesc: {
    ...typography.label,
    color: colors.txt2,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  exportTag: {
    ...typography.label,
    fontSize: 11,
    color: colors.txt2,
    backgroundColor: colors.card2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 7,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  exportButton: {
    height: 34,
    minWidth: 66,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.acc,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.bg,
  },
  footerNote: {
    ...typography.label,
    fontSize: 11,
    color: colors.txt3,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
