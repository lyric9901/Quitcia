import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useAppTheme } from '../theme';
import { saveUserProfile } from '../lib/localStore';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const { colors } = useAppTheme();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    q5_usedOtherTools: '',
    q6_toolFeedback: '',
  });

  const totalSteps = 6;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    saveUserProfile({
      name: formData.name,
      age: formData.age,
      q1: formData.q1,
      q2: formData.q2,
      q3: formData.q3,
      q4: formData.q4,
      q5_usedOtherTools: formData.q5_usedOtherTools,
      q6_toolFeedback: formData.q6_toolFeedback,
    });
    setIsSubmitting(false);
    onComplete();
  };

  const OptionCard = ({
    label,
    field,
    currentValue,
  }: {
    label: string;
    field: 'q1' | 'q2' | 'q3' | 'q4' | 'q5_usedOtherTools';
    currentValue: string;
  }) => {
    const isSelected = currentValue === label;
    return (
      <Pressable
        onPress={() => setFormData({ ...formData, [field]: label })}
        style={[
          styles.optionCard,
          { borderColor: colors.border, backgroundColor: colors.card },
          isSelected && { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
        ]}
      >
        <Text
          style={[
            styles.optionText,
            { color: colors.foreground },
            isSelected && { color: '#1D4ED8', fontWeight: '700' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  const canContinue = () => {
    if (step === 1) return Boolean(formData.name.trim() && formData.age.trim());
    if (step === 2) return Boolean(formData.q1);
    if (step === 3) return Boolean(formData.q2);
    if (step === 4) return Boolean(formData.q3);
    if (step === 5) return Boolean(formData.q4);
    if (step === 6) {
      if (!formData.q5_usedOtherTools) return false;
      if (formData.q5_usedOtherTools === 'Yes' && !formData.q6_toolFeedback.trim()) return false;
      return true;
    }
    return false;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator Header */}
        <View style={styles.topHeader}>
          {step > 1 ? (
            <Pressable onPress={handleBack} style={styles.backBtn}>
              <ArrowLeft size={16} color={colors.mutedForeground} />
              <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <Text style={[styles.stepText, { color: colors.mutedForeground }]}>
            STEP {step} OF {totalSteps}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${((step - 1) / totalSteps) * 100}%` }]} />
        </View>

        {/* Form Body */}
        <View style={styles.body}>
          {step === 1 && (
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>Let's get to know you.</Text>
              <Text style={[styles.subheading, { color: colors.mutedForeground }]}>This helps us personalize your experience.</Text>

              <Text style={[styles.label, { color: colors.foreground }]}>What should we call you?</Text>
              <TextInput
                value={formData.name}
                onChangeText={(name) => setFormData({ ...formData, name })}
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>How old are you?</Text>
              <TextInput
                value={formData.age}
                onChangeText={(age) => setFormData({ ...formData, age })}
                placeholder="Age"
                keyboardType="number-pad"
                placeholderTextColor="#94A3B8"
                style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                How long have you been dealing with this behavior?
              </Text>
              <View style={styles.optionsList}>
                <OptionCard field="q1" currentValue={formData.q1} label="Under 1 year" />
                <OptionCard field="q1" currentValue={formData.q1} label="1-3 years" />
                <OptionCard field="q1" currentValue={formData.q1} label="3-5 years" />
                <OptionCard field="q1" currentValue={formData.q1} label="5+ years" />
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                How do you currently handle urges?
              </Text>
              <View style={styles.optionsList}>
                <OptionCard field="q2" currentValue={formData.q2} label="Physical activity" />
                <OptionCard field="q2" currentValue={formData.q2} label="Digital distraction" />
                <OptionCard field="q2" currentValue={formData.q2} label="Mindfulness" />
                <OptionCard field="q2" currentValue={formData.q2} label="Willpower alone" />
              </View>
            </View>
          )}

          {step === 4 && (
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                How well does that usually work for you?
              </Text>
              <View style={styles.optionsList}>
                <OptionCard field="q3" currentValue={formData.q3} label="Works perfectly" />
                <OptionCard field="q3" currentValue={formData.q3} label="Helps for a while" />
                <OptionCard field="q3" currentValue={formData.q3} label="Just a distraction" />
                <OptionCard field="q3" currentValue={formData.q3} label="Rarely works" />
              </View>
            </View>
          )}

          {step === 5 && (
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                What is your main reason for quitting?
              </Text>
              <View style={styles.optionsList}>
                <OptionCard field="q4" currentValue={formData.q4} label="Damaging my relationship" />
                <OptionCard field="q4" currentValue={formData.q4} label="Losing self control" />
                <OptionCard field="q4" currentValue={formData.q4} label="Affecting my productivity" />
                <OptionCard field="q4" currentValue={formData.q4} label="Other" />
              </View>
            </View>
          )}

          {step === 6 && (
            <View>
              <Text style={[styles.heading, { color: colors.foreground }]}>
                Have you used other tools to help with this before?
              </Text>
              <View style={styles.optionsList}>
                <OptionCard field="q5_usedOtherTools" currentValue={formData.q5_usedOtherTools} label="Yes" />
                <OptionCard field="q5_usedOtherTools" currentValue={formData.q5_usedOtherTools} label="No" />
              </View>

              {formData.q5_usedOtherTools === 'Yes' && (
                <View style={{ marginTop: 16 }}>
                  <Text style={[styles.label, { color: colors.foreground }]}>
                    What made other tools feel like they didn't get you?
                  </Text>
                  <TextInput
                    value={formData.q6_toolFeedback}
                    onChangeText={(q6_toolFeedback) => setFormData({ ...formData, q6_toolFeedback })}
                    multiline
                    placeholder="Type your thoughts..."
                    placeholderTextColor="#94A3B8"
                    style={[styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
          {step < totalSteps ? (
            <Pressable
              disabled={!canContinue()}
              onPress={handleNext}
              style={[
                styles.continueBtn,
                !canContinue() && styles.disabledBtn,
              ]}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={!canContinue() || isSubmitting}
              onPress={handleSubmit}
              style={[
                styles.submitBtn,
                (!canContinue() || isSubmitting) && styles.disabledBtn,
              ]}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Building Profile...' : 'Complete Setup'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  body: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    lineHeight: 30,
  },
  subheading: {
    fontSize: 14,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 14,
    borderWidth: 2,
    padding: 14,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  optionsList: {
    gap: 10,
    marginTop: 16,
  },
  optionCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
  },
  continueBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.4,
  },
});
