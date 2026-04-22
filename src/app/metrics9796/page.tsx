// @/app/admin/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { 
  Activity, Target, Hash, RefreshCw, Clock, TrendingDown, 
  Trash2, Database, ChevronDown, Headphones, Users, Calendar, Sun
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as BarCell,
  PieChart, Pie, Cell as PieCell, Legend, AreaChart, Area
} from 'recharts';

interface UserData {
  id: string;
  createdAt?: any;
}

interface ReflectionData {
  id: string;
  intensity: number;
  resolution: string;
  userId?: string;
}

interface AudioSessionData {
  id: string;
  status: string;
  timeListened: number;
  userId?: string;     // Required for frequency & retention tracking
  timestamp?: any;     // Required for time-based & retention tracking
  eventName?: string;  // e.g., 'audio_start'
}

const INTENSITY_COLORS = ['#38bdf8', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];
const RESOLUTION_COLORS = ['#f97316', '#10b981']; 
const FREQUENCY_COLORS = ['#94a3b8', '#38bdf8', '#8b5cf6'];
const TIME_BLOCK_COLORS = ['#fde047', '#fb923c', '#818cf8', '#312e81'];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [reflections, setReflections] = useState<ReflectionData[]>([]);
  const [audioSessions, setAudioSessions] = useState<AudioSessionData[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDataMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin@urgerelief99012") {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Incorrect password");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users (Needed to calculate 0-time usage)
      const userSnapshot = await getDocs(collection(db, "users"));
      const userData: UserData[] = [];
      userSnapshot.forEach((docSnap) => {
        userData.push({ id: docSnap.id, ...docSnap.data() } as UserData);
      });
      setUsers(userData);

      // 2. Fetch Reflections
      const refSnapshot = await getDocs(collection(db, "reflections"));
      const refData: ReflectionData[] = [];
      refSnapshot.forEach((docSnap) => {
        refData.push({ id: docSnap.id, ...docSnap.data() } as ReflectionData);
      });
      setReflections(refData);

      // 3. Fetch Audio Sessions
      const audioSnapshot = await getDocs(collection(db, "audio_sessions"));
      const audioData: AudioSessionData[] = [];
      audioSnapshot.forEach((docSnap) => {
        audioData.push({ id: docSnap.id, ...docSnap.data() } as AudioSessionData);
      });
      setAudioSessions(audioData);

    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const clearCollection = async (collectionName: "reflections" | "audio_sessions") => {
    const dataToClear = collectionName === "reflections" ? reflections : audioSessions;
    
    if (dataToClear.length === 0) {
      alert(`No data to delete in ${collectionName}.`);
      setShowDataMenu(false);
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ WARNING: Are you sure you want to permanently delete all ${dataToClear.length} records? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    setShowDataMenu(false);

    try {
      for (const item of dataToClear) {
        await deleteDoc(doc(db, collectionName, item.id));
      }
      alert(`Successfully deleted all records.`);
      await fetchData(); 
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
      alert("An error occurred while deleting the data.");
    }

    setIsDeleting(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <form onSubmit={handleLogin} className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-white w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <h1 className="text-3xl font-black mb-2 text-slate-800 tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 font-medium mb-8">Secure access to Urge Relief analytics.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 mb-6 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-medium transition-all"
          />
          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  // --- DATA PROCESSING ---

  // 1. Basic Stats
  const total = reflections.length;
  const intensityMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalIntensitySum = 0;
  let startingFresh = 0;
  let goingGood = 0;

  reflections.forEach(r => {
    if (r.intensity >= 1 && r.intensity <= 5) {
      intensityMap[r.intensity as keyof typeof intensityMap]++;
      totalIntensitySum += r.intensity;
    }
    if (r.resolution === "Starting fresh") startingFresh++;
    if (r.resolution === "Going good") goingGood++;
  });

  const totalAudioSessions = audioSessions.length;
  const droppedSessions = audioSessions.filter(s => s.status === "dropped");
  const dropoffRate = totalAudioSessions > 0 ? Math.round((droppedSessions.length / totalAudioSessions) * 100) : 0;
  const totalDropoffTime = droppedSessions.reduce((sum, s) => sum + (s.timeListened || 0), 0);
  const avgDropoffSeconds = droppedSessions.length > 0 ? Math.floor(totalDropoffTime / droppedSessions.length) : 0;
  
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  const avgDropoffTimeStr = droppedSessions.length > 0 ? formatTime(avgDropoffSeconds) : "0:00";
  const avgIntensity = total > 0 ? (totalIntensitySum / total).toFixed(1) : "0";

  // 2. ADVANCED METRICS: Audio Frequency, Time Distribution, and Retention
  
  // Helper to normalize dates for retention calculation (strips time)
  const getDayOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  const userAudioCounts: Record<string, number> = {};
  const userSessionsByDate: Record<string, Date[]> = {};
  const timeBlocks = { "Morning (6-12)": 0, "Afternoon (12-18)": 0, "Evening (18-24)": 0, "Night (0-6)": 0 };

  // Track all unique users (from users collection + fallback to session ids)
  const allKnownUserIds = new Set<string>();
  users.forEach(u => allKnownUserIds.add(u.id));

  audioSessions.forEach(session => {
    const uid = session.userId || "anonymous"; 
    allKnownUserIds.add(uid);

    // Only count sessions where user listened for > 10 seconds
    const isMeaningfulSession = session.timeListened > 10;
    
    if (isMeaningfulSession) {
      userAudioCounts[uid] = (userAudioCounts[uid] || 0) + 1;
    }

    if (session.timestamp) {
      const date = session.timestamp.toDate ? session.timestamp.toDate() : new Date(session.timestamp);
      
      // Time of Day aggregation
      const hour = date.getHours();
      if (hour >= 6 && hour < 12) timeBlocks["Morning (6-12)"]++;
      else if (hour >= 12 && hour < 18) timeBlocks["Afternoon (12-18)"]++;
      else if (hour >= 18) timeBlocks["Evening (18-24)"]++;
      else timeBlocks["Night (0-6)"]++;

      // Retention Tracking Array
      if (!userSessionsByDate[uid]) userSessionsByDate[uid] = [];
      userSessionsByDate[uid].push(date);
    }
  });

  // Calculate Metric 1: Usage Frequency
  let count0 = 0, count1to2 = 0, count3Plus = 0;
  
  allKnownUserIds.forEach(uid => {
    const count = userAudioCounts[uid] || 0;
    if (count === 0) count0++;
    else if (count <= 2) count1to2++;
    else count3Plus++;
  });

  const totalKnownUsers = allKnownUserIds.size || 1; // prevent div by zero
  const freqData = [
    { name: '0 Times', value: Math.round((count0 / totalKnownUsers) * 100), count: count0 },
    { name: '1-2 Times', value: Math.round((count1to2 / totalKnownUsers) * 100), count: count1to2 },
    { name: '3+ Times', value: Math.round((count3Plus / totalKnownUsers) * 100), count: count3Plus }
  ];

  // Calculate Metric 2: Time of Day Distribution
  const timeOfDayData = Object.keys(timeBlocks).map(key => ({
    time: key,
    sessions: timeBlocks[key as keyof typeof timeBlocks]
  }));

  // Calculate Metric 3: Retention (Day 0 & Day 1, Day 0 to 7)
  let eligibleForDay1 = 0;
  let retainedDay1 = 0;
  let eligibleForDay7 = 0;
  let retainedDay7 = 0;

  Object.values(userSessionsByDate).forEach(dates => {
    if (dates.length === 0) return;
    
    // Sort to find Day 0
    dates.sort((a, b) => a.getTime() - b.getTime());
    const day0Time = getDayOnly(dates[0]);
    const now = getDayOnly(new Date());
    
    // Days elapsed since the user's first ever session
    const daysSinceStart = (now - day0Time) / (1000 * 3600 * 24);

    // Calculate Day 1 Retention
    if (daysSinceStart >= 1) {
      eligibleForDay1++;
      const hasDay1 = dates.some(d => ((getDayOnly(d) - day0Time) / (1000 * 3600 * 24)) === 1);
      if (hasDay1) retainedDay1++;
    }

    // Calculate Day 1 to 7 Retention
    if (daysSinceStart >= 7) {
      eligibleForDay7++;
      const hasDay1to7 = dates.some(d => {
        const diffDays = (getDayOnly(d) - day0Time) / (1000 * 3600 * 24);
        return diffDays >= 1 && diffDays <= 7;
      });
      if (hasDay1to7) retainedDay7++;
    }
  });

  const day1RetentionRate = eligibleForDay1 > 0 ? Math.round((retainedDay1 / eligibleForDay1) * 100) : 0;
  const day7RetentionRate = eligibleForDay7 > 0 ? Math.round((retainedDay7 / eligibleForDay7) * 100) : 0;


  // --- CHARTS PREPARATION ---
  
  const intensityChartData = [1, 2, 3, 4, 5].map(level => ({
    name: `Lvl ${level}`,
    count: intensityMap[level as keyof typeof intensityMap],
  }));

  const resolutionChartData = [
    { name: 'Fresh', value: startingFresh },
    { name: 'Good', value: goingGood }
  ];

  const dropoffBuckets = { "< 15s": 0, "15-30s": 0, "30-60s": 0, "1-2m": 0, "2m+": 0 };
  droppedSessions.forEach(s => {
    const t = s.timeListened || 0;
    if (t < 15) dropoffBuckets["< 15s"]++;
    else if (t <= 30) dropoffBuckets["15-30s"]++;
    else if (t <= 60) dropoffBuckets["30-60s"]++;
    else if (t <= 120) dropoffBuckets["1-2m"]++;
    else dropoffBuckets["2m+"]++;
  });
  
  const dropoffTimelineData = Object.keys(dropoffBuckets).map(key => ({
    time: key,
    dropoffs: dropoffBuckets[key as keyof typeof dropoffBuckets]
  }));

  // Custom Tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 text-sm font-medium">
          <p className="text-slate-400 mb-1">{label}</p>
          <p className="font-bold text-lg">{payload[0].value} {payload[0].dataKey === 'value' && payload[0].payload.name?.includes('Times') ? '%' : 'Sessions'}</p>
        </div>
      );
    }
    return null;
  };

  const DropoffTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/50 text-sm font-medium">
          <p className="text-slate-400 mb-1">Left at {label}</p>
          <p className="font-bold text-lg text-rose-400">{payload[0].value} Drop-offs</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-6 md:p-8 font-sans pb-24 selection:bg-blue-100">
      <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
        
        {/* Modern Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-xl p-5 sm:p-6 rounded-[2rem] shadow-sm border border-white">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Analytics Dashboard
            </h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base mt-2 md:ml-13">Real-time engagement & urge relief metrics</p>
          </div>
          
          <div className="flex flex-row w-full md:w-auto gap-3 items-center">
            <button 
              onClick={fetchData} 
              disabled={loading || isDeleting}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-slate-700 font-bold rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all text-sm sm:text-base shadow-sm border border-slate-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh Data</span>
            </button>

            <div className="relative flex-1 md:flex-none" ref={menuRef}>
              <button 
                onClick={() => setShowDataMenu(!showDataMenu)}
                disabled={loading || isDeleting}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm sm:text-base shadow-lg shadow-slate-900/10 disabled:opacity-50"
              >
                <Database className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                <span className="hidden xs:inline">Manage Data</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDataMenu ? 'rotate-180' : ''}`} />
              </button>

              {showDataMenu && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 transform origin-top-right transition-all">
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => clearCollection("audio_sessions")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Audio Sessions
                    </button>
                    <button 
                      onClick={() => clearCollection("reflections")}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Reflections
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {isDeleting && (
          <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex flex-col items-center justify-center">
            <div className="w-14 h-14 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
            <p className="text-slate-800 font-bold text-xl animate-pulse">Purging records...</p>
          </div>
        )}

        {loading && !isDeleting ? (
          <div className="h-64 flex items-center justify-center bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (total === 0 && totalAudioSessions === 0) ? (
          <div className="bg-white/80 backdrop-blur-xl p-12 sm:p-20 rounded-[2rem] shadow-sm border border-white text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Activity className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800">No Data Available</h3>
            <p className="text-slate-500 font-medium text-sm sm:text-base mt-3 max-w-md">Your analytics will automatically populate here once users begin logging their reflections and audio sessions.</p>
          </div>
        ) : (
          <>
            {/* NEW RETENTION KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 sm:p-6 rounded-[2rem] shadow-lg shadow-slate-900/10 flex flex-col gap-4 group text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-blue-300" />
                  </div>
                  <p className="text-slate-300 font-bold text-xs uppercase tracking-wider">Total Users</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black">{totalKnownUsers}</p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Day 1 Retention</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl sm:text-4xl font-black text-slate-800">{day1RetentionRate}%</p>
                  <p className="text-xs font-bold text-slate-400">of {eligibleForDay1} eligible</p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Day 1-7 Retention</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl sm:text-4xl font-black text-slate-800">{day7RetentionRate}%</p>
                  <p className="text-xs font-bold text-slate-400">of {eligibleForDay7} eligible</p>
                </div>
              </div>

              <div className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Success Rate</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-slate-800">{total > 0 ? Math.round((goingGood / total) * 100) : 0}%</p>
                </div>
              </div>
            </div>

            {/* NEW CHARTS SECTION: Audio Usage Frequency & Time of Day */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Frequency Pie Chart */}
              <div className="bg-white p-5 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Audio Usage Frequency</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Percentage of users based on total meaningful listens (&gt;10s).</p>
                </div>
                <div className="flex-1 min-h-[250px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={freqData}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {freqData.map((entry, index) => (
                          <PieCell key={`cell-${index}`} fill={FREQUENCY_COLORS[index % FREQUENCY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '13px', fontWeight: 600 }}
                        formatter={(value, entry: any) => <span className="text-slate-700 ml-1.5">{value} ({entry.payload.count} users)</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Time of Day Distribution */}
              <div className="bg-white p-5 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Time of Day Engagement</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">When users are activating audio sessions.</p>
                </div>
                <div className="flex-1 min-h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeOfDayData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600, fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 500, fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} content={<CustomTooltip />} />
                      <Bar dataKey="sessions" radius={[12, 12, 12, 12]} maxBarSize={50}>
                        {timeOfDayData.map((entry, index) => (
                          <BarCell key={`cell-${index}`} fill={TIME_BLOCK_COLORS[index % TIME_BLOCK_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Original Charts Section - Row 1 (Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Intensity Bar Chart */}
              <div className="bg-white p-5 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Intensity Distribution</h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Reported urge rating (1-5) post-session.</p>
                  </div>
                  <div className="bg-blue-50 px-3 py-1 rounded-lg text-blue-600 font-bold text-sm">
                    Avg: {avgIntensity}
                  </div>
                </div>
                <div className="flex-1 min-h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intensityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 500, fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[12, 12, 12, 12]} maxBarSize={60}>
                        {intensityChartData.map((entry, index) => (
                          <BarCell key={`cell-${index}`} fill={INTENSITY_COLORS[index % INTENSITY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resolution Donut Chart */}
              <div className="bg-white p-5 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Session Resolutions</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1">Emotional state reported after reflection.</p>
                </div>
                <div className="flex-1 min-h-[250px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {resolutionChartData.map((entry, index) => (
                          <PieCell key={`cell-${index}`} fill={RESOLUTION_COLORS[index % RESOLUTION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '13px', fontWeight: 600 }}
                        formatter={(value) => <span className="text-slate-700 ml-1.5">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Section - Row 2 (Full Width Audio Dropoff Curve) */}
            <div className="bg-white p-5 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col w-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
               <Headphones className="w-48 h-48" />
              </div>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 relative z-10 gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Audio Retention Curve</h2>
                  <p className="text-slate-500 font-medium text-sm mt-1 max-w-lg">
                    Visualizes exactly when users are exiting the audio therapy early. Spikes indicate common friction points where users lose focus.
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Drop-off Rate</p>
                    <p className="text-2xl font-black text-slate-800">{dropoffRate}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1">Avg Leave Time</p>
                    <p className="text-2xl font-black text-slate-800">{avgDropoffTimeStr}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 min-h-[300px] sm:min-h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dropoffTimelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDropoff" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 500, fontSize: 12 }} />
                    <Tooltip content={<DropoffTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Area 
                      type="monotone" 
                      dataKey="dropoffs" 
                      stroke="#f43f5e" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorDropoff)" 
                      activeDot={{ r: 8, fill: '#f43f5e', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  );
}