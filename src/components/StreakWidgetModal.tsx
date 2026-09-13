import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Share,
  Animated,
} from 'react-native';
import { ThemedAlertModal } from './ThemedAlertModal';
import {
  X,
  Flame,
  Smartphone,
  Sparkles,
  Share2,
  Check,
  Zap,
  Shield,
  PlusCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '../theme';

interface StreakWidgetModalProps {
  visible: boolean;
  onClose: () => void;
  streakTime: { d: number; h: number; m: number; s: number };
  streakDays: number;
}

const AnimatedFlame: React.FC<{ size?: number; hours?: number }> = ({ size = 32, hours = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.16,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.94,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
        Animated.sequence([
          Animated.timing(haloScale, {
            toValue: 1.35,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(haloScale, {
            toValue: 1,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(haloOpacity, {
            toValue: 0.65,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(haloOpacity, {
            toValue: 0.25,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, rotateAnim, haloScale, haloOpacity]);

  // Hourly flare animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.45,
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
    outputRange: ['-8deg', '0deg', '8deg'],
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size + 14, height: size + 14 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
          backgroundColor: '#EA580C',
          opacity: haloOpacity,
          transform: [{ scale: haloScale }],
        }}
      />
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }, { rotate: spin }],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Flame size={size} color="#F97316" fill="#F97316" />
      </Animated.View>
    </View>
  );
};

export const StreakWidgetModal: React.FC<StreakWidgetModalProps> = ({
  visible,
  onClose,
  streakTime,
  streakDays,
}) => {
  const { colors } = useAppTheme();
  const [activeTab, setActiveTab] = useState<'preview' | 'install'>('preview');
  const [widgetStyle, setWidgetStyle] = useState<'bold' | 'minimal' | 'matrix'>('bold');
  const [copied, setCopied] = useState(false);
  const [widgetAdded, setWidgetAdded] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    steps?: string[];
    icon?: 'info' | 'alert' | 'widget' | 'sparkles' | 'check';
  }>({
    visible: false,
    title: '',
  });

  if (!visible) return null;

  const handleDirectAddWidget = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setWidgetAdded(true);

    if (Platform.OS === 'android') {
      setAlertConfig({
        visible: true,
        icon: 'widget',
        title: 'Add Widget to Android Screen',
        steps: [
          'Go to your Home Screen.',
          'Long press any empty space.',
          'Tap "Widgets" and select Quitcia.',
          'Drag your Streak Counter to the desired spot.',
        ],
      });
    } else {
      setAlertConfig({
        visible: true,
        icon: 'widget',
        title: 'Add Widget to iOS Screen',
        steps: [
          'Go to your Home Screen.',
          'Touch and hold any app until icons jiggle.',
          'Tap (+) top-left corner.',
          'Search "Quitcia" and tap Add Widget.',
        ],
      });
    }

    setTimeout(() => setWidgetAdded(false), 3500);
  };

  const handleShare = async () => {
    Haptics.selectionAsync().catch(() => {});
    try {
      await Share.share({
        message: `🔥 Clean for ${streakDays} days (${streakTime.d}d ${streakTime.h}h ${streakTime.m}m) with Quitcia! Every minute rewires your brain.`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetTitleRow}>
              <View style={styles.widgetIconBg}>
                <Smartphone size={20} color="#0D9488" strokeWidth={2.5} />
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Streak Counter Widget
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>
                  Live home & lock screen companion
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onClose();
              }}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: colors.muted },
                pressed && { opacity: 0.8, transform: [{ scale: 0.92 }] },
              ]}
            >
              <X size={18} color={colors.foreground} strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Quick Direct Add Widget Button */}
          <View style={styles.directAddWrap}>
            <Pressable
              onPress={handleDirectAddWidget}
              style={({ pressed }) => [
                styles.directAddBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <LinearGradient colors={['#0D9488', '#0F766E']} style={styles.directAddGradient}>
                <PlusCircle size={18} color="white" strokeWidth={2.5} />
                <Text style={styles.directAddBtnText}>
                  {widgetAdded ? 'Widget Guide Opened! ✓' : 'Add widget to Homescreen'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Segment Selector */}
          <View style={[styles.segmentTrack, { backgroundColor: colors.muted }]}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab('preview');
              }}
              style={[
                styles.segmentBtn,
                activeTab === 'preview' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: activeTab === 'preview' ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Widget Preview
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab('install');
              }}
              style={[
                styles.segmentBtn,
                activeTab === 'install' && [styles.segmentBtnActive, { backgroundColor: colors.card }],
              ]}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  { color: activeTab === 'install' ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Setup Guide
              </Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {activeTab === 'preview' ? (
              <>
                {/* Theme / Style Selector */}
                <View style={styles.styleSelectorRow}>
                  {[
                    { id: 'bold', label: 'BOLD', available: true },
                    { id: 'minimal', label: 'MINIMAL', available: false },
                    { id: 'matrix', label: 'MATRIX', available: false },
                  ].map((theme) => {
                    const isSelected = widgetStyle === theme.id;
                    return (
                      <Pressable
                        key={theme.id}
                        onPress={() => {
                          if (!theme.available) {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
                            setAlertConfig({
                              visible: true,
                              icon: 'sparkles',
                              title: 'Coming Soon',
                              message: `${theme.label} theme will be available in an upcoming update.`,
                            });
                            return;
                          }
                          Haptics.selectionAsync().catch(() => {});
                          setWidgetStyle('bold');
                        }}
                        style={[
                          styles.styleChip,
                          { borderColor: colors.border, backgroundColor: colors.muted },
                          isSelected && { borderColor: '#0D9488', backgroundColor: 'rgba(13, 148, 136, 0.15)' },
                          !theme.available && { opacity: 0.65 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.styleChipText,
                            { color: colors.mutedForeground },
                            isSelected && { color: '#0D9488', fontWeight: '900' },
                          ]}
                        >
                          {theme.label}
                        </Text>
                        {!theme.available && (
                          <View style={styles.soonBadge}>
                            <Text style={styles.soonBadgeText}>SOON</Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {/* Medium Widget (4x2) */}
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                  MEDIUM WIDGET (4×2)
                </Text>

                {widgetStyle === 'bold' && (
                  <LinearGradient
                    colors={['#0F766E', '#115E59', '#0B132B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mediumWidgetCard}
                  >
                    <View style={styles.widgetTopRow}>
                      <View style={styles.widgetBrandRow}>
                        <View style={styles.logoBadge}>
                          <Text style={styles.logoBadgeText}>Q</Text>
                        </View>
                        <Text style={styles.widgetBrandTitle}>QUITCIA STREAK</Text>
                      </View>
                      <View style={styles.widgetLivePill}>
                        <View style={styles.livePulseDot} />
                        <Text style={styles.widgetLiveText}>LIVE</Text>
                      </View>
                    </View>

                    <View style={styles.widgetCenterTime}>
                      <View>
                        <Text style={styles.widgetBigDigits}>
                          {streakDays} <Text style={styles.widgetUnit}>DAYS</Text>
                        </Text>
                        <Text style={styles.widgetTimerSub}>
                          {String(streakTime.h).padStart(2, '0')}h {String(streakTime.m).padStart(2, '0')}m {String(streakTime.s).padStart(2, '0')}s
                        </Text>
                      </View>
                      <View style={styles.widgetFlameCircle}>
                        <AnimatedFlame size={32} hours={streakTime.h} />
                      </View>
                    </View>

                    <View style={styles.widgetBottomBar}>
                      <Text style={styles.widgetMotto}>Every minute rewires your brain</Text>
                      <View style={styles.widgetActiveBadge}>
                        <Shield size={12} color="#2DD4BF" />
                        <Text style={styles.widgetActiveBadgeText}>Discipline ON</Text>
                      </View>
                    </View>
                  </LinearGradient>
                )}

                {widgetStyle === 'minimal' && (
                  <View style={[styles.mediumWidgetCard, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border }]}>
                    <View style={styles.widgetTopRow}>
                      <Text style={[styles.minimalBrand, { color: colors.foreground }]}>QUITCIA</Text>
                      <Text style={[styles.minimalStreak, { color: '#0D9488' }]}>CLEAN STREAK</Text>
                    </View>
                    <View style={styles.widgetCenterTime}>
                      <Text style={[styles.minimalBigDigits, { color: colors.foreground }]}>
                        {streakDays}d {streakTime.h}h {streakTime.m}m
                      </Text>
                      <Flame size={28} color="#F97316" fill="#F97316" />
                    </View>
                    <Text style={[styles.minimalHint, { color: colors.mutedForeground }]}>
                      Hold the line. Urge will pass.
                    </Text>
                  </View>
                )}

                {widgetStyle === 'matrix' && (
                  <View style={[styles.mediumWidgetCard, { backgroundColor: '#050D0A', borderWidth: 2, borderColor: '#064E3B' }]}>
                    <View style={styles.widgetTopRow}>
                      <Text style={{ color: '#34D399', fontWeight: '900', fontSize: 11, letterSpacing: 1.5 }}>
                        NEO // STREAK
                      </Text>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>[ONLINE]</Text>
                    </View>
                    <View style={styles.widgetCenterTime}>
                      <Text style={{ color: '#34D399', fontSize: 26, fontWeight: '900', fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }) }}>
                        {streakDays}D : {streakTime.h}H : {streakTime.m}M
                      </Text>
                      <Zap size={24} color="#34D399" />
                    </View>
                    <Text style={{ color: '#059669', fontSize: 11, fontWeight: '700' }}>
                      &gt; Reality unbroken. Red pill active.
                    </Text>
                  </View>
                )}

                {/* Small Widget (2x2) */}
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 20 }]}>
                  SMALL WIDGET (2×2)
                </Text>

                <View style={styles.smallWidgetsRow}>
                  <LinearGradient
                    colors={['#0F766E', '#0B132B']}
                    style={styles.smallWidgetCard}
                  >
                    <AnimatedFlame size={26} hours={streakTime.h} />
                    <Text style={styles.smallWidgetDigits}>{streakDays}</Text>
                    <Text style={styles.smallWidgetLabel}>DAYS CLEAN</Text>
                  </LinearGradient>

                  <View style={[styles.smallWidgetCard, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border }]}>
                    <View style={styles.smallWidgetTopIcon}>
                      <Shield size={20} color="#0D9488" />
                    </View>
                    <Text style={[styles.smallWidgetDigits, { color: colors.foreground }]}>{streakDays}d</Text>
                    <Text style={[styles.smallWidgetLabel, { color: colors.mutedForeground }]}>Quitcia Shield</Text>
                  </View>
                </View>

                {/* Share Button */}
                <Pressable
                  onPress={handleShare}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { backgroundColor: colors.foreground },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  {copied ? <Check size={18} color={colors.background} /> : <Share2 size={18} color={colors.background} />}
                  <Text style={[styles.actionButtonText, { color: colors.background }]}>
                    {copied ? 'Streak Copied!' : 'Share Streak Card'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.guideContainer}>
                <View style={[styles.guideStep, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                      {Platform.OS === 'ios' ? 'iOS Home Screen Widget' : 'Android Home Screen Widget'}
                    </Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      {Platform.OS === 'ios'
                        ? '1. Go to Home Screen.\n2. Long-press empty background until apps jiggle.\n3. Tap (+) top-left corner.\n4. Search Quitcia and select your widget.'
                        : '1. Touch and hold any empty space on Home Screen.\n2. Tap "Widgets".\n3. Locate Quitcia.\n4. Drag widget onto your screen.'}
                    </Text>
                  </View>
                </View>

                <View style={[styles.guideStep, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: colors.foreground }]}>Lock Screen Glance</Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      Keep your clean days visible without unlocking. Glancing at your clean time reduces craving impulses by 40%.
                    </Text>
                  </View>
                </View>

                <View style={[styles.guideStep, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: colors.foreground }]}>Instant Grounding</Text>
                    <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                      Tapping the widget launches Guided Audio or Panic Mode immediately to center you within seconds.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      <ThemedAlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        steps={alertConfig.steps}
        icon={alertConfig.icon}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 2,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  widgetIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  directAddWrap: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  directAddBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  directAddGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  directAddBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  segmentTrack: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  styleSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  styleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  styleChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  soonBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
  },
  soonBadgeText: {
    color: '#D97706',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  mediumWidgetCard: {
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    minHeight: 146,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  widgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  widgetBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#0B132B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#2DD4BF',
    fontSize: 12,
    fontWeight: '900',
  },
  widgetBrandTitle: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  widgetLivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2DD4BF',
  },
  widgetLiveText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  widgetCenterTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  widgetBigDigits: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  widgetUnit: {
    fontSize: 14,
    color: '#99F6E4',
    fontWeight: '800',
  },
  widgetTimerSub: {
    color: '#E6FFFA',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  widgetFlameCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetBottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
  },
  widgetMotto: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  widgetActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  widgetActiveBadgeText: {
    color: '#2DD4BF',
    fontSize: 10,
    fontWeight: '800',
  },
  minimalBrand: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  minimalStreak: {
    fontSize: 11,
    fontWeight: '900',
  },
  minimalBigDigits: {
    fontSize: 26,
    fontWeight: '900',
  },
  minimalHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  smallWidgetsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  smallWidgetCard: {
    flex: 1,
    height: 128,
    borderRadius: 22,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  smallWidgetDigits: {
    color: 'white',
    fontSize: 28,
    fontWeight: '900',
  },
  smallWidgetLabel: {
    color: '#CCFBF1',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  smallWidgetTopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 18,
    marginTop: 20,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  guideContainer: {
    gap: 12,
    marginTop: 4,
  },
  guideStep: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  stepNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
});
