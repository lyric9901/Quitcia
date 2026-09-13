import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useAppTheme } from '../theme';

interface ResetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isSubmitting?: boolean;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const { colors } = useAppTheme();
  const [step, setStep] = useState<'confirm' | 'reason'>('confirm');
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setStep('confirm');
    setReason('');
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(reason.trim() || 'No reason provided');
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.card }]}>
          {step === 'confirm' ? (
            <>
              <View style={styles.headerRow}>
                <View style={styles.alertIconBg}>
                  <AlertTriangle size={22} color="#EF4444" />
                </View>
                <Text style={[styles.title, { color: colors.foreground }]}>Reset Streak?</Text>
              </View>

              <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
                Are you sure you want to reset your streak? This will set your counter back to{' '}
                <Text style={{ fontWeight: 'bold', color: colors.foreground }}>zero</Text>.
              </Text>

              <Text style={styles.subText}>
                You'll be asked for a reason in the next step. It's optional.
              </Text>

              <View style={styles.buttonRow}>
                <Pressable onPress={handleClose} disabled={isSubmitting} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.foreground }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => setStep('reason')} style={styles.dangerBtn}>
                  <Text style={styles.dangerText}>Yes, Continue</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.foreground, fontSize: 22 }]}>Relapse Log 💀</Text>
              <Text style={[styles.bodyText, { color: colors.mutedForeground, marginTop: 4 }]}>
                What made you relapse? <Text style={{ color: '#94A3B8' }}>(optional)</Text>
              </Text>

              <TextInput
                value={reason}
                onChangeText={setReason}
                multiline
                placeholder="Be honest with yourself... (you can skip this)"
                placeholderTextColor="#94A3B8"
                style={[styles.textArea, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              />

              <View style={styles.buttonRow}>
                <Pressable onPress={() => setStep('confirm')} disabled={isSubmitting} style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.foreground }]}>Back</Text>
                </Pressable>
                <Pressable onPress={handleSubmit} disabled={isSubmitting} style={styles.confirmResetBtn}>
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmResetText}>Reset Streak</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  subText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
    marginVertical: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  cancelText: {
    fontWeight: '700',
    fontSize: 14,
  },
  dangerBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EF4444',
  },
  dangerText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
  },
  confirmResetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#EF4444',
  },
  confirmResetText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 14,
  },
});
