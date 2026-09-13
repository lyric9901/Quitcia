import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Linking } from 'react-native';
import { X } from 'lucide-react-native';
import { useAppTheme } from '../theme';

interface FeedbackScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();

  if (!visible) return null;

  const handleShareFeedback = () => {
    Linking.openURL('https://urgerelieffeedback.carrd.co/').catch(() => {});
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <X size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Thanks for being{'\n'}with us
          </Text>

          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            Please take a short time to share your feedbacks, like where the audio failed, helped and anything you want to share with us. This helps us improve our services.
          </Text>

          <Pressable onPress={handleShareFeedback} style={[styles.shareBtn, { backgroundColor: colors.foreground }]}>
            <Text style={[styles.shareBtnText, { color: colors.background }]}>Share feedback</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  closeBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 36,
  },
  shareBtn: {
    width: '100%',
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
