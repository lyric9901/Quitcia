import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  name: string;
  age: string;
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  q5_usedOtherTools?: string;
  q6_toolFeedback?: string;
  createdAt: string;
}

export interface RelapseLog {
  timestamp: string;
  streakLost: string;
  reason: string;
}

export interface AudioSessionLog {
  timestamp: string;
  duration: number;
  type: string;
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface PanicSession {
  id: number;
  timestamp: string;
  urgeBefore: number;
  urgeAfter: number;
  improvement: number;
  completedEscapes: string[];
  tasksCompleted: number;
  completed: boolean;
}

export interface ReflectionLog {
  timestamp: string;
  intensity: number;
  resolution: string;
}

const PROFILE_KEY = 'urge_relief_profile';
const RESET_KEY = 'streak_last_reset';
const RELAPSE_KEY = 'relapse_logs';
const URGES_KEY = 'urges_logs';
const AUDIO_KEY = 'audio_sessions_logs';
const TASK_DATE_KEY = 'taskDate';
const DAILY_TASKS_KEY = 'dailyTasks';
const PANIC_SESSIONS_KEY = 'panic_sessions';
const FLAPPY_HIGHSCORE_KEY = 'flappy_highscore';
const TRUSTED_CONTACT_KEY = 'panic_trusted_contact';
const REFLECTIONS_KEY = 'reflections_logs';
const AUDIO_CYCLE_KEY = 'audioCycle';
const CYCLE_INDEX_KEY = 'cycleIndex';
const LAST_PLAYED_TRACK_KEY = 'lastPlayedTrack';
const LAST_AUDIO_COMPLETION_TIME_KEY = 'lastAudioCompletionTime';
const THEME_KEY = 'theme_mode';
const USER_GEMS_KEY = 'user_gems';

// In-memory cache for synchronous reads after initial load
const cache: Record<string, string | null> = {};

export async function initLocalStorage(): Promise<void> {
  try {
    const keys = [
      PROFILE_KEY, RESET_KEY, RELAPSE_KEY, URGES_KEY, AUDIO_KEY,
      TASK_DATE_KEY, DAILY_TASKS_KEY, PANIC_SESSIONS_KEY, FLAPPY_HIGHSCORE_KEY,
      TRUSTED_CONTACT_KEY, REFLECTIONS_KEY, AUDIO_CYCLE_KEY, CYCLE_INDEX_KEY,
      LAST_PLAYED_TRACK_KEY, LAST_AUDIO_COMPLETION_TIME_KEY, THEME_KEY,
      USER_GEMS_KEY
    ];
    const items = await AsyncStorage.multiGet(keys);
    items.forEach(([key, val]) => {
      cache[key] = val;
    });

    if (!cache[RESET_KEY]) {
      const now = Date.now().toString();
      cache[RESET_KEY] = now;
      await AsyncStorage.setItem(RESET_KEY, now);
    }
  } catch (e) {
    console.error('Error initializing local storage cache:', e);
  }
}

export const getItemSync = (key: string): string | null => {
  return cache[key] ?? null;
};

export const setItemSync = (key: string, val: string): void => {
  cache[key] = val;
  AsyncStorage.setItem(key, val).catch(() => {});
};

export const removeItemSync = (key: string): void => {
  delete cache[key];
  AsyncStorage.removeItem(key).catch(() => {});
};

// USER PROFILE
export const getUserProfile = (): UserProfile | null => {
  const data = getItemSync(PROFILE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveUserProfile = (profile: Partial<UserProfile>): UserProfile => {
  const existing = getUserProfile() || {
    name: 'User',
    age: '25',
    createdAt: new Date().toISOString(),
  };
  const updated: UserProfile = { ...existing, ...profile };
  setItemSync(PROFILE_KEY, JSON.stringify(updated));
  return updated;
};

// STREAK
export const getStreakLastReset = (): number => {
  const stored = getItemSync(RESET_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!isNaN(parsed)) return parsed;
  }
  const now = Date.now();
  setItemSync(RESET_KEY, now.toString());
  return now;
};

export const setStreakLastReset = (timestamp: number): void => {
  setItemSync(RESET_KEY, timestamp.toString());
};

// RELAPSES
export const getRelapseLogs = (): RelapseLog[] => {
  const raw = getItemSync(RELAPSE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addRelapseLog = (log: RelapseLog): void => {
  const existing = getRelapseLogs();
  existing.push(log);
  setItemSync(RELAPSE_KEY, JSON.stringify(existing));
  setStreakLastReset(Date.now());
};

// URGES
export const getUrgesLogs = (): string[] => {
  const raw = getItemSync(URGES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addUrgeLog = (): void => {
  const existing = getUrgesLogs();
  existing.push(new Date().toISOString());
  setItemSync(URGES_KEY, JSON.stringify(existing));
};

// AUDIO SESSIONS
export const getAudioSessions = (): AudioSessionLog[] => {
  const raw = getItemSync(AUDIO_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addAudioSession = (session: AudioSessionLog): void => {
  const existing = getAudioSessions();
  existing.push(session);
  setItemSync(AUDIO_KEY, JSON.stringify(existing));
};

// DAILY TASKS
export const TASKS = [
  "Drink a full glass of water",
  "Write down 3 things you're grateful for",
  "Do a 5-minute full-body stretch",
  "Read one chapter of a book",
  "Tidy your room for 10 minutes",
  "15-min walk without your phone",
  "Sit in silence for 5 minutes",
  "Send a kind message to a friend",
  "Listen to your favorite song",
  "Do 15 pushups or squats",
  "No social media for 2 hours",
  "Eat a piece of fresh fruit",
  "Journal your thoughts for 5 mins",
  "Splash cold water on your face",
  "Plan 3 goals for tomorrow",
  "Watch an educational video",
  "Practice a hobby for 20 mins",
  "Take 10 deep breaths outside",
  "Give yourself a compliment",
  "Visualize who you are becoming",
];

export const getDailyTasks = (): Task[] => {
  try {
    const storedDate = getItemSync(TASK_DATE_KEY);
    const todayStr = new Date().toDateString();

    if (storedDate !== todayStr) {
      const shuffled = [...TASKS].sort(() => 0.5 - Math.random());
      const selected = shuffled
        .slice(0, 3)
        .map((text, idx) => ({ id: idx, text, completed: false }));
      setItemSync(TASK_DATE_KEY, todayStr);
      setItemSync(DAILY_TASKS_KEY, JSON.stringify(selected));
      return selected;
    }

    const storedTasks = getItemSync(DAILY_TASKS_KEY);
    return storedTasks ? JSON.parse(storedTasks) : [];
  } catch {
    return [];
  }
};

export const setDailyTasks = (tasks: Task[]): void => {
  setItemSync(DAILY_TASKS_KEY, JSON.stringify(tasks));
  setItemSync(TASK_DATE_KEY, new Date().toDateString());
};

// PANIC SESSIONS
export const getPanicSessions = (): PanicSession[] => {
  const raw = getItemSync(PANIC_SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addPanicSession = (session: PanicSession): void => {
  const existing = getPanicSessions();
  existing.push(session);
  setItemSync(PANIC_SESSIONS_KEY, JSON.stringify(existing));
};

// REFLECTIONS
export const getReflectionsLogs = (): ReflectionLog[] => {
  const raw = getItemSync(REFLECTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addReflectionLog = (log: ReflectionLog): void => {
  const existing = getReflectionsLogs();
  existing.push(log);
  setItemSync(REFLECTIONS_KEY, JSON.stringify(existing));
};

// GEMS REWARD STORE
export const getUserGems = (): number => {
  const raw = getItemSync(USER_GEMS_KEY);
  if (!raw) return 0;
  const val = parseInt(raw, 10);
  return isNaN(val) ? 0 : val;
};

export const addGem = (amount = 1): number => {
  const current = getUserGems();
  const next = current + amount;
  setItemSync(USER_GEMS_KEY, next.toString());
  return next;
};

// CLEAR ALL
export const clearAllLocalData = (): void => {
  const keys = [
    PROFILE_KEY, RESET_KEY, RELAPSE_KEY, URGES_KEY, AUDIO_KEY,
    TASK_DATE_KEY, DAILY_TASKS_KEY, PANIC_SESSIONS_KEY, FLAPPY_HIGHSCORE_KEY,
    TRUSTED_CONTACT_KEY, REFLECTIONS_KEY, AUDIO_CYCLE_KEY, CYCLE_INDEX_KEY,
    LAST_PLAYED_TRACK_KEY, LAST_AUDIO_COMPLETION_TIME_KEY, USER_GEMS_KEY
  ];
  keys.forEach((k) => removeItemSync(k));
};

export const elapsedSeconds = (startTs: number, now = Date.now()): number => {
  return Math.max(0, Math.floor((now - startTs) / 1000));
};

export const formatStreakTime = (totalSecs: number) => {
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return { d, h, m, s };
};
