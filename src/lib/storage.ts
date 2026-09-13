import AsyncStorage from '@react-native-async-storage/async-storage';

export type DailyTask = { id: string; title: string; minutes: number; completed: boolean };

export type Profile = {
  name: string;
  age: string;
  duration: string;
  coping: string;
  effectiveness: string;
  motivation: string;
  usedTools: string;
  feedback: string;
  createdAt: string;
};

export type Relapse = { at: string; reason: string };

export type AppData = {
  profile: Profile | null;
  streakStartedAt: number;
  taskDate: string;
  tasks: DailyTask[];
  urges: string[];
  relapses: Relapse[];
  audioSessions: string[];
};

const KEY = 'quitcia.native.v1';

const taskBank = [
  ['Drink a full glass of water', 1], ['Write three things you are grateful for', 3],
  ['Do a five-minute full-body stretch', 5], ['Read one chapter of a book', 12],
  ['Tidy your room for ten minutes', 10], ['Take a 15-minute walk without your phone', 15],
  ['Sit in silence for five minutes', 5], ['Send a kind message to a friend', 2],
  ['Do 15 pushups or squats', 3], ['Eat a piece of fresh fruit', 2],
  ['Journal your thoughts for five minutes', 5], ['Take ten deep breaths outside', 2],
] as const;

export const todayKey = () => new Date().toISOString().slice(0, 10);

const daySeed = (date: string) => [...date].reduce((total, char) => total * 31 + char.charCodeAt(0), 7);

export const buildTasks = (date: string): DailyTask[] => {
  const used = new Set<number>();
  let seed = daySeed(date);
  while (used.size < 3) {
    seed = (seed * 9301 + 49297) % 233280;
    used.add(seed % taskBank.length);
  }
  return [...used].map((index, position) => ({
    id: `${date}-${position}`,
    title: taskBank[index][0],
    minutes: taskBank[index][1],
    completed: false,
  }));
};

export const initialData = (): AppData => {
  const date = todayKey();
  return { profile: null, streakStartedAt: Date.now(), taskDate: date, tasks: buildTasks(date), urges: [], relapses: [], audioSessions: [] };
};

export async function loadData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const saved = raw ? JSON.parse(raw) as Partial<AppData> : null;
    const fallback = initialData();
    if (!saved) return fallback;
    const date = todayKey();
    return {
      ...fallback,
      ...saved,
      taskDate: saved.taskDate === date ? date : date,
      tasks: saved.taskDate === date && saved.tasks?.length ? saved.tasks : buildTasks(date),
      urges: saved.urges ?? [], relapses: saved.relapses ?? [], audioSessions: saved.audioSessions ?? [],
    };
  } catch {
    return initialData();
  }
}

export async function saveData(data: AppData) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function clearData() {
  await AsyncStorage.removeItem(KEY);
}

export const elapsed = (start: number, now = Date.now()) => Math.max(0, Math.floor((now - start) / 1000));

export const formatElapsed = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
};
