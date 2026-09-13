import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Play, Pause, X, RotateCcw, AlertCircle, Headphones } from 'lucide-react-native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Asset } from 'expo-asset';
import { addAudioSession, getItemSync, setItemSync } from '../lib/localStore';

interface AudioScreenProps {
  onNavigate: (route: string) => void;
}

const AUDIO_TRACK_FILES = [
  require('../../assets/audio/track1.mp3'),
  require('../../assets/audio/track2.mp3'),
  require('../../assets/audio/track3.mp3'),
  require('../../assets/audio/track4.mp3'),
];

const PHASE_1_TEXTS = [
  "Pause for a moment. Just listen.",
  "Stay here with me for a minute.",
  "Nothing needs to happen right now.",
  "Let this moment slow down.",
  "Take one steady breath and stay here.",
  "You're safe to pause for a moment.",
  "Just press play and stay present.",
  "Let the urge sit without reacting.",
  "Give yourself this small pause.",
  "Stay here. The intensity will pass.",
];

const PHASE_2_TEXTS = [
  "You're doing well. Keep staying here.",
  "The urge is already changing.",
  "Just keep breathing and listening.",
  "Notice how the intensity shifts.",
  "Stay steady for a few more breaths.",
  "You're riding out the wave.",
  "Each moment you wait weakens it.",
  "Let your mind settle naturally.",
  "You're handling this moment.",
  "Stay with the calm you're building.",
];

const PHASE_3_TEXTS = [
  "You're almost through the wave.",
  "The moment is passing now.",
  "Take one more calm breath.",
  "You stayed through the hardest part.",
  "Notice how the urge has softened.",
  "This pause helped you regain control.",
  "Stay calm for a few more seconds.",
  "You're finishing strong.",
  "The intensity has passed.",
  "Take this calm with you.",
];

export const AudioScreen: React.FC<AudioScreenProps> = ({ onNavigate }) => {
  const [trackIdx] = useState<number>(() => {
    try {
      const storedIndex = getItemSync('cycleIndex');
      const index = storedIndex ? parseInt(storedIndex, 10) : 0;
      const valid = isNaN(index) ? 0 : index % AUDIO_TRACK_FILES.length;
      setItemSync('cycleIndex', ((valid + 1) % AUDIO_TRACK_FILES.length).toString());
      return valid;
    } catch {
      return 0;
    }
  });

  // Direct source initialization without downloadFirst so player loads immediately
  const player = useAudioPlayer(AUDIO_TRACK_FILES[trackIdx], {
    updateInterval: 500,
  });
  const status = useAudioPlayerStatus(player);

  const [displayText, setDisplayText] = useState<string>(PHASE_1_TEXTS[0]);
  const [logged26s, setLogged26s] = useState(false);
  const [logged30s, setLogged30s] = useState(false);
  const [logged60s, setLogged60s] = useState(false);
  const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
  const hasAutoPlayedRef = useRef(false);

  // Preload local audio assets into cache
  useEffect(() => {
    Asset.loadAsync(AUDIO_TRACK_FILES).catch((e) => console.log('Audio asset preload:', e));
  }, []);

  // Configure background and silent mode audio session
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch((err) => console.warn('setAudioModeAsync error:', err));

    setDisplayText(PHASE_1_TEXTS[Math.floor(Math.random() * PHASE_1_TEXTS.length)]);
  }, []);

  // Reliable Auto-play when player becomes loaded
  useEffect(() => {
    if (status.isLoaded && !status.playing && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      try {
        player.play();
        setHasStartedPlaying(true);
      } catch (err) {
        console.warn('Autoplay error:', err);
      }
    }
  }, [status.isLoaded, status.playing, player]);

  // Track playback status updates
  useEffect(() => {
    if (status.playing && !hasStartedPlaying) {
      setHasStartedPlaying(true);
    }

    const current = status.currentTime;

    if (current < 45) {
      // Phase 1
    } else if (current >= 45 && current < 95) {
      setDisplayText((prev) => (PHASE_2_TEXTS.includes(prev) ? prev : PHASE_2_TEXTS[Math.floor(Math.random() * PHASE_2_TEXTS.length)]));
    } else if (current >= 95) {
      setDisplayText((prev) => (PHASE_3_TEXTS.includes(prev) ? prev : PHASE_3_TEXTS[Math.floor(Math.random() * PHASE_3_TEXTS.length)]));
    }

    if (current >= 26 && !logged26s) {
      setLogged26s(true);
      setItemSync('lastAudioCompletionTime', Date.now().toString());
    }

    if (current >= 30 && !logged30s) {
      setLogged30s(true);
      addAudioSession({ timestamp: new Date().toISOString(), duration: 30, type: 'SWM_milestone_30s' });
    }

    if (current >= 60 && !logged60s) {
      setLogged60s(true);
      addAudioSession({ timestamp: new Date().toISOString(), duration: 60, type: 'SWM_milestone_60s' });
    }

    if (status.didJustFinish) {
      addAudioSession({
        timestamp: new Date().toISOString(),
        duration: Math.floor(status.duration || 0),
        type: 'completed',
      });
      onNavigate('dashboard');
    }
  }, [status.currentTime, status.didJustFinish, status.playing, logged26s, logged30s, logged60s, status.duration, onNavigate, hasStartedPlaying]);

  const togglePlay = () => {
    try {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
        setHasStartedPlaying(true);
      }
    } catch (e) {
      console.warn('Audio play/pause error:', e);
    }
  };

  const handleRetry = () => {
    try {
      player.replace(AUDIO_TRACK_FILES[trackIdx]);
      player.play();
    } catch (e) {
      console.warn('Retry error:', e);
    }
  };

  const handleExit = () => {
    try {
      player.pause();
    } catch {}
    const current = Math.floor(status.currentTime || 0);
    addAudioSession({
      timestamp: new Date().toISOString(),
      duration: current,
      type: 'dropped',
    });
    onNavigate('dashboard');
  };

  const pct = status.duration ? Math.min(100, (100 * status.currentTime) / status.duration) : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  const m = Math.floor(status.currentTime / 60);
  const s = Math.floor(status.currentTime % 60);
  const timeStr = `${m}:${s < 10 ? '0' : ''}${s}`;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.trackBadge}>
          <Headphones size={13} color="#2DD4BF" />
          <Text style={styles.trackBadgeText}>Audio Track {trackIdx + 1}</Text>
        </View>

        <Pressable onPress={handleExit} style={styles.closeBtn} hitSlop={12}>
          <X size={20} color="#94A3B8" />
        </Pressable>
      </View>

      <View style={styles.centerContent}>
        {/* Progress Ring */}
        <View style={styles.ringWrap}>
          <Svg width="280" height="280" viewBox="0 0 280 280">
            {/* Background Track Circle */}
            <Circle
              cx="140"
              cy="140"
              r={radius}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Active Progress Circle */}
            <Circle
              cx="140"
              cy="140"
              r={radius}
              stroke="#0D9488"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 140 140)"
            />
          </Svg>

          <View style={styles.playCenter}>
            {/* Play/Pause Button */}
            <Pressable onPress={togglePlay} style={styles.playBtn}>
              {status.isBuffering ? (
                <ActivityIndicator size="large" color="#FFFFFF" />
              ) : status.playing ? (
                <Pause size={34} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={34} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            {/* Time Elapsed Badge */}
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{timeStr}</Text>
            </View>
          </View>
        </View>

        {/* Playback Error / Buffering notice */}
        {Boolean(status.error) && (
          <Pressable onPress={handleRetry} style={styles.errorBanner}>
            <AlertCircle size={15} color="#F43F5E" />
            <Text style={styles.errorText}>Playback error. Tap to reload.</Text>
            <RotateCcw size={14} color="#F43F5E" />
          </Pressable>
        )}

        {/* Phase Guidance Text */}
        <View style={styles.textWrap}>
          <Text style={styles.phraseText}>{displayText}</Text>
          <Text style={styles.subtext}>Stay with the sound. The urge will pass.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D1B', // Deep dark Quitcia background
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    position: 'absolute',
    top: 50,
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  trackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackBadgeText: {
    color: '#2DD4BF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  ringWrap: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  playCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: '#2DD4BF',
  },
  timeBadge: {
    marginTop: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2DD4BF',
    letterSpacing: 1,
  },
  errorBanner: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  errorText: {
    color: '#F43F5E',
    fontSize: 13,
    fontWeight: '700',
  },
  textWrap: {
    marginTop: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  phraseText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 28,
  },
  subtext: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
});
