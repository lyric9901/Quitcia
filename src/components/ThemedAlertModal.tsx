import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Info, AlertTriangle, Smartphone, Sparkles, CheckCircle2, X } from 'lucide-react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ThemedAlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  steps?: string[];
  icon?: 'info' | 'alert' | 'widget' | 'sparkles' | 'check';
  buttons?: AlertButton[];
  onClose: () => void;
}

export const ThemedAlertModal: React.FC<ThemedAlertModalProps> = ({
  visible,
  title,
  message,
  steps,
  icon = 'info',
  buttons = [{ text: 'Got it!', style: 'default' }],
  onClose,
}) => {
  if (!visible) return null;

  const renderIcon = () => {
    switch (icon) {
      case 'alert':
        return (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <AlertTriangle size={24} color="#EF4444" />
          </View>
        );
      case 'widget':
        return (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(13, 148, 136, 0.15)' }]}>
            <Smartphone size={24} color="#0D9488" />
          </View>
        );
      case 'sparkles':
        return (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
            <Sparkles size={24} color="#818CF8" />
          </View>
        );
      case 'check':
        return (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <CheckCircle2 size={24} color="#10B981" />
          </View>
        );
      case 'info':
      default:
        return (
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(13, 148, 136, 0.15)' }]}>
            <Info size={24} color="#0D9488" />
          </View>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Close button */}
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <X size={18} color="#94A3B8" />
          </Pressable>

          {/* Icon Header */}
          <View style={styles.header}>
            {renderIcon()}
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Message */}
          {Boolean(message) && <Text style={styles.message}>{message}</Text>}

          {/* Optional Steps List */}
          {steps && steps.length > 0 && (
            <View style={styles.stepsContainer}>
              {steps.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              return (
                <Pressable
                  key={idx}
                  onPress={() => {
                    if (btn.onPress) {
                      btn.onPress();
                    } else {
                      onClose();
                    }
                  }}
                  style={({ pressed }) => [
                    styles.btn,
                    isCancel && styles.btnCancel,
                    isDestructive && styles.btnDestructive,
                    !isCancel && !isDestructive && styles.btnPrimary,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isCancel && styles.btnCancelText,
                      isDestructive && styles.btnDestructiveText,
                      !isCancel && !isDestructive && styles.btnPrimaryText,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0F172A',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#1E293B',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 6,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  stepsContainer: {
    backgroundColor: '#070D1B',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#2DD4BF',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnCancel: {
    backgroundColor: '#1E293B',
  },
  btnDestructive: {
    backgroundColor: '#EF4444',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
  },
  btnCancelText: {
    color: '#94A3B8',
  },
  btnDestructiveText: {
    color: '#FFFFFF',
  },
});
