import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { useAppTheme } from '../theme';

interface TasksScreenProps {
  onNavigate: (route: string) => void;
}

const ALL_TASKS = [
  "Drink a full glass of water right now.",
  "Write down 3 things you are grateful for today.",
  "Do a 5-minute full-body stretch.",
  "Read one chapter of a book or an educational article.",
  "Tidy up your room or workspace for exactly 10 minutes.",
  "Go for a 15-minute walk outside without looking at your phone.",
  "Sit in silence and meditate for 5 minutes.",
  "Send a kind, unexpected message to a friend or family member.",
  "Listen to your favorite song with your eyes closed.",
  "Do 15 pushups, squats, or sit-ups.",
  "Disconnect from all social media for the next 2 hours.",
  "Eat a piece of fresh fruit or try a healthy snack.",
  "Journal your raw thoughts for 5 continuous minutes.",
  "Splash cold water on your face to reset your nervous system.",
  "Unsubscribe from 5 promotional emails cluttering your inbox.",
  "Plan your top 3 non-negotiable goals for tomorrow.",
  "Watch a short, inspiring TED Talk or educational video.",
  "Learn how to say 'Hello' and 'Thank you' in a new language.",
  "Practice a hobby you love for at least 20 minutes.",
  "Step outside and take 10 deep breaths of fresh air.",
  "Give yourself a genuine compliment in the mirror.",
  "Close your eyes and visualize the person you are working hard to become."
];

export const TasksScreen: React.FC<TasksScreenProps> = ({ onNavigate }) => {
  const { colors } = useAppTheme();
  const [currentTask, setCurrentTask] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    generateRandomTask();
  }, []);

  const generateRandomTask = () => {
    setIsCompleted(false);
    const randomIndex = Math.floor(Math.random() * ALL_TASKS.length);
    setCurrentTask(ALL_TASKS[randomIndex]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => onNavigate('dashboard')}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <ArrowLeft size={20} color={colors.mutedForeground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Your Daily Task</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Task Card Container */}
      <View style={styles.cardCenterWrap}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.checkCircleBg, { backgroundColor: `${colors.accent}15` }]}>
            <CheckCircle2 size={32} color={isCompleted ? '#10B981' : colors.accent} />
          </View>

          <Text style={[styles.taskText, { color: colors.foreground }]}>{currentTask}</Text>

          {!isCompleted ? (
            <View style={styles.actionsColumn}>
              <Pressable
                onPress={() => setIsCompleted(true)}
                style={[styles.didItBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.didItBtnText}>I Did It</Text>
              </Pressable>

              <Pressable
                onPress={generateRandomTask}
                style={[styles.pickAnotherBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <RefreshCw size={16} color={colors.foreground} />
                <Text style={[styles.pickAnotherBtnText, { color: colors.foreground }]}>Pick Another</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.completedBlock}>
              <Text style={styles.awesomeText}>Awesome job!</Text>
              <Pressable onPress={() => onNavigate('dashboard')}>
                <Text style={[styles.backDashboardText, { color: colors.mutedForeground }]}>
                  Back to Dashboard
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  checkCircleBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  taskText: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 24,
  },
  actionsColumn: {
    width: '100%',
    gap: 12,
  },
  didItBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  didItBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  pickAnotherBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pickAnotherBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  completedBlock: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  awesomeText: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  backDashboardText: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
