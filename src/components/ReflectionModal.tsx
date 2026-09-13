import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../theme';
import { addReflectionLog } from '../lib/localStore';

interface ReflectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const [step, setStep] = useState<1 | 2>(1);
  const [intensity, setIntensity] = useState<number>(3);
  const [resolution, setResolution] = useState<string | null>(null);

  const handleClose = () => {
    setStep(1);
    setIntensity(3);
    setResolution(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!resolution) return;
    addReflectionLog({
      timestamp: new Date().toISOString(),
      intensity,
      resolution,
    });
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card }]}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <X size={20} color={colors.mutedForeground} />
          </Pressable>

          {step === 1 ? (
            <View style={styles.stepContainer}>
              <Text style={[styles.title, { color: colors.foreground }]}>How is your urge now?</Text>
              
              <View style={styles.scoreRow}>
                {[1, 2, 3, 4, 5].map((score) => (
                  <Pressable
                    key={score}
                    onPress={() => setIntensity(score)}
                    style={[
                      styles.scoreChip,
                      { backgroundColor: colors.muted },
                      intensity === score && { backgroundColor: colors.accent },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreChipText,
                        { color: colors.foreground },
                        intensity === score && { color: 'white', fontWeight: '900' },
                      ]}
                    >
                      {score}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.intensityDisplay, { color: colors.accent }]}>{intensity}</Text>

              <Pressable onPress={() => setStep(2)} style={[styles.primaryBtn, { backgroundColor: colors.accent }]}>
                <Text style={styles.primaryBtnText}>Next</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stepContainer}>
              <Text style={[styles.title, { color: colors.foreground }]}>How did the urge end?</Text>

              <View style={styles.optionColumn}>
                <Pressable
                  onPress={() => setResolution('Starting fresh')}
                  style={[
                    styles.optionBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    resolution === 'Starting fresh' && { borderColor: colors.accent, backgroundColor: `${colors.accent}15` },
                  ]}
                >
                  <Text style={[styles.optionBtnText, { color: colors.foreground }, resolution === 'Starting fresh' && { color: colors.accent }]}>
                    Starting fresh
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setResolution('Going good')}
                  style={[
                    styles.optionBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    resolution === 'Going good' && { borderColor: colors.accent, backgroundColor: `${colors.accent}15` },
                  ]}
                >
                  <Text style={[styles.optionBtnText, { color: colors.foreground }, resolution === 'Going good' && { color: colors.accent }]}>
                    Going good
                  </Text>
                </Pressable>
              </View>

              <Pressable
                disabled={!resolution}
                onPress={handleSubmit}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.foreground },
                  !resolution && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.primaryBtnText}>Submit</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  stepContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  scoreChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreChipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  intensityDisplay: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 24,
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  optionColumn: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  optionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
