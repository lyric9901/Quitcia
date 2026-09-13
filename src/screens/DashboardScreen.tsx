import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import {
  Flame,
  Siren,
  RotateCcw,
  Check,
  RefreshCw,
  Calendar,
  Hourglass,
  Timer,
  Clock,
  Smartphone,
  ChevronRight,
  Shield,
  Sparkles,
  PlusCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../theme';
import {
  getUserProfile,
  getStreakLastReset,
  getDailyTasks,
  setDailyTasks,
  addRelapseLog,
  elapsedSeconds,
  formatStreakTime,
  Task,
  TASKS,
} from '../lib/localStore';
import { BottomNav, TabRoute } from '../components/BottomNav';
import { ResetModal } from '../components/ResetModal';
import { OrbModal } from '../components/OrbModal';
import { ReflectionModal } from '../components/ReflectionModal';
import { FeedbackScreen } from '../components/FeedbackScreen';
import { StreakWidgetModal } from '../components/StreakWidgetModal';
import { ThemedAlertModal } from '../components/ThemedAlertModal';

interface DashboardScreenProps {
  onNavigate: (route: string) => void;
  currentTab: TabRoute;
}

const CircleDisplay = React.memo(({
  value,
  max,
  color,
  label,
  Icon,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  Icon: any;
}) => {
  const { colors } = useAppTheme();
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const displayValue = value % max;
  const fillPercentage = displayValue / max;
  const strokeDashoffset = circumference - fillPercentage * circumference;

  return (
    <View style={styles.circleContainer}>
      <View style={styles.svgWrap}>
        <Svg width="56" height="56" viewBox="0 0 56 56">
          <Circle cx="28" cy="28" r={radius} stroke={colors.muted} strokeWidth="4.5" fill="transparent" />
          <Circle
            cx="28"
            cy="28"
            r={radius}
            stroke={color}
            strokeWidth="4.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 28 28)"
          />
        </Svg>
        <Text style={[styles.circleValueText, { color: colors.foreground }]}>{value}</Text>
      </View>
      <View style={styles.circleLabelRow}>
        <Icon size={12} color={colors.mutedForeground} strokeWidth={2.5} />
        <Text style={[styles.circleLabelText, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  );
});

const AnimatedFlame: React.FC<{ size?: number; hours?: number }> = ({ size = 20, hours = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 700,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, rotateAnim]);

  // Hourly animation flare burst
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.4,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hours, pulseAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-7deg', '0deg', '7deg'],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }, { rotate: spin }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Flame size={size} color="#F97316" fill="#F97316" />
    </Animated.View>
  );
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate, currentTab }) => {
  const { colors } = useAppTheme();
  const [lastReset, setLastReset] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [dailyTasksList, setDailyTasksList] = useState<Task[]>([]);
  const [userName, setUserName] = useState<string>('there');

  // Modals
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [widgetModalOpen, setWidgetModalOpen] = useState(false);
  const [widgetGuideModalVisible, setWidgetGuideModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'orb' | 'reflection' | 'feedback'>('none');

  useEffect(() => {
    const ts = getStreakLastReset();
    setLastReset(ts);
    setDailyTasksList(getDailyTasks());

    const profile = getUserProfile();
    if (profile?.name) {
      setUserName(profile.name);
    }
  }, []);

  useEffect(() => {
    if (!lastReset) return;
    const tick = () => {
      const secs = elapsedSeconds(lastReset);
      setTimeLeft(formatStreakTime(secs));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastReset]);

  const completeTask = useCallback((taskId: number) => {
    Haptics.selectionAsync().catch(() => {});
    setDailyTasksList((prev) => {
      const updated = prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t));
      setDailyTasks(updated);
      return updated;
    });
  }, []);

  const refreshTasks = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const currentTexts = dailyTasksList.map((t) => t.text);
    const available = TASKS.filter((t) => !currentTexts.includes(t));
    const pool = available.length >= 3 ? available : TASKS;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const newTasks = shuffled
      .slice(0, 3)
      .map((text, idx) => ({ id: Date.now() + idx, text, completed: false }));

    setDailyTasksList(newTasks);
    setDailyTasks(newTasks);
  }, [dailyTasksList]);

  const performReset = useCallback((finalReason: string) => {
    if (!lastReset) return;
    setIsSubmittingReset(true);

    const now = Date.now();
    const secs = elapsedSeconds(lastReset, now);
    const { d, h, m, s } = formatStreakTime(secs);
    const streakLostStr = `${d}d ${h}h ${m}m ${s}s`;
    const timestampStr = new Date(now).toISOString();

    addRelapseLog({
      timestamp: timestampStr,
      streakLost: streakLostStr,
      reason: finalReason,
    });

    setLastReset(now);
    setIsSubmittingReset(false);
    setResetModalOpen(false);
  }, [lastReset]);

  const handleDirectAddWidget = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setWidgetGuideModalVisible(true);
  };

  const completedCount = useMemo(
    () => dailyTasksList.filter((t) => t.completed).length,
    [dailyTasksList]
  );
  const progressPercent = useMemo(
    () => (dailyTasksList.length > 0 ? Math.round((completedCount / dailyTasksList.length) * 100) : 0),
    [dailyTasksList, completedCount]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.responsiveWrapper}>
          {/* 🗿 MEME BRAND TITLE HEADER */}
          <View style={styles.memeHeader}>
            <Text style={[styles.memeBrandText, { color: colors.foreground }]}>
              Quitcia
            </Text>
          </View>

          {/* STREAK TRACKER CARD */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.streakHeader}>
              <View style={styles.streakHeaderLeft}>
                <View style={styles.flameBadge}>
                  <Flame size={20} color="#EA580C" fill="#F97316" />
                </View>
                <Text style={[styles.streakTitle, { color: colors.foreground }]}>Current Streak</Text>
              </View>
              <View style={styles.streakStatusPill}>
                <View style={styles.streakPulseDot} />
                <Text style={styles.streakStatusText}>TRACKING</Text>
              </View>
            </View>

            <View style={styles.circlesRow}>
              <CircleDisplay value={timeLeft.d} max={30} color="#2563EB" label="Days" Icon={Calendar} />
              <CircleDisplay value={timeLeft.h} max={24} color="#059669" label="Hours" Icon={Hourglass} />
              <CircleDisplay value={timeLeft.m} max={60} color="#D97706" label="Mins" Icon={Timer} />
              <CircleDisplay value={timeLeft.s} max={60} color="#DC2626" label="Secs" Icon={Clock} />
            </View>
          </View>

          {/* CRISIS & URGE CONTROL CONTAINER */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.controlHeader}>
              <View style={styles.controlHeaderLeft}>
                <Siren size={17} color="#E05252" strokeWidth={2.5} />
                <Text style={[styles.controlHeaderText, { color: colors.mutedForeground }]}>
                  CRISIS & URGE CONTROL
                </Text>
              </View>
              <View style={styles.instantSupportBadge}>
                <Text style={styles.instantSupportText}>Instant Support</Text>
              </View>
            </View>

            <View style={styles.actionButtonsRow}>
              {/* Panic Button */}
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                  onNavigate('panic');
                }}
                style={({ pressed }) => [
                  styles.panicButton,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                ]}
              >
                <LinearGradient colors={['#E05252', '#BE123C']} style={styles.panicGradient}>
                  <Siren size={17} color="white" strokeWidth={2.5} />
                  <Text style={styles.panicButtonText}>Panic Button</Text>
                </LinearGradient>
              </Pressable>

              {/* Reset Button */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setResetModalOpen(true);
                }}
                style={({ pressed }) => [
                  styles.resetButton,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                ]}
              >
                <RotateCcw size={16} color={colors.foreground} strokeWidth={2.5} />
                <Text style={[styles.resetButtonText, { color: colors.foreground }]}>Reset Streak</Text>
              </Pressable>
            </View>
          </View>

          {/* DAILY CHALLENGES CARD */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.challengesHeader}>
              <Text style={[styles.challengesTitle, { color: colors.foreground }]}>Daily Challenges</Text>
              <View style={styles.progressCircleWrap}>
                <Svg width="42" height="42" viewBox="0 0 42 42">
                  <Circle cx="21" cy="21" r="16" stroke={colors.muted} strokeWidth="4" fill="transparent" />
                  <Circle
                    cx="21"
                    cy="21"
                    r="16"
                    stroke={colors.accent}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={(2 * Math.PI * 16) - (progressPercent / 100) * (2 * Math.PI * 16)}
                    strokeLinecap="round"
                    transform="rotate(-90 21 21)"
                  />
                </Svg>
                <Text style={[styles.progressPercentText, { color: colors.foreground }]}>
                  {progressPercent}%
                </Text>
              </View>
            </View>

            {/* All tasks completed banner */}
            {progressPercent === 100 && (
              <View style={styles.completedBanner}>
                <Text style={styles.completedBannerText}>🎉 All tasks completed! Amazing work!</Text>
                <Pressable
                  onPress={refreshTasks}
                  style={({ pressed }) => [
                    styles.refreshTasksBtn,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <RefreshCw size={14} color="white" strokeWidth={2.5} />
                  <Text style={styles.refreshTasksBtnText}>Refresh New Tasks</Text>
                </Pressable>
              </View>
            )}

            {/* Tasks List */}
            <View style={styles.taskList}>
              {dailyTasksList.map((task) => (
                <Pressable
                  key={task.id}
                  onPress={() => completeTask(task.id)}
                  disabled={task.completed}
                  style={({ pressed }) => [
                    styles.taskItem,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                    task.completed && { opacity: 0.65 },
                    pressed && !task.completed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      task.completed && { backgroundColor: '#10B981', borderColor: '#10B981' },
                    ]}
                  >
                    {task.completed && <Check size={12} color="white" strokeWidth={3.5} />}
                  </View>
                  <Text
                    style={[
                      styles.taskText,
                      { color: colors.foreground },
                      task.completed && styles.taskTextDone,
                    ]}
                  >
                    {task.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* 📱 STREAK COUNTER WIDGET (DIRECTLY UNDER DAILY CHALLENGES) */}
          <View style={[styles.card, styles.widgetPromoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.widgetPromoHeader}>
              <View style={styles.widgetHeaderLeft}>
                <View style={[styles.widgetIconSquare, { backgroundColor: 'rgba(13, 148, 136, 0.15)' }]}>
                  <Smartphone size={18} color="#0D9488" strokeWidth={2.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.widgetPromoTitle, { color: colors.foreground }]}>
                    Streak Counter Widget
                  </Text>
                  <Text style={[styles.widgetPromoSub, { color: colors.mutedForeground }]}>
                    Glance at your streak on your home screen
                  </Text>
                </View>
              </View>
              <View style={styles.widgetTagPill}>
                <Sparkles size={11} color="#0D9488" />
                <Text style={styles.widgetTagText}>LIVE</Text>
              </View>
            </View>

            {/* Live Mobile Widget Mini Preview Card */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setWidgetModalOpen(true);
              }}
              style={({ pressed }) => [
                styles.widgetMiniPreview,
                pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
              ]}
            >
              <LinearGradient
                colors={['#0F766E', '#115E59', '#0B132B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.widgetMiniGradient}
              >
                <View style={styles.widgetMiniTop}>
                  <View style={styles.widgetMiniBrand}>
                    <AnimatedFlame size={18} hours={timeLeft.h} />
                    <Text style={styles.widgetMiniBrandText}>QUITCIA STREAK</Text>
                  </View>
                  <View style={styles.widgetMiniDaysPill}>
                    <Text style={styles.widgetMiniDaysText}>{timeLeft.d} DAYS</Text>
                  </View>
                </View>

                <View style={styles.widgetMiniDigitsRow}>
                  <Text style={styles.widgetMiniBigDigits}>
                    {String(timeLeft.h).padStart(2, '0')}:{String(timeLeft.m).padStart(2, '0')}:{String(timeLeft.s).padStart(2, '0')}
                  </Text>
                  <Shield size={20} color="#2DD4BF" />
                </View>

                <Text style={styles.widgetMiniMotto}>Tap to customize widget style & sizes</Text>
              </LinearGradient>
            </Pressable>

            {/* DIRECT ADD WIDGET BUTTON (PRIMARY) */}
            <Pressable
              onPress={handleDirectAddWidget}
              style={({ pressed }) => [
                styles.directAddActionBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient colors={['#0D9488', '#0F766E']} style={styles.directAddActionGradient}>
                <PlusCircle size={18} color="white" strokeWidth={2.5} />
                <Text style={styles.directAddActionText}>Add widget to Homescreen</Text>
              </LinearGradient>
            </Pressable>

            {/* CONFIGURE WIDGET HUB BUTTON */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setWidgetModalOpen(true);
              }}
              style={({ pressed }) => [
                styles.widgetLaunchBtn,
                { backgroundColor: colors.muted, borderColor: colors.border },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Smartphone size={16} color={colors.foreground} strokeWidth={2.5} />
              <Text style={[styles.widgetLaunchBtnText, { color: colors.foreground }]}>
                Preview All Sizes (4×2 & 2×2)
              </Text>
              <ChevronRight size={16} color={colors.mutedForeground} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <BottomNav currentRoute={currentTab} onNavigate={(r) => onNavigate(r)} />

      {/* MODALS */}
      <StreakWidgetModal
        visible={widgetModalOpen}
        onClose={() => setWidgetModalOpen(false)}
        streakTime={timeLeft}
        streakDays={timeLeft.d}
      />
      <ResetModal
        visible={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onSubmit={performReset}
        isSubmitting={isSubmittingReset}
      />
      <OrbModal
        visible={activeModal === 'orb'}
        onClose={() => setActiveModal('none')}
        onGoToAudio={() => {
          setActiveModal('none');
          onNavigate('audio');
        }}
      />
      <ReflectionModal
        visible={activeModal === 'reflection'}
        onClose={() => setActiveModal('none')}
      />
      <FeedbackScreen
        visible={activeModal === 'feedback'}
        onClose={() => setActiveModal('none')}
      />
      <ThemedAlertModal
        visible={widgetGuideModalVisible}
        onClose={() => setWidgetGuideModalVisible(false)}
        icon="widget"
        title={Platform.OS === 'android' ? 'Add Widget to Android Screen' : 'Add Widget to iOS Screen'}
        steps={
          Platform.OS === 'android'
            ? [
                'Long-press any empty area on your Home Screen.',
                'Tap "Widgets" from the bottom menu.',
                'Scroll and select "Quitcia".',
                'Drag your streak counter to your home screen.',
              ]
            : [
                'Long-press your Home Screen until apps begin to jiggle.',
                'Tap the (+) icon in the top-left corner.',
                'Search for "Quitcia" in widgets list.',
                'Tap "Add Widget" to place it on screen.',
              ]
        }
        buttons={[
          {
            text: 'More Styles',
            onPress: () => {
              setWidgetGuideModalVisible(false);
              setWidgetModalOpen(true);
            },
            style: 'default',
          },
          {
            text: 'Got it!',
            onPress: () => setWidgetGuideModalVisible(false),
            style: 'cancel',
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 110,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 16,
  },
  memeHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 6,
  },
  memeBrandText: {
    fontFamily: Platform.select({
      ios: 'Impact',
      android: 'sans-serif-black',
      default: 'Impact',
    }),
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 1.5, height: 2 },
    textShadowRadius: 3,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  streakHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  streakStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  streakPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  streakStatusText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  circlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  circleContainer: {
    alignItems: 'center',
  },
  svgWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  circleValueText: {
    position: 'absolute',
    fontSize: 15,
    fontWeight: '900',
  },
  circleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circleLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  controlHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  controlHeaderText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  instantSupportBadge: {
    backgroundColor: 'rgba(224, 82, 82, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  instantSupportText: {
    color: '#E05252',
    fontSize: 10,
    fontWeight: '900',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  panicButton: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#E05252',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  panicGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  panicButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  challengesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  challengesTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  progressCircleWrap: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressPercentText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '900',
  },
  completedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  completedBannerText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '900',
  },
  refreshTasksBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshTasksBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
  },
  taskList: {
    gap: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  taskText: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  widgetPromoCard: {
    gap: 12,
    borderWidth: 2,
  },
  widgetPromoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  widgetIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetPromoTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  widgetPromoSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  widgetTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  widgetTagText: {
    color: '#0D9488',
    fontSize: 10,
    fontWeight: '900',
  },
  widgetMiniPreview: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  widgetMiniGradient: {
    padding: 16,
    borderRadius: 20,
  },
  widgetMiniTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widgetMiniBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  widgetMiniBrandText: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  widgetMiniDaysPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  widgetMiniDaysText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  widgetMiniDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  widgetMiniBigDigits: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  widgetMiniMotto: {
    color: '#99F6E4',
    fontSize: 11,
    fontWeight: '600',
  },
  directAddActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  directAddActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  directAddActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  widgetLaunchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  widgetLaunchBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
