import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { ThemedAlertModal } from '../components/ThemedAlertModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Trophy,
  Flame,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle,
  AlertTriangle,
  X,
  RotateCcw,
  Sun,
  Moon,
  Info,
  ShieldAlert,
  KeyRound,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  Gem,
  Sparkles,
} from 'lucide-react-native';

import { useAppTheme } from '../theme';
import {
  getUserProfile,
  getStreakLastReset,
  getRelapseLogs,
  getUrgesLogs,
  clearAllLocalData,
  getUserGems,
  addGem,
  RelapseLog,
  elapsedSeconds,
} from '../lib/localStore';
import { useRewardedInterstitial } from '../lib/admob';
import { BottomNav, TabRoute } from '../components/BottomNav';

interface ProfileScreenProps {
  onNavigate: (route: string) => void;
  currentTab: TabRoute;
}

const toDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface DayDetails {
  date: Date;
  dateKey: string;
  relapses: RelapseLog[];
  urgeCount: number;
  isClean: boolean;
  isRelapsed: boolean;
  isFuture: boolean;
  isUnstarted: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onNavigate, currentTab }) => {
  const { colors, mode, setMode } = useAppTheme();
  const [userName, setUserName] = useState<string>('User');
  const [maxStreakDays, setMaxStreakDays] = useState<number>(0);
  const [currentStreakDays, setCurrentStreakDays] = useState<number>(0);
  const [memberSince, setMemberSince] = useState<string>('');

  const [relapseMap, setRelapseMap] = useState<Map<string, RelapseLog[]>>(new Map());
  const [urgeCounts, setUrgeCounts] = useState<Map<string, number>>(new Map());
  const [trackingStartDate, setTrackingStartDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<DayDetails | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date());

  // Settings & 3-Step Reset Modal
  const [showSettings, setShowSettings] = useState(false);
  const [showResetVerifyModal, setShowResetVerifyModal] = useState(false);
  const [resetVerifyStep, setResetVerifyStep] = useState<1 | 2 | 3>(1);
  const [resetInputText, setResetInputText] = useState('');
  const [comingSoonTheme, setComingSoonTheme] = useState<string | null>(null);

  // AdMob Rewarded Interstitial for Gems
  const [gems, setGems] = useState<number>(() => getUserGems());
  const [isAdWatching, setIsAdWatching] = useState(false);
  const [showSimulatedAd, setShowSimulatedAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [showRewardSuccessModal, setShowRewardSuccessModal] = useState(false);
  const { showAd, isNativeAvailable } = useRewardedInterstitial();

  const handleWatchAdForGem = () => {
    if (isNativeAvailable) {
      setIsAdWatching(true);
      showAd(() => {
        const nextGems = addGem(1);
        setGems(nextGems);
        setIsAdWatching(false);
        setShowRewardSuccessModal(true);
      });
      setTimeout(() => setIsAdWatching(false), 3000);
    } else {
      // In Expo Go or preview, play the simulated full-screen sponsored video ad
      setAdCountdown(5);
      setShowSimulatedAd(true);
    }
  };

  useEffect(() => {
    if (!showSimulatedAd) return;
    if (adCountdown <= 0) return;
    const timer = setTimeout(() => {
      setAdCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showSimulatedAd, adCountdown]);

  const handleClaimSimulatedReward = () => {
    setShowSimulatedAd(false);
    const nextGems = addGem(1);
    setGems(nextGems);
    setShowRewardSuccessModal(true);
  };

  useEffect(() => {
    loadLocalProfile();
  }, []);

  const loadLocalProfile = () => {
    const profile = getUserProfile();
    let creationDate = new Date();
    if (profile?.name) {
      setUserName(profile.name);
      if (profile.createdAt) {
        const parsed = new Date(profile.createdAt);
        if (!isNaN(parsed.getTime())) creationDate = parsed;
      }
      const formattedDate = creationDate.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      setMemberSince(`Member since ${formattedDate}`);
    } else {
      setMemberSince('Local User');
    }

    computeStreakStats(creationDate);
  };

  const computeStreakStats = (fallbackCreationDate: Date) => {
    try {
      const lastResetTs = getStreakLastReset();
      const secs = elapsedSeconds(lastResetTs);
      const activeDays = Math.floor(secs / 86400);
      setCurrentStreakDays(activeDays);

      let earliestTs = lastResetTs;
      const profile = getUserProfile();
      if (profile?.createdAt) {
        const pTs = new Date(profile.createdAt).getTime();
        if (!isNaN(pTs) && pTs < earliestTs) earliestTs = pTs;
      } else if (fallbackCreationDate) {
        const fTs = fallbackCreationDate.getTime();
        if (!isNaN(fTs) && fTs < earliestTs) earliestTs = fTs;
      }

      const relLogs = getRelapseLogs();
      const rMap = new Map<string, RelapseLog[]>();
      let maxDays = activeDays;

      relLogs.forEach((log) => {
        if (log.timestamp) {
          const d = new Date(log.timestamp);
          if (!isNaN(d.getTime())) {
            if (d.getTime() < earliestTs) earliestTs = d.getTime();
            const key = toDateKey(d);
            const existing = rMap.get(key) || [];
            existing.push(log);
            rMap.set(key, existing);

            if (log.streakLost) {
              const match = log.streakLost.match(/(\d+)d/);
              if (match) {
                const days = parseInt(match[1], 10);
                if (days > maxDays) maxDays = days;
              }
            }
          }
        }
      });

      const urgeLogs = getUrgesLogs();
      const uCounts = new Map<string, number>();

      urgeLogs.forEach((uTs) => {
        const d = new Date(uTs);
        if (!isNaN(d.getTime())) {
          if (d.getTime() < earliestTs) earliestTs = d.getTime();
          const key = toDateKey(d);
          uCounts.set(key, (uCounts.get(key) || 0) + 1);
        }
      });

      const eDate = new Date(earliestTs);
      const startTracking = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate());

      setRelapseMap(rMap);
      setUrgeCounts(uCounts);
      setTrackingStartDate(startTracking);
      setMaxStreakDays(maxDays);
    } catch (e) {
      console.error('Error computing streak stats', e);
    }
  };

  // Launch 3-Step Verification
  const startResetVerification = () => {
    setShowSettings(false);
    setResetVerifyStep(1);
    setResetInputText('');
    setShowResetVerifyModal(true);
  };

  const closeResetVerification = () => {
    setShowResetVerifyModal(false);
    setResetVerifyStep(1);
    setResetInputText('');
  };

  const executeFinalReset = () => {
    clearAllLocalData();
    closeResetVerification();
    onNavigate('onboarding');
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentCalendarDate(new Date());
  };

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayKey = toDateKey(todayNormalized);

  const monthName = currentCalendarDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  let monthCleanCount = 0;
  let monthRelapseCount = 0;
  let monthUrgeCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    if (dayDate <= todayNormalized && dayDate >= trackingStartDate) {
      const key = toDateKey(dayDate);
      if (relapseMap.has(key)) {
        monthRelapseCount++;
      } else {
        monthCleanCount++;
      }
      if (urgeCounts.has(key)) {
        monthUrgeCount += urgeCounts.get(key) || 0;
      }
    }
  }

  // Weeks matrix: 7 equal items per row to guarantee zero overflow on mobile and tablet
  const weeksGrid = useMemo(() => {
    const cells: (DayDetails | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dateKey = toDateKey(dateObj);
      const relapses = relapseMap.get(dateKey) || [];
      const urgeCount = urgeCounts.get(dateKey) || 0;
      const isRelapsed = relapses.length > 0;
      const isFuture = dateObj > todayNormalized;
      const isUnstarted = dateObj < trackingStartDate;
      const isClean = !isFuture && !isUnstarted && !isRelapsed;

      cells.push({
        date: dateObj,
        dateKey,
        relapses,
        urgeCount,
        isClean,
        isRelapsed,
        isFuture,
        isUnstarted,
      });
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: (DayDetails | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [year, month, firstDayOfMonth, daysInMonth, relapseMap, urgeCounts, trackingStartDate, todayNormalized]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Profile</Text>
        <Pressable onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
          <Settings size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Responsive Tablet/Mobile Container */}
        <View style={styles.responsiveContainer}>
          {/* User Card */}
          <View style={[styles.card, styles.centerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.muted }]}>
              <User size={36} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.userNameText, { color: colors.foreground }]} numberOfLines={1} ellipsizeMode="tail">
              {userName}
            </Text>
            <Text style={[styles.offlineText, { color: colors.mutedForeground }]}>Offline Local Profile</Text>
            {memberSince ? (
              <View style={[styles.memberBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.memberBadgeText, { color: colors.mutedForeground }]}>{memberSince}</Text>
              </View>
            ) : null}
          </View>

          {/* Max Streak Card */}
          <View style={[styles.card, styles.rowCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.maxStreakLeft}>
              <View style={styles.trophyBg}>
                <Trophy size={22} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.maxStreakLabel, { color: colors.mutedForeground }]}>LONGEST CLEAN STREAK</Text>
                <Text style={[styles.maxStreakValue, { color: colors.foreground }]}>
                  {maxStreakDays}{' '}
                  <Text style={[styles.daysUnit, { color: colors.mutedForeground }]}>
                    {maxStreakDays === 1 ? 'Day' : 'Days'}
                  </Text>
                </Text>
              </View>
            </View>

            <View style={styles.nowBadge}>
              <Flame size={14} color="#F97316" fill="#F97316" />
              <Text style={styles.nowBadgeText}>Now: {currentStreakDays}d</Text>
            </View>
          </View>

          {/* HEAT MAP CALENDAR */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarHeaderRow}>
              <View style={styles.calendarTitleRow}>
                <CalendarIcon size={18} color={colors.accent} />
                <Text style={[styles.calendarTitle, { color: colors.foreground }]}>Your Heat Map</Text>
              </View>

              <View style={[styles.monthNavRow, { backgroundColor: colors.muted }]}>
                <Pressable onPress={handlePrevMonth} style={styles.navArrow}>
                  <ChevronLeft size={16} color={colors.mutedForeground} />
                </Pressable>
                <Pressable onPress={handleTodayMonth}>
                  <Text style={[styles.monthNameText, { color: colors.foreground }]}>{monthName}</Text>
                </Pressable>
                <Pressable onPress={handleNextMonth} style={styles.navArrow}>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>

            {/* Month Stats Summary Badge */}
            <View style={[styles.summaryBadgeRow, { backgroundColor: colors.muted }]}>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>{monthCleanCount} Clean</Text>
              <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '800' }}>{monthUrgeCount} Urges</Text>
              <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '800' }}>{monthRelapseCount} Relapses</Text>
            </View>

            {/* Days Header */}
            <View style={styles.weekHeadersRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <Text key={i} style={[styles.weekHeaderCell, { color: colors.mutedForeground }]}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Days Grid: Equal 7 Columns Per Row (Zero Wrap/Overflow) */}
            <View style={styles.calendarBody}>
              {weeksGrid.map((week, wIdx) => (
                <View key={`week-${wIdx}`} style={styles.weekRow}>
                  {week.map((day, dIdx) => {
                    if (!day) {
                      return <View key={`empty-${wIdx}-${dIdx}`} style={styles.emptyDayCell} />;
                    }
                    const dayNum = day.date.getDate();
                    const isToday = day.dateKey === todayKey;
                    const hasUrgeOvercome = day.isClean && day.urgeCount > 0;

                    let bgStyle = { backgroundColor: `${colors.muted}40` };
                    let textColor = colors.mutedForeground;

                    if (day.isFuture || day.isUnstarted) {
                      bgStyle = { backgroundColor: `${colors.muted}20` };
                    } else if (day.isRelapsed) {
                      bgStyle = { backgroundColor: '#EF4444' };
                      textColor = 'white';
                    } else if (day.isClean) {
                      bgStyle = { backgroundColor: '#10B981' };
                      textColor = 'white';
                    }

                    return (
                      <Pressable
                        key={`day-${day.dateKey}`}
                        onPress={() => setSelectedDay(day)}
                        style={[
                          styles.dayCell,
                          bgStyle,
                          isToday && { borderWidth: 2, borderColor: colors.accent },
                        ]}
                      >
                        <Text style={[styles.dayCellText, { color: textColor }]}>{dayNum}</Text>
                        {hasUrgeOvercome && <View style={styles.amberDot} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={[styles.legendRow, { borderColor: colors.border }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Clean Day</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' },
                  ]}
                >
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FBBF24' }} />
                </View>
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Urge Overcome</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Relapsed</Text>
              </View>
            </View>
          </View>

          {/* REWARDED INTERSTITIAL AD UNIT (AT VERY BOTTOM) */}
          <View style={[styles.rewardAdCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rewardHeaderRow}>
              <View style={styles.rewardTitleRow}>
                <View style={[styles.gemIconWrap, { backgroundColor: 'rgba(13, 148, 136, 0.15)' }]}>
                  <Gem size={22} color="#0D9488" strokeWidth={2.4} />
                </View>
                <View>
                  <Text style={styles.rewardCardPill}>REWARDS & SUPPORT</Text>
                  <Text style={[styles.rewardCardTitle, { color: colors.foreground }]}>Earn Free Gems</Text>
                </View>
              </View>
              <View style={[styles.gemCounterBadge, { backgroundColor: colors.muted }]}>
                <Gem size={14} color="#0D9488" />
                <Text style={[styles.gemCounterNumber, { color: colors.foreground }]}>{gems}</Text>
                <Text style={[styles.gemCounterLabel, { color: colors.mutedForeground }]}>Gems</Text>
              </View>
            </View>

            <Text style={[styles.rewardDescription, { color: colors.mutedForeground }]}>
              Support Quitcia by watching a short sponsored ad. Complete video to receive +1 Gem.
            </Text>

            <Pressable
              onPress={handleWatchAdForGem}
              disabled={isAdWatching}
              style={[
                styles.rewardBtn,
                { backgroundColor: '#0D9488' },
                isAdWatching && { opacity: 0.6 },
              ]}
            >
              <Gem size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.rewardBtnText}>
                {isAdWatching ? 'Loading Ad...' : 'Earn Gem by Watching Ads'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <BottomNav currentRoute={currentTab} onNavigate={(r) => onNavigate(r)} />

      {/* FULL-SCREEN SPONSORED AD SIMULATION MODAL (EXPO GO / DEV) */}
      <Modal visible={showSimulatedAd} transparent={false} animationType="slide">
        <SafeAreaView style={styles.adModalContainer} edges={['top', 'bottom']}>
          <View style={styles.adTopBar}>
            <View style={styles.adPillBadge}>
              <Text style={styles.adPillBadgeText}>SPONSORED AD</Text>
            </View>
            <View style={styles.adTimerWrap}>
              {adCountdown > 0 ? (
                <View style={styles.adCountdownPill}>
                  <Text style={styles.adCountdownPillText}>Reward in {adCountdown}s</Text>
                </View>
              ) : (
                <Pressable onPress={() => setShowSimulatedAd(false)} style={styles.adCloseIconBtn}>
                  <X size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={styles.adVideoFrame}>
            <View style={styles.adMediaCard}>
              <View style={styles.adMediaPlayCircle}>
                <Gem size={42} color="#0D9488" strokeWidth={2.5} />
              </View>
              <Text style={styles.adSponsorBrand}>Quitcia Partner Network</Text>
              <Text style={styles.adSponsorMessage}>
                "Overcoming an urge builds real strength. Stay disciplined today."
              </Text>
              <View style={styles.adProgressBarTrack}>
                <View
                  style={[
                    styles.adProgressBarFill,
                    { width: `${((5 - adCountdown) / 5) * 100}%` },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.adFooter}>
            {adCountdown > 0 ? (
              <View style={styles.adWaitingRow}>
                <Gem size={18} color="#0D9488" strokeWidth={2.2} />
                <Text style={styles.adWaitingText}>Watch completely to receive +1 Gem</Text>
              </View>
            ) : (
              <Pressable onPress={handleClaimSimulatedReward} style={styles.adClaimBtn}>
                <Gem size={22} color="#FFFFFF" strokeWidth={2.4} />
                <Text style={styles.adClaimBtnText}>Claim +1 Gem Reward</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* GEM REWARD GRANTED SUCCESS MODAL */}
      <Modal visible={showRewardSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, styles.rewardSuccessDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rewardSuccessGlow}>
              <Gem size={48} color="#0D9488" strokeWidth={2.5} />
            </View>
            <Text style={[styles.rewardSuccessTitle, { color: colors.foreground }]}>Reward Granted!</Text>
            <Text style={[styles.rewardSuccessSubtitle, { color: colors.mutedForeground }]}>
              +1 Gem added to your local profile for watching the sponsored ad.
            </Text>

            <View style={[styles.rewardSuccessBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Gem size={18} color="#0D9488" strokeWidth={2.3} />
              <Text style={[styles.rewardSuccessGemsCount, { color: colors.foreground }]}>{gems}</Text>
              <Text style={[styles.rewardSuccessGemsLabel, { color: colors.mutedForeground }]}>Total Gems</Text>
            </View>

            <Pressable
              onPress={() => setShowRewardSuccessModal(false)}
              style={[styles.rewardSuccessCloseBtn, { backgroundColor: '#0D9488' }]}
            >
              <Text style={styles.rewardSuccessCloseBtnText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* DAY DETAIL MODAL */}
      <Modal visible={Boolean(selectedDay)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => setSelectedDay(null)} style={styles.modalCloseBtn}>
              <X size={18} color={colors.mutedForeground} />
            </Pressable>

            {selectedDay && (
              <>
                <View style={styles.modalHeaderRow}>
                  <CalendarIcon size={20} color={colors.accent} />
                  <Text style={[styles.modalDateTitle, { color: colors.foreground }]}>
                    {selectedDay.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                {selectedDay.isFuture ? (
                  <View style={[styles.detailBox, { backgroundColor: colors.muted }]}>
                    <Info size={16} color={colors.mutedForeground} />
                    <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                      Future day. Stay strong when it arrives!
                    </Text>
                  </View>
                ) : selectedDay.isUnstarted ? (
                  <View style={[styles.detailBox, { backgroundColor: colors.muted }]}>
                    <Info size={16} color={colors.mutedForeground} />
                    <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
                      Prior to your tracking start date.
                    </Text>
                  </View>
                ) : selectedDay.isRelapsed ? (
                  <View style={styles.relapseDetailStack}>
                    <View style={styles.relapseAlertBox}>
                      <AlertTriangle size={16} color="#EF4444" />
                      <Text style={styles.relapseAlertText}>Relapse / Streak Reset Recorded</Text>
                    </View>
                    {selectedDay.relapses.map((r, i) => (
                      <View key={i} style={[styles.relapseDetailItem, { backgroundColor: colors.muted }]}>
                        <Text style={styles.relapseDetailReason}>"{r.reason || 'No reason logged'}"</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.cleanDetailStack}>
                    <View style={styles.cleanBadgeBox}>
                      <CheckCircle size={16} color="#10B981" />
                      <Text style={styles.cleanBadgeText}>Clean Day - Discipline Maintained 🔥</Text>
                    </View>
                    {selectedDay.urgeCount > 0 && (
                      <View style={styles.urgeBadgeBox}>
                        <Zap size={16} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.urgeBadgeText}>
                          {selectedDay.urgeCount} Cravings Surfed & Overcome ⚡
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: colors.foreground }]}>Settings</Text>
              <Pressable onPress={() => setShowSettings(false)}>
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Theme Toggle */}
            <View style={[styles.themeRow, { backgroundColor: colors.muted }]}>
              <View style={styles.themeRowLeft}>
                {mode === 'dark' ? <Moon size={20} color={colors.accent} /> : <Sun size={20} color={colors.accent} />}
                <Text style={[styles.themeLabel, { color: colors.foreground }]}>
                  {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </Text>
              </View>

              <Pressable
                onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                style={[styles.toggleBtn, { backgroundColor: mode === 'dark' ? colors.accent : '#CBD5E1' }]}
              >
                <View style={[styles.toggleCircle, mode === 'dark' && { alignSelf: 'flex-end' }]} />
              </Pressable>
            </View>

            {/* Theme Presets (Bold Active, Minimal & Matrix Soon) */}
            <View style={[styles.themePresetBox, { backgroundColor: colors.muted }]}>
              <Text style={[styles.themePresetLabel, { color: colors.mutedForeground }]}>THEME PRESET</Text>
              <View style={styles.themePresetRow}>
                <View style={[styles.themeChip, { borderColor: '#0D9488', backgroundColor: colors.card, borderWidth: 1.5 }]}>
                  <Text style={[styles.themeChipText, { color: '#0D9488', fontWeight: '900' }]}>Bold</Text>
                </View>
                <Pressable
                  onPress={() => setComingSoonTheme('Minimal')}
                  style={[styles.themeChip, { borderColor: colors.border, backgroundColor: colors.card, opacity: 0.65 }]}
                >
                  <Text style={[styles.themeChipText, { color: colors.mutedForeground }]}>Minimal</Text>
                  <View style={styles.themeSoonPill}>
                    <Text style={styles.themeSoonPillText}>SOON</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => setComingSoonTheme('Matrix')}
                  style={[styles.themeChip, { borderColor: colors.border, backgroundColor: colors.card, opacity: 0.65 }]}
                >
                  <Text style={[styles.themeChipText, { color: colors.mutedForeground }]}>Matrix</Text>
                  <View style={styles.themeSoonPill}>
                    <Text style={styles.themeSoonPillText}>SOON</Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Reset Local Data (Launches 3-Step Verification) */}
            <Pressable onPress={startResetVerification} style={[styles.resetLocalBtn, { backgroundColor: colors.muted }]}>
              <RotateCcw size={16} color={colors.mutedForeground} />
              <Text style={[styles.resetLocalBtnText, { color: colors.foreground }]}>Reset Local Data</Text>
            </Pressable>

            {/* Delete Account (Also Secured with 3-Step Verification) */}
            <Pressable onPress={startResetVerification} style={styles.deleteAccountBtn}>
              <AlertTriangle size={18} color="#EF4444" />
              <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 🛡️ 3-STEP VERIFICATION MODAL FOR RESET LOCAL DATA */}
      <Modal visible={showResetVerifyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Top Step Progress Bar Indicator */}
            <View style={styles.stepProgressRow}>
              <View
                style={[
                  styles.stepBadge,
                  resetVerifyStep >= 1 ? { backgroundColor: colors.accent } : { backgroundColor: colors.muted },
                ]}
              >
                {resetVerifyStep > 1 ? (
                  <Check size={12} color="white" strokeWidth={3} />
                ) : (
                  <Text style={styles.stepBadgeText}>1</Text>
                )}
              </View>
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: resetVerifyStep >= 2 ? colors.accent : `${colors.mutedForeground}40` },
                ]}
              />
              <View
                style={[
                  styles.stepBadge,
                  resetVerifyStep >= 2 ? { backgroundColor: colors.accent } : { backgroundColor: colors.muted },
                ]}
              >
                {resetVerifyStep > 2 ? (
                  <Check size={12} color="white" strokeWidth={3} />
                ) : (
                  <Text style={styles.stepBadgeText}>2</Text>
                )}
              </View>
              <View
                style={[
                  styles.stepLine,
                  { backgroundColor: resetVerifyStep === 3 ? '#EF4444' : `${colors.mutedForeground}40` },
                ]}
              />
              <View
                style={[
                  styles.stepBadge,
                  resetVerifyStep === 3 ? { backgroundColor: '#EF4444' } : { backgroundColor: colors.muted },
                ]}
              >
                <Text style={styles.stepBadgeText}>3</Text>
              </View>
            </View>

            {/* STEP 1: WARNING & CONSEQUENCES */}
            {resetVerifyStep === 1 && (
              <View style={styles.stepContentWrap}>
                <View style={styles.stepHeaderCenter}>
                  <View style={[styles.stepIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <ShieldAlert size={28} color="#F59E0B" strokeWidth={2.3} />
                  </View>
                  <Text style={styles.stepPillHeader}>STEP 1 OF 3</Text>
                  <Text style={[styles.stepMainTitle, { color: colors.foreground }]}>Erase Local Data?</Text>
                </View>

                <View style={[styles.warningBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Text style={[styles.warningIntroText, { color: colors.foreground }]}>
                    This action will permanently wipe:
                  </Text>
                  <View style={styles.bulletList}>
                    <Text style={[styles.bulletItem, { color: colors.mutedForeground }]}>
                      • All Clean Streak Progress (Current & Longest)
                    </Text>
                    <Text style={[styles.bulletItem, { color: colors.mutedForeground }]}>
                      • Complete Heat Map Calendar & Clean History
                    </Text>
                    <Text style={[styles.bulletItem, { color: colors.mutedForeground }]}>
                      • Urge Logs, Panic Sessions & Audio History
                    </Text>
                    <Text style={[styles.bulletItem, { color: colors.mutedForeground }]}>
                      • Daily Check-ins, Tasks & Badges
                    </Text>
                  </View>
                </View>

                <View style={styles.stepActionsRow}>
                  <Pressable
                    onPress={closeResetVerification}
                    style={[styles.stepCancelBtn, { backgroundColor: colors.muted }]}
                  >
                    <Text style={[styles.stepCancelBtnText, { color: colors.foreground }]}>Keep Data</Text>
                  </Pressable>
                  <Pressable onPress={() => setResetVerifyStep(2)} style={styles.stepNextBtn}>
                    <Text style={styles.stepNextBtnText}>I Understand (1/3)</Text>
                    <ArrowRight size={16} color="white" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 2: SECURITY CHALLENGE (TYPE "RESET") */}
            {resetVerifyStep === 2 && (
              <View style={styles.stepContentWrap}>
                <View style={styles.stepHeaderCenter}>
                  <View style={[styles.stepIconCircle, { backgroundColor: 'rgba(13, 148, 136, 0.15)' }]}>
                    <KeyRound size={26} color="#0D9488" strokeWidth={2.3} />
                  </View>
                  <Text style={styles.stepPillHeader}>STEP 2 OF 3</Text>
                  <Text style={[styles.stepMainTitle, { color: colors.foreground }]}>Security Challenge</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
                    To prevent accidental taps, type <Text style={{ fontWeight: '900', color: colors.foreground }}>RESET</Text> in capital letters:
                  </Text>
                </View>

                <TextInput
                  value={resetInputText}
                  onChangeText={setResetInputText}
                  placeholder="Type RESET"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                  style={[
                    styles.challengeInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor:
                        resetInputText.trim().toUpperCase() === 'RESET' ? '#10B981' : colors.border,
                    },
                  ]}
                />

                {resetInputText.trim().toUpperCase() === 'RESET' ? (
                  <View style={styles.validationSuccessRow}>
                    <Check size={14} color="#10B981" strokeWidth={3} />
                    <Text style={styles.validationSuccessText}>Word matches. Ready for final step.</Text>
                  </View>
                ) : (
                  <Text style={[styles.validationHintText, { color: colors.mutedForeground }]}>
                    Must match exact letters: "RESET"
                  </Text>
                )}

                <View style={styles.stepActionsRow}>
                  <Pressable
                    onPress={() => setResetVerifyStep(1)}
                    style={[styles.stepCancelBtn, { backgroundColor: colors.muted }]}
                  >
                    <ArrowLeft size={16} color={colors.foreground} />
                    <Text style={[styles.stepCancelBtnText, { color: colors.foreground }]}>Back</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (resetInputText.trim().toUpperCase() === 'RESET') {
                        setResetVerifyStep(3);
                      }
                    }}
                    disabled={resetInputText.trim().toUpperCase() !== 'RESET'}
                    style={[
                      styles.stepNextBtn,
                      resetInputText.trim().toUpperCase() !== 'RESET' && { opacity: 0.45 },
                    ]}
                  >
                    <Text style={styles.stepNextBtnText}>Verify (2/3)</Text>
                    <ArrowRight size={16} color="white" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 3: FINAL DESTRUCTIVE CONFIRMATION */}
            {resetVerifyStep === 3 && (
              <View style={styles.stepContentWrap}>
                <View style={styles.stepHeaderCenter}>
                  <View style={[styles.stepIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Trash2 size={28} color="#EF4444" strokeWidth={2.3} />
                  </View>
                  <Text style={[styles.stepPillHeader, { color: '#EF4444' }]}>STEP 3 OF 3: FINAL SAFETY</Text>
                  <Text style={[styles.stepMainTitle, { color: colors.foreground }]}>Point of No Return</Text>
                  <Text style={[styles.stepSubtitle, { color: colors.mutedForeground }]}>
                    All local databases will be cleared and the app will restart into fresh onboarding.
                  </Text>
                </View>

                <View style={styles.dangerNoticeBox}>
                  <AlertTriangle size={18} color="#EF4444" />
                  <Text style={styles.dangerNoticeText}>
                    This operation is 100% irreversible. No recovery is possible.
                  </Text>
                </View>

                <View style={styles.stepActionsColumn}>
                  <Pressable onPress={executeFinalReset} style={styles.destructiveResetBtn}>
                    <Trash2 size={16} color="white" strokeWidth={2.5} />
                    <Text style={styles.destructiveResetBtnText}>Permanently Wipe Everything</Text>
                  </Pressable>

                  <Pressable
                    onPress={closeResetVerification}
                    style={[styles.abortBtn, { backgroundColor: colors.muted }]}
                  >
                    <Text style={[styles.abortBtnText, { color: colors.foreground }]}>Cancel & Abort Reset</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <ThemedAlertModal
        visible={Boolean(comingSoonTheme)}
        onClose={() => setComingSoonTheme(null)}
        title="Coming Soon"
        message={`${comingSoonTheme || ''} theme will be available in an upcoming update.`}
        icon="sparkles"
      />
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
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  settingsBtn: {
    position: 'absolute',
    right: 20,
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
  },
  centerCard: {
    alignItems: 'center',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userNameText: {
    fontSize: 22,
    fontWeight: '900',
  },
  offlineText: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  memberBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  maxStreakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trophyBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  maxStreakLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  maxStreakValue: {
    fontSize: 22,
    fontWeight: '900',
  },
  daysUnit: {
    fontSize: 12,
    fontWeight: '700',
  },
  nowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  nowBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  calendarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  navArrow: {
    padding: 6,
  },
  monthNameText: {
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 6,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  weekHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    width: '100%',
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '900',
  },
  calendarBody: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    width: '100%',
  },
  emptyDayCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 38,
    marginHorizontal: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 38,
    marginHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellText: {
    fontSize: 12,
    fontWeight: '800',
  },
  amberDot: {
    position: 'absolute',
    bottom: 3,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FBBF24',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  modalDateTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  detailBox: {
    padding: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  relapseDetailStack: {
    gap: 8,
  },
  relapseAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
  },
  relapseAlertText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  relapseDetailItem: {
    padding: 12,
    borderRadius: 14,
  },
  relapseDetailReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  cleanDetailStack: {
    gap: 8,
  },
  cleanBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 14,
  },
  cleanBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  urgeBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 14,
  },
  urgeBadgeText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '800',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  themePresetBox: {
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  themePresetLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  themePresetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  themeChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  themeSoonPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  themeSoonPillText: {
    color: '#D97706',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  resetLocalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  resetLocalBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteAccountBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },

  /* 🛡️ 3-STEP VERIFICATION MODAL STYLES */
  stepProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
  },
  stepLine: {
    width: 36,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 1.5,
  },
  stepContentWrap: {
    width: '100%',
  },
  stepHeaderCenter: {
    alignItems: 'center',
    marginBottom: 14,
  },
  stepIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepPillHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#0D9488',
    marginBottom: 4,
  },
  stepMainTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  warningBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
  },
  warningIntroText: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  bulletList: {
    gap: 5,
  },
  bulletItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  challengeInput: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 3,
    marginVertical: 12,
  },
  validationSuccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 14,
  },
  validationSuccessText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  validationHintText: {
    textAlign: 'center',
    fontSize: 11,
    marginBottom: 14,
  },
  dangerNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    marginBottom: 18,
  },
  dangerNoticeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    lineHeight: 16,
  },
  stepActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  stepCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  stepCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepNextBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0D9488',
  },
  stepNextBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
  stepActionsColumn: {
    gap: 10,
    width: '100%',
  },
  destructiveResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#EF4444',
  },
  destructiveResetBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  abortBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  abortBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  rewardAdCard: {
    width: '100%',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 24,
    gap: 12,
  },
  rewardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rewardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardCardPill: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#0D9488',
  },
  rewardCardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  gemCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gemCounterNumber: {
    fontSize: 15,
    fontWeight: '900',
  },
  gemCounterLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardDescription: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  rewardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
  },
  rewardBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  adModalContainer: {
    flex: 1,
    backgroundColor: '#070D1B',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  adTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
  },
  adPillBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  adPillBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  adTimerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adCountdownPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  adCountdownPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  adCloseIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adVideoFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  adMediaCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  adMediaPlayCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adSponsorBrand: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  adSponsorMessage: {
    color: '#94A3B8',
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  adProgressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: 8,
  },
  adProgressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: 3,
  },
  adFooter: {
    width: '100%',
    paddingBottom: 16,
  },
  adWaitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  adWaitingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  adClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#0D9488',
  },
  adClaimBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  rewardSuccessDialog: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    gap: 12,
  },
  rewardSuccessGlow: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(13, 148, 136, 0.18)',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rewardSuccessTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  rewardSuccessSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  rewardSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  rewardSuccessGemsCount: {
    fontSize: 16,
    fontWeight: '900',
  },
  rewardSuccessGemsLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  rewardSuccessCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  rewardSuccessCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
