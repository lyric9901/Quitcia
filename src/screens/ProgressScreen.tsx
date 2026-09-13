import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Flame, Trophy, Lock, Zap, History } from 'lucide-react-native';

import { useAppTheme } from '../theme';
import { getStreakLastReset, getRelapseLogs, getAudioSessions, elapsedSeconds, RelapseLog } from '../lib/localStore';
import { BottomNav, TabRoute } from '../components/BottomNav';

interface ProgressScreenProps {
  onNavigate: (route: string) => void;
  currentTab: TabRoute;
}

const MEME_REWARDS: Record<number, string> = {
  0: 'https://media.giphy.com/media/j1ywOobEJlqQo/giphy.gif',
  1: 'https://media.giphy.com/media/l36kU80xPf0ojG0Erg/giphy.gif',
  2: 'https://media.giphy.com/media/a5viI92PAF89q/giphy.gif',
  3: 'https://media.giphy.com/media/W6dHvprT7QnKKpzElw/giphy.gif',
  4: 'https://media.giphy.com/media/cb9aF9tD1eTX6oc9K1/giphy.gif',
  5: 'https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif',
  6: 'https://media.giphy.com/media/CAYVZA5NRb529kKQUc/giphy.gif',
  7: 'https://media.giphy.com/media/f31DK1KpGsyMU/giphy.gif',
  8: 'https://media.giphy.com/media/BWD3CtcaaTRRu/giphy.gif',
  9: 'https://media.giphy.com/media/I9ptvEQrG7332/giphy.gif',
  10: 'https://media.giphy.com/media/b1o4elYH8Tqjm/giphy.gif',
  15: 'https://media.giphy.com/media/wMqzS9qqe6X2E/giphy.gif',
  20: 'https://media.giphy.com/media/kwcUK7v8z2wX6/giphy.gif',
  30: 'https://media.giphy.com/media/3rVfBUa9f0RErtMZBH/giphy.gif',
};

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ onNavigate, currentTab }) => {
  const { colors } = useAppTheme();
  const [todaySessions, setTodaySessions] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [relapses, setRelapses] = useState<RelapseLog[]>([]);

  useEffect(() => {
    const resetTime = getStreakLastReset();
    const secs = elapsedSeconds(resetTime);
    const days = Math.floor(secs / 86400);
    setStreakDays(days);

    const logs = getRelapseLogs();
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRelapses(logs);

    const sessions = getAudioSessions();
    const todayStr = new Date().toDateString();
    const todayCount = sessions.filter((s) => new Date(s.timestamp).toDateString() === todayStr).length;
    setTodaySessions(todayCount);
  }, []);

  const getWeeklyReflection = (count: number) => {
    if (count === 0) return 'A new week is a fresh start. Take it one step at a time and show up for yourself.';
    if (count <= 2) return "You've taken the first steps. Consistency is built day by day, keep pushing forward.";
    if (count <= 4) return 'Great momentum! You are actively rewiring your habits. Keep your focus strong.';
    if (count <= 6) return 'Outstanding dedication. Your commitment to change is showing real results this week.';
    return 'A perfect week! You are mastering your urges and building lasting, positive change.';
  };

  const milestones = Object.keys(MEME_REWARDS).map(Number).sort((a, b) => a - b);
  let currentMeme = MEME_REWARDS[0];
  let currentMilestone = 0;
  let nextMilestone: number | null = null;

  for (let i = 0; i < milestones.length; i++) {
    if (streakDays >= milestones[i]) {
      currentMeme = MEME_REWARDS[milestones[i]];
      currentMilestone = milestones[i];
    } else if (nextMilestone === null) {
      nextMilestone = milestones[i];
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Flame size={20} color="#F97316" fill="#F97316" />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Progress</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.responsiveContainer}>
          {/* Progress Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center' }]}>
            <Text style={[styles.cardTag, { color: colors.mutedForeground }]}>TODAY'S FOCUS</Text>
            <Text style={[styles.bigCount, { color: colors.foreground }]}>{todaySessions}</Text>
            <Text style={[styles.focusLabel, { color: colors.foreground }]}>Audio Relief Sessions Completed</Text>
            <Text style={[styles.focusSub, { color: colors.mutedForeground }]}>Keep showing up. 🚀</Text>
          </View>

        {/* Meme Unlock Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconTagRow}>
              <Trophy size={14} color="#F59E0B" />
              <Text style={[styles.cardTag, { color: colors.mutedForeground }]}>STREAK REWARD</Text>
            </View>
            <View style={[styles.dayBadge, { backgroundColor: `${colors.accent}15` }]}>
              <Zap size={12} color={colors.accent} fill={colors.accent} />
              <Text style={[styles.dayBadgeText, { color: colors.accent }]}>Day {streakDays}</Text>
            </View>
          </View>

          <View style={[styles.imageWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Image source={{ uri: currentMeme }} style={styles.memeImage} resizeMode="cover" />
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>Level: {currentMilestone}</Text>
            </View>
          </View>

          {nextMilestone !== null && (
            <View style={styles.nextLockRow}>
              <Lock size={12} color={colors.mutedForeground} />
              <Text style={[styles.nextLockText, { color: colors.mutedForeground }]}>
                Next meme unlocks at Day {nextMilestone}
              </Text>
            </View>
          )}
        </View>

        {/* Reflection */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTag, { color: colors.mutedForeground, marginBottom: 8 }]}>WEEKLY REFLECTION</Text>
          <View style={styles.reflectionRow}>
            <View style={[styles.reflectionBar, { backgroundColor: colors.accent }]} />
            <Text style={[styles.reflectionText, { color: colors.foreground }]}>
              {getWeeklyReflection(streakDays)}
            </Text>
          </View>
        </View>

        {/* Relapse History */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconTagRow}>
              <History size={14} color={colors.mutedForeground} />
              <Text style={[styles.cardTag, { color: colors.mutedForeground }]}>RELAPSE HISTORY</Text>
            </View>
            <Text style={[styles.relapseCountText, { color: colors.mutedForeground }]}>
              {relapses.length} Total
            </Text>
          </View>

          {relapses.length === 0 ? (
            <View style={styles.emptyRelapse}>
              <Text style={[styles.emptyRelapseTitle, { color: colors.foreground }]}>No relapses logged yet.</Text>
              <Text style={[styles.emptyRelapseSub, { color: colors.mutedForeground }]}>Absolute Sigma Behavior. 🔥</Text>
            </View>
          ) : (
            <View style={styles.relapseList}>
              {relapses.map((r, idx) => {
                const dateObj = new Date(r.timestamp);
                return (
                  <View key={idx} style={[styles.relapseItem, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <View style={styles.relapseItemHeader}>
                      <Text style={[styles.relapseDate, { color: colors.mutedForeground }]}>
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <View style={styles.lostBadge}>
                        <Text style={styles.lostBadgeText}>Lost: {r.streakLost || 'Unknown'}</Text>
                      </View>
                    </View>
                    <Text style={[styles.relapseReason, { color: colors.foreground }]}>
                      "{r.reason || 'No reason provided.'}"
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      <BottomNav currentRoute={currentTab} onNavigate={(r) => onNavigate(r)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bigCount: {
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  focusLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  focusSub: {
    fontSize: 12,
    marginTop: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  imageWrap: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  memeImage: {
    width: '100%',
    height: '100%',
  },
  levelTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelTagText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
  nextLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  nextLockText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reflectionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reflectionBar: {
    width: 4,
    borderRadius: 2,
  },
  reflectionText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  relapseCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyRelapse: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRelapseTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyRelapseSub: {
    fontSize: 12,
    marginTop: 4,
  },
  relapseList: {
    gap: 8,
  },
  relapseItem: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  relapseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relapseDate: {
    fontSize: 10,
    fontWeight: '700',
  },
  lostBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  lostBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
  },
  relapseReason: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
