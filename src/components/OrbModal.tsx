import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import { X, Headphones } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface OrbModalProps {
  visible: boolean;
  onClose: () => void;
  onGoToAudio: () => void;
}

export const OrbModal: React.FC<OrbModalProps> = ({ visible, onClose, onGoToAudio }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.3,
          duration: 3800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 3800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const timer = setTimeout(() => {
      onGoToAudio();
    }, 7000);

    return () => {
      pulse.stop();
      clearTimeout(timer);
    };
  }, [visible, scale, onGoToAudio]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <LinearGradient colors={['#070D1B', '#0B132B', '#0F172A']} style={styles.container}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X size={20} color="#94A3B8" />
        </Pressable>

        <View style={styles.content}>
          {/* Animated Glow Aura */}
          <Animated.View style={[styles.glowOrb, { transform: [{ scale }] }]}>
            <LinearGradient colors={['#0D9488', '#2DD4BF']} style={styles.glowInner} />
          </Animated.View>

          {/* Animated Main Pulse Orb */}
          <Animated.View style={[styles.mainOrb, { transform: [{ scale }] }]}>
            <LinearGradient colors={['#0D9488', '#14B8A6']} style={styles.orbInner}>
              <Headphones size={42} color="white" strokeWidth={2.2} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.phaseLabel}>Breathe & Center</Text>
          <Text style={styles.text}>Pause for a moment. Just listen.</Text>
          <Text style={styles.subText}>Urges peak and inevitably fade. Stay with the calm.</Text>

          <Pressable onPress={onGoToAudio} style={styles.actionBtn}>
            <Headphones size={18} color="white" />
            <Text style={styles.actionBtnText}>Go to Guided Audio</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glowOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.25,
    top: -20,
  },
  glowInner: {
    width: '100%',
    height: '100%',
    borderRadius: 125,
  },
  mainOrb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    elevation: 16,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 28,
    borderWidth: 2,
    borderColor: '#2DD4BF',
    overflow: 'hidden',
  },
  orbInner: {
    width: '100%',
    height: '100%',
    borderRadius: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    marginTop: 48,
    fontSize: 12,
    fontWeight: '900',
    color: '#2DD4BF',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  text: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
  },
  subText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 32,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 20,
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});
