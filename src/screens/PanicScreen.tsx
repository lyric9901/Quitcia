import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Zap,
  Flame,
  Wind,
  Timer,
  Pause,
  Play,
  Gamepad2,
  Sparkles,
  Footprints,
  Check,
  MessageCircle,
  Brain,
  ShieldCheck,
  Trophy,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '../theme';
import { addUrgeLog, addPanicSession, getItemSync } from '../lib/localStore';
import { FlappyBirdGame } from '../components/FlappyBirdGame';

interface PanicScreenProps {
  onNavigate: (route: string) => void;
}

const ESCAPE_ACTIONS = [
  { id: 'walk', title: 'Take a short walk', icon: '🚶', desc: 'Step outside or walk around room.' },
  { id: 'water', title: 'Drink cold water', icon: '💧', desc: 'Hydrate and shock the system.' },
  { id: 'leave', title: 'Leave current room', icon: '🚪', desc: 'Change immediate environment.' },
  { id: 'phone', title: 'Put phone away', icon: '📱', desc: 'Face down, across the room.' },
  { id: 'movement', title: '10 Pushups / Squats', icon: '🏋️', desc: 'Release physical energy.' },
];

const CALMING_MESSAGES = [
  'Urges are like ocean waves — they rise, peak, and inevitably fade.',
  'You are in total control of how you respond in this moment.',
  'Notice the sensation without judgment. Breathe through it.',
  'Overcoming an urge physically rewires your brain for freedom.',
  'This discomfort is only temporary. You are safe and strong.',
];

const COLOR_POOL = [
  { bg: '#0D9488', name: 'teal' },
  { bg: '#10B981', name: 'emerald' },
  { bg: '#F43F5E', name: 'rose' },
  { bg: '#F59E0B', name: 'amber' },
  { bg: '#6366F1', name: 'indigo' },
];

export const PanicScreen: React.FC<PanicScreenProps> = ({ onNavigate }) => {
  const { colors } = useAppTheme();

  // Scores & Tasks
  const [urgeBefore, setUrgeBefore] = useState(8);
  const [urgeAfter, setUrgeAfter] = useState(3);
  const [completedEscapes, setCompletedEscapes] = useState<string[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [activeGameModal, setActiveGameModal] = useState<'NONE' | 'FLAPPY' | 'COLOR'>('NONE');

  // Breathing Module (60s)
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathingSecs, setBreathingSecs] = useState(60);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Timer Module (300s)
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(300);
  const [messageIdx, setMessageIdx] = useState(0);

  // Color Match Game State
  const [gameScore, setGameScore] = useState(0);
  const [gameStreak, setGameStreak] = useState(0);
  const [gameTarget, setGameTarget] = useState(COLOR_POOL[0]);
  const [gameOptions, setGameOptions] = useState<typeof COLOR_POOL>([]);
  const [gameSecsLeft, setGameSecsLeft] = useState(30);

  // Breathing Animated Orb (matches Quitcia reference: scale 0.85 -> 1.25 -> 0.85, opacity 0.45 -> 0.9)
  const breathScaleAnim = useRef(new Animated.Value(1)).current;
  const breathOpacityAnim = useRef(new Animated.Value(0.4)).current;

  // BREATHING LOGIC
  useEffect(() => {
    if (!isBreathingActive) return;
    const phaseInterval = setInterval(() => {
      setBreathPhase((prev) => (prev === 'Inhale' ? 'Hold' : prev === 'Hold' ? 'Exhale' : 'Inhale'));
    }, 4000);

    const timerInterval = setInterval(() => {
      setBreathingSecs((prev) => {
        if (prev <= 1) {
          setIsBreathingActive(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(timerInterval);
    };
  }, [isBreathingActive]);

  // Breathing Orb Pulse Animation (Inhale -> 1.25 scale, Hold -> 1.25, Exhale -> 0.85)
  useEffect(() => {
    if (!isBreathingActive) {
      Animated.parallel([
        Animated.timing(breathScaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(breathOpacityAnim, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (breathPhase === 'Inhale') {
      Animated.parallel([
        Animated.timing(breathScaleAnim, {
          toValue: 1.25,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathOpacityAnim, {
          toValue: 0.9,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (breathPhase === 'Hold') {
      Animated.parallel([
        Animated.timing(breathScaleAnim, {
          toValue: 1.25,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(breathOpacityAnim, {
          toValue: 0.85,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (breathPhase === 'Exhale') {
      Animated.parallel([
        Animated.timing(breathScaleAnim, {
          toValue: 0.85,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathOpacityAnim, {
          toValue: 0.45,
          duration: 3800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isBreathingActive, breathPhase, breathScaleAnim, breathOpacityAnim]);

  // TIMER LOGIC
  useEffect(() => {
    if (!isTimerActive) return;
    const msgInterval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % CALMING_MESSAGES.length);
    }, 10000);

    const timerInterval = setInterval(() => {
      setTimerSecs((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(msgInterval);
      clearInterval(timerInterval);
    };
  }, [isTimerActive]);

  // COLOR GAME LOGIC
  const generateGameRound = () => {
    const target = COLOR_POOL[Math.floor(Math.random() * COLOR_POOL.length)];
    const shuffled = [...COLOR_POOL].sort(() => Math.random() - 0.5);
    setGameTarget(target);
    setGameOptions(shuffled);
  };

  const startColorGame = () => {
    setActiveGameModal('COLOR');
    setGameScore(0);
    setGameStreak(0);
    setGameSecsLeft(30);
    generateGameRound();
  };

  useEffect(() => {
    if (activeGameModal !== 'COLOR') return;
    const interval = setInterval(() => {
      setGameSecsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setActiveGameModal('NONE');
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeGameModal]);

  const handleColorTap = (col: (typeof COLOR_POOL)[number]) => {
    if (col.name === gameTarget.name) {
      Haptics.selectionAsync().catch(() => {});
      const nextStreak = gameStreak + 1;
      const bonus = nextStreak >= 3 ? 2 : 1;
      setGameScore((prev) => prev + bonus);
      setGameStreak(nextStreak);
      generateGameRound();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setGameStreak(0);
    }
  };

  const toggleEscape = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setCompletedEscapes((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleUrgesPresentClick = () => {
    addUrgeLog();
    onNavigate('audio');
  };

  const handleConfirmExit = () => {
    const improvement = urgeBefore - urgeAfter;
    addPanicSession({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      urgeBefore,
      urgeAfter,
      improvement: Math.max(0, improvement),
      completedEscapes,
      tasksCompleted: completedEscapes.length,
      completed: true,
    });
    setShowExitModal(false);
    onNavigate('dashboard');
  };

  const handleSendSupportMsg = () => {
    const num = getItemSync('panic_trusted_contact') || '';
    const text = encodeURIComponent(
      "Hey, I'm navigating an urge right now with Quitcia. Could we talk for a minute?"
    );
    if (num) {
      Linking.openURL(`https://wa.me/${num.replace(/[^0-9]/g, '')}?text=${text}`).catch(() => {});
    } else {
      Linking.openURL(`whatsapp://send?text=${text}`).catch(() => {});
    }
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const completedCount = completedEscapes.length;
  const totalTasks = ESCAPE_ACTIONS.length;
  const taskProgress = Math.round((completedCount / totalTasks) * 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Pressable onPress={() => setShowExitModal(true)} style={[styles.closeIconBtn, { backgroundColor: colors.muted }]}>
          <X size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.headerTitleRow}>
          <View style={styles.redDot} />
          <Text style={[styles.headerTitleText, { color: colors.foreground }]}>Relief Feature Hub</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 0. URGES PRESENT MAIN TRIGGER */}
        <Pressable
          onPress={handleUrgesPresentClick}
          style={({ pressed }) => [
            styles.urgeButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient colors={['#F97316', '#EA580C']} style={styles.urgeGradient}>
            <Zap size={22} color="white" fill="white" />
            <Text style={styles.urgeButtonText}>Urges Present (Surf Wave)</Text>
          </LinearGradient>
        </Pressable>

        {/* 1. INITIAL URGE SCORE */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.flameIconBg}>
                <Flame size={16} color="#E05252" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Initial Urge Level</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{urgeBefore} / 10</Text>
            </View>
          </View>

          <View style={[styles.scoreChipsRow, { backgroundColor: colors.muted }]}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <Pressable
                key={score}
                onPress={() => setUrgeBefore(score)}
                style={[
                  styles.scoreChip,
                  urgeBefore === score && styles.scoreChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.scoreChipText,
                    { color: colors.mutedForeground },
                    urgeBefore === score && styles.scoreChipTextSelected,
                  ]}
                >
                  {score}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 2. GUIDED BREATHING */}
        <View style={[styles.card, styles.centerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Wind size={16} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.accent }]}>Guided Breathing</Text>
            </View>
            <Pressable
              onPress={() => setIsBreathingActive(!isBreathingActive)}
              style={styles.controlPill}
            >
              {isBreathingActive ? <Pause size={14} color={colors.accent} /> : <Play size={14} color={colors.accent} />}
              <Text style={[styles.controlPillText, { color: colors.accent }]}>
                {isBreathingActive ? 'Pause' : 'Start'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.orbWrap}>
            <Animated.View
              style={[
                styles.breathingOrbGlow,
                {
                  transform: [{ scale: breathScaleAnim }],
                  opacity: breathOpacityAnim,
                },
              ]}
            />
            <View style={styles.orbInnerContent}>
              <Text style={[styles.phaseText, { color: colors.foreground }]}>
                {isBreathingActive ? breathPhase : 'Ready'}
              </Text>
              <Text style={[styles.secsText, { color: colors.mutedForeground }]}>{breathingSecs}s left</Text>
            </View>
          </View>

          <Text style={[styles.breathingHint, { color: colors.mutedForeground }]}>
            Inhale 4s ➔ Hold 4s ➔ Exhale 4s to calm nervous system.
          </Text>
        </View>

        {/* 3. 5-MIN URGE SURFING TIMER */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.timerIconBg}>
                <Timer size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>5-Min Urge Surfing Timer</Text>
            </View>
            <Pressable
              onPress={() => setIsTimerActive(!isTimerActive)}
              style={[styles.controlPill, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
            >
              {isTimerActive ? <Pause size={14} color="#D97706" /> : <Play size={14} color="#D97706" />}
              <Text style={[styles.controlPillText, { color: '#D97706' }]}>
                {isTimerActive ? 'Pause' : 'Start'}
              </Text>
            </Pressable>
          </View>

          <View style={[styles.timerRow, { backgroundColor: colors.muted }]}>
            <Text style={[styles.timerSecsText, { color: colors.foreground }]}>{formatSecs(timerSecs)}</Text>
            <Text style={[styles.messageQuote, { color: colors.mutedForeground }]}>
              "{CALMING_MESSAGES[messageIdx]}"
            </Text>
          </View>
        </View>

        {/* 4. DISTRACTION ARCADE */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.arcadeIconBg}>
              <Gamepad2 size={16} color="#6366F1" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Distraction Arcade</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Lightweight games to reset your focus</Text>
            </View>
          </View>

          <View style={styles.arcadeGrid}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveGameModal('FLAPPY');
              }}
              style={({ pressed }) => [
                styles.gameCard,
                { backgroundColor: `${colors.accent}15`, borderColor: `${colors.accent}30` },
                pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
              ]}
            >
              <View style={styles.gameCardHeader}>
                <Text style={{ fontSize: 24 }}>🐤</Text>
                <Sparkles size={16} color={colors.accent} />
              </View>
              <Text style={[styles.gameCardTitle, { color: colors.foreground }]}>Flappy Pulse</Text>
              <Text style={[styles.gameCardDesc, { color: colors.mutedForeground }]}>Dodge obstacles, tap to fly</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                startColorGame();
              }}
              style={({ pressed }) => [
                styles.gameCard,
                { backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' },
                pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] },
              ]}
            >
              <View style={styles.gameCardHeader}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
                <Zap size={16} color="#6366F1" />
              </View>
              <Text style={[styles.gameCardTitle, { color: colors.foreground }]}>Color Reflex</Text>
              <Text style={[styles.gameCardDesc, { color: colors.mutedForeground }]}>30s speed tap + streak bonus</Text>
            </Pressable>
          </View>
        </View>

        {/* 5. QUICK PHYSICAL ESCAPES */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.escapeIconBg}>
                <Footprints size={16} color={colors.accent} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Quick Physical Escapes</Text>
                <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Tick each action you complete</Text>
              </View>
            </View>
            <Text style={[styles.taskProgressText, { color: colors.accent }]}>
              {completedCount}/{totalTasks}
            </Text>
          </View>

          <View style={styles.escapesList}>
            {ESCAPE_ACTIONS.map((act) => {
              const isDone = completedEscapes.includes(act.id);
              return (
                <Pressable
                  key={act.id}
                  onPress={() => toggleEscape(act.id)}
                  style={({ pressed }) => [
                    styles.escapeItem,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                    isDone && { backgroundColor: `${colors.accent}15`, borderColor: colors.accent },
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <View
                    style={[
                      styles.checkCircle,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      isDone && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                  >
                    {isDone && <Check size={12} color="white" strokeWidth={3} />}
                  </View>
                  <Text style={{ fontSize: 20 }}>{act.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.escapeTitle,
                        { color: colors.foreground },
                        isDone && styles.escapeTitleDone,
                      ]}
                    >
                      {act.title}
                    </Text>
                    <Text style={[styles.escapeDesc, { color: colors.mutedForeground }]}>{act.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 6. SUPPORT CONTACT */}
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            handleSendSupportMsg();
          }}
          style={({ pressed }) => [
            styles.supportButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <MessageCircle size={18} color="#059669" />
          <Text style={styles.supportButtonText}>Message Support Contact</Text>
        </Pressable>
      </ScrollView>

      {/* FLAPPY BIRD OVERLAY */}
      <FlappyBirdGame visible={activeGameModal === 'FLAPPY'} onClose={() => setActiveGameModal('NONE')} />

      {/* COLOR REFLEX OVERLAY */}
      <Modal visible={activeGameModal === 'COLOR'} transparent animationType="fade">
        <View style={styles.colorModalOverlay}>
          <View style={styles.colorModalDialog}>
            <View style={styles.colorModalHeader}>
              <View style={styles.colorModalTitleRow}>
                <Trophy size={16} color="#818CF8" />
                <Text style={styles.colorModalTitle}>Color Reflex</Text>
              </View>
              <Pressable onPress={() => setActiveGameModal('NONE')}>
                <X size={18} color="#94A3B8" />
              </Pressable>
            </View>

            <View style={styles.colorScoreboard}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Score: <Text style={{ color: '#818CF8', fontWeight: '900' }}>{gameScore}</Text></Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>Streak: <Text style={{ color: '#34D399', fontWeight: '900' }}>{gameStreak}</Text></Text>
              <Text style={{ color: '#818CF8', fontWeight: '900', fontSize: 12 }}>{gameSecsLeft}s left</Text>
            </View>

            <Text style={styles.colorTargetLabel}>TAP TARGET COLOR</Text>
            <View style={[styles.colorTargetOrb, { backgroundColor: gameTarget.bg }]} />

            <View style={styles.colorOptionsRow}>
              {gameOptions.map((col, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleColorTap(col)}
                  style={[styles.colorOptionChip, { backgroundColor: col.bg }]}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* EXIT CONFIRMATION MODAL */}
      <Modal visible={showExitModal} transparent animationType="fade">
        <View style={styles.exitModalOverlay}>
          <View style={[styles.exitModalDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.exitModalHeader}>
              <View style={styles.exitHeaderTitleRow}>
                <Brain size={18} color={colors.accent} />
                <Text style={[styles.exitTitle, { color: colors.foreground }]}>How do you feel now?</Text>
              </View>
              <Pressable onPress={() => setShowExitModal(false)}>
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {completedCount > 0 && (
              <View style={styles.escapesBadge}>
                <ShieldCheck size={16} color={colors.accent} />
                <Text style={[styles.escapesBadgeText, { color: colors.accent }]}>
                  {completedCount} physical escape task{completedCount > 1 ? 's' : ''} completed
                </Text>
              </View>
            )}

            <View style={[styles.afterRatingBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <View style={styles.afterRatingHeader}>
                <Text style={[styles.afterRatingLabel, { color: colors.mutedForeground }]}>Current Urge Score</Text>
                <Text style={styles.afterRatingValue}>{urgeAfter} / 10</Text>
              </View>

              <View style={styles.afterRatingChipsRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <Pressable
                    key={score}
                    onPress={() => setUrgeAfter(score)}
                    style={[styles.afterScoreChip, urgeAfter === score && styles.afterScoreChipSelected]}
                  >
                    <Text style={[styles.afterScoreChipText, urgeAfter === score && { color: 'white', fontWeight: '900' }]}>
                      {score}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.calculatedReliefRow}>
                <Text style={[styles.calculatedReliefLabel, { color: colors.mutedForeground }]}>Calculated Relief</Text>
                <Text style={[styles.calculatedReliefValue, { color: colors.accent }]}>
                  +{Math.max(0, urgeBefore - urgeAfter)} Points
                </Text>
              </View>
            </View>

            <View style={styles.exitActionsRow}>
              <Pressable onPress={() => setShowExitModal(false)} style={[styles.stayBtn, { backgroundColor: colors.muted }]}>
                <Text style={[styles.stayBtnText, { color: colors.foreground }]}>Stay</Text>
              </Pressable>
              <Pressable onPress={handleConfirmExit} style={[styles.logExitBtn, { backgroundColor: colors.accent }]}>
                <ShieldCheck size={16} color="white" />
                <Text style={styles.logExitBtnText}>Log & Exit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  closeIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  urgeButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  urgeGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  urgeButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
  },
  card: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  centerCard: {
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flameIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  scoreBadgeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
  },
  scoreChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderRadius: 16,
  },
  scoreChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  scoreChipSelected: {
    backgroundColor: '#EF4444',
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreChipTextSelected: {
    color: 'white',
    fontWeight: '900',
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
  },
  controlPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  orbWrap: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  breathingOrbGlow: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 2,
    borderColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 8,
  },
  orbInnerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: '900',
  },
  secsText: {
    fontSize: 11,
    marginTop: 4,
  },
  breathingHint: {
    fontSize: 11,
    textAlign: 'center',
  },
  timerIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
  },
  timerSecsText: {
    fontSize: 26,
    fontWeight: '900',
  },
  messageQuote: {
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  arcadeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcadeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  gameCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  gameCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameCardTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  gameCardDesc: {
    fontSize: 10,
  },
  escapeIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskProgressText: {
    fontSize: 12,
    fontWeight: '900',
  },
  escapesList: {
    gap: 8,
  },
  escapeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  escapeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  escapeTitleDone: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  escapeDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  supportButton: {
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  colorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  colorModalDialog: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  colorModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  colorModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorModalTitle: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
  },
  colorScoreboard: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#070D1B',
    borderRadius: 12,
    marginBottom: 16,
  },
  colorTargetLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  colorTargetOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 20,
  },
  colorOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorOptionChip: {
    width: 44,
    height: 44,
    borderRadius: 16,
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exitModalDialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  exitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exitHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exitTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  escapesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(13, 148, 136, 0.1)',
    borderRadius: 14,
  },
  escapesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  afterRatingBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  afterRatingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  afterRatingLabel: {
    fontSize: 12,
  },
  afterRatingValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10B981',
  },
  afterRatingChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  afterScoreChip: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  afterScoreChipSelected: {
    backgroundColor: '#10B981',
  },
  afterScoreChipText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  calculatedReliefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  calculatedReliefLabel: {
    fontSize: 12,
  },
  calculatedReliefValue: {
    fontSize: 12,
    fontWeight: '900',
  },
  exitActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stayBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stayBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  logExitBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logExitBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
  },
});
