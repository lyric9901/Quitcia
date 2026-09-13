import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cpu, Flame, Zap, Trophy, Lock, History, CheckCircle2 } from 'lucide-react-native';

import { matrixColors } from '../theme';
import {
  getStreakLastReset,
  getRelapseLogs,
  getAudioSessions,
  getUrgesLogs,
  elapsedSeconds,
  RelapseLog,
} from '../lib/localStore';
import { BottomNav, TabRoute } from '../components/BottomNav';

interface MatrixScreenProps {
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

export const MatrixScreen: React.FC<MatrixScreenProps> = ({ onNavigate, currentTab }) => {
  const colors = matrixColors;
  const [streakDays, setStreakDays] = useState(0);
  const [relapses, setRelapses] = useState<RelapseLog[]>([]);
  const [totalAudioCount, setTotalAudioCount] = useState(0);
  const [totalUrgesCount, setTotalUrgesCount] = useState(0);
  const [pillChoice, setPillChoice] = useState<'red' | 'blue'>('red');

  useEffect(() => {
    const resetTime = getStreakLastReset();
    const secs = elapsedSeconds(resetTime);
    const days = Math.floor(secs / 86400);
    setStreakDays(days);

    const logs = getRelapseLogs();
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRelapses(logs);

    setTotalAudioCount(getAudioSessions().length);
    setTotalUrgesCount(getUrgesLogs().length);
  }, []);

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
        <View style={styles.headerTitleRow}>
          <Cpu size={18} color="#34D399" />
          <Text style={styles.headerTitle}>The Matrix // Dopamine Hub</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Offline Safe</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* MORPHEUS CHOICE BANNER */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTag}>MORPHEUS PROTOCOL</Text>
            <Text style={styles.cardSubTag}>Reality Check</Text>
          </View>
          <Text style={styles.quoteText}>
            "You take the blue pill — the story ends, you wake up in your bed and believe whatever you want to believe. You take the red pill — you stay in Wonderland and see how deep the rabbit hole goes."
          </Text>
          <View style={styles.pillsRow}>
            <Pressable
              onPress={() => setPillChoice('red')}
              style={[
                styles.pillBtn,
                styles.redPillBtn,
                pillChoice === 'red' && styles.redPillSelected,
              ]}
            >
              <Text style={styles.pillBtnText}>🔴 Red Pill (Freedom)</Text>
            </Pressable>

            <Pressable
              onPress={() => setPillChoice('blue')}
              style={[
                styles.pillBtn,
                styles.bluePillBtn,
                pillChoice === 'blue' && styles.bluePillSelected,
              ]}
            >
              <Text style={styles.pillBtnText}>🔵 Blue Pill (Illusion)</Text>
            </Pressable>
          </View>
        </View>

        {/* STREAK & STATS MATRIX GRID */}
        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.gridCardHeader}>
              <Text style={styles.gridCardTag}>CLEAN STREAK</Text>
              <Flame size={16} color="#34D399" fill="#34D399" />
            </View>
            <Text style={styles.gridCountText}>{streakDays} <Text style={styles.gridUnitText}>Days</Text></Text>
            <Text style={styles.gridSubText}>100% Offline Tracked</Text>
          </View>

          <View style={[styles.card, styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.gridCardHeader}>
              <Text style={styles.gridCardTag}>AUDIO THERAPY</Text>
              <Zap size={16} color="#34D399" />
            </View>
            <Text style={styles.gridCountText}>{totalAudioCount} <Text style={styles.gridUnitText}>Played</Text></Text>
            <Text style={styles.gridSubText}>{totalUrgesCount} Urges Defeated</Text>
          </View>
        </View>

        {/* MATRIX MEME MILESTONE UNLOCK */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconTagRow}>
              <Trophy size={14} color="#34D399" />
              <Text style={styles.cardTag}>DOPAMINE LEVEL REWARD</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Level {currentMilestone}</Text>
            </View>
          </View>

          <View style={[styles.imageWrap, { borderColor: colors.border }]}>
            <Image source={{ uri: currentMeme }} style={styles.memeImage} resizeMode="cover" />
            <View style={styles.memeStatusTag}>
              <Text style={styles.memeStatusTagText}>
                Current Status: {streakDays >= 30 ? 'Neo Dodging Bullets' : `Day ${streakDays} Master`}
              </Text>
            </View>
          </View>

          {nextMilestone !== null && (
            <View style={styles.nextLockRow}>
              <Lock size={12} color="#059669" />
              <Text style={styles.nextLockText}>Next Matrix Meme unlocks at Day {nextMilestone}</Text>
            </View>
          )}
        </View>

        {/* RELAPSE LOG MATRIX RECOVERIES */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconTagRow}>
              <History size={14} color="#34D399" />
              <Text style={styles.cardTag}>RELAPSE MATRIX LOGS</Text>
            </View>
            <Text style={styles.relapseCountText}>{relapses.length} Total</Text>
          </View>

          {relapses.length === 0 ? (
            <View style={styles.emptyMatrix}>
              <View style={styles.checkIconBg}>
                <CheckCircle2 size={20} color="#34D399" />
              </View>
              <Text style={styles.emptyTitle}>Clean Matrix Record</Text>
              <Text style={styles.emptySub}>Zero relapses logged. Pure Neo discipline. 🟢</Text>
            </View>
          ) : (
            <View style={styles.relapseList}>
              {relapses.map((r, idx) => {
                const dateObj = new Date(r.timestamp);
                return (
                  <View key={idx} style={styles.relapseItem}>
                    <View style={styles.relapseItemHeader}>
                      <Text style={styles.relapseDate}>
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      <View style={styles.lostBadge}>
                        <Text style={styles.lostBadgeText}>Lost: {r.streakLost || 'N/A'}</Text>
                      </View>
                    </View>
                    <Text style={styles.relapseReason}>"{r.reason || 'No reason provided.'}"</Text>
                  </View>
                );
              })}
            </View>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: '#052E16',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  badgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTag: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardSubTag: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  quoteText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  redPillBtn: {
    backgroundColor: '#064E3B',
    borderColor: '#065F46',
  },
  redPillSelected: {
    backgroundColor: '#059669',
    borderColor: '#34D399',
  },
  bluePillBtn: {
    backgroundColor: '#0C4A6E',
    borderColor: '#075985',
  },
  bluePillSelected: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  pillBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gridCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCardTag: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  gridCountText: {
    color: '#34D399',
    fontSize: 26,
    fontWeight: '900',
  },
  gridUnitText: {
    fontSize: 12,
    color: '#059669',
  },
  gridSubText: {
    color: '#64748B',
    fontSize: 10,
  },
  levelBadge: {
    backgroundColor: '#052E16',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  levelBadgeText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  imageWrap: {
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    backgroundColor: '#052E16',
  },
  memeImage: {
    width: '100%',
    height: '100%',
  },
  memeStatusTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  memeStatusTagText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '800',
  },
  nextLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  nextLockText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  relapseCountText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyMatrix: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  checkIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#052E16',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    color: '#6EE7B7',
    fontSize: 13,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  relapseList: {
    gap: 8,
  },
  relapseItem: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#050D0A',
    borderWidth: 1,
    borderColor: '#064E3B',
    gap: 4,
  },
  relapseItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relapseDate: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700',
  },
  lostBadge: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
  },
  lostBadgeText: {
    color: '#FB7185',
    fontSize: 10,
    fontWeight: '800',
  },
  relapseReason: {
    color: '#CBD5E1',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
