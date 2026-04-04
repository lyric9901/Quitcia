// @/app/admin/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Activity, Target, Hash, RefreshCw, Clock, TrendingDown, Trash2, Database, ChevronDown } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as BarCell,
  PieChart, Pie, Cell as PieCell, Legend
} from 'recharts';

interface ReflectionData {
  id: string;
  intensity: number;
  resolution: string;
}

interface AudioSessionData {
  id: string;
  status: string;
  timeListened: number;
}

const INTENSITY_COLORS = ['#38bdf8', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];
const RESOLUTION_COLORS = ['#f97316', '#10b981']; 

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  
  const [reflections, setReflections] = useState<ReflectionData[]>([]);
  const [audioSessions, setAudioSessions] = useState<AudioSessionData[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDataMenu, setShowDataMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    if (password === "urge003") {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Incorrect password");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const refSnapshot = await getDocs(collection(db, "reflections"));
      const refData: ReflectionData[] = [];
      refSnapshot.forEach((docSnap) => {
        refData.push({ id: docSnap.id, ...docSnap.data() } as ReflectionData);
      });
      setReflections(refData);

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

    const friendlyName = collectionName === "reflections" ? "Reflections" : "Audio Sessions";
    const confirmDelete = window.confirm(
      `⚠️ WARNING: Are you sure you want to permanently delete all ${dataToClear.length} ${friendlyName}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    setShowDataMenu(false);

    try {
      // Delete documents one by one (Firestore client SDK requirement)
      for (const item of dataToClear) {
        await deleteDoc(doc(db, collectionName, item.id));
      }
      alert(`Successfully deleted all ${friendlyName}.`);
      await fetchData(); // Refresh the dashboard automatically
    } catch (error) {
      console.error(`Error deleting ${collectionName}:`, error);
      alert("An error occurred while deleting the data.");
    }

    setIsDeleting(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleLogin} className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <h1 className="text-2xl font-black mb-2 text-slate-800">Admin Portal</h1>
          <p className="text-slate-500 font-medium mb-8 text-sm sm:text-base">Enter your credentials to view analytics.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin Password"
            className="w-full p-4 rounded-xl border-2 border-slate-100 mb-6 focus:outline-none focus:border-blue-500 text-slate-800 font-medium transition-colors"
          />
          <button type="submit" className="w-full bg-slate-800 text-white font-bold py-4 rounded-xl hover:bg-slate-900 transition-all active:scale-[0.98] shadow-lg shadow-slate-200">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  // --- DATA PROCESSING ---
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

  const intensityChartData = [1, 2, 3, 4, 5].map(level => ({
    name: `Lvl ${level}`, // Shortened for mobile
    count: intensityMap[level as keyof typeof intensityMap],
  }));

  const resolutionChartData = [
    { name: 'Fresh', value: startingFresh }, // Shortened
    { name: 'Good', value: goingGood }       // Shortened
  ];

  const avgIntensity = total > 0 ? (totalIntensitySum / total).toFixed(1) : "0";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-3 py-2 rounded-xl shadow-xl text-xs sm:text-sm font-medium">
          <p className="text-slate-300 mb-1">{label}</p>
          <p className="font-bold text-base sm:text-lg">{payload[0].value} Sessions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-3 sm:p-6 md:p-10 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Analytics</h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Real-time urge relief insights</p>
          </div>
          
          <div className="flex flex-row w-full sm:w-auto gap-3 items-center">
            <button 
              onClick={fetchData} 
              disabled={loading || isDeleting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors text-sm sm:text-base disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
            </button>

            {/* Manage Data Dropdown */}
            <div className="relative flex-1 sm:flex-none" ref={menuRef}>
              <button 
                onClick={() => setShowDataMenu(!showDataMenu)}
                disabled={loading || isDeleting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm sm:text-base disabled:opacity-50"
              >
                <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">Manage Data</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showDataMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => clearCollection("audio_sessions")}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Audio Sessions
                    </button>
                    <button 
                      onClick={() => clearCollection("reflections")}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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

        {/* Global Loading Overlay for Deletion */}
        {isDeleting && (
          <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-800 font-bold text-lg animate-pulse">Deleting records...</p>
          </div>
        )}

        {loading && !isDeleting ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-100">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (total === 0 && totalAudioSessions === 0) ? (
          <div className="bg-white p-12 sm:p-16 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
            <Activity className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200 mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-700">No Data Yet</h3>
            <p className="text-slate-500 font-medium text-sm sm:text-base mt-2">Analytics will appear here once users log interactions.</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards - Adjusted grid for mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              
              {/* Full width on very small screens, half on small, third on large */}
              <div className="col-span-2 xs:col-span-1 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Hash className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">Total Ref</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{total}</p>
                </div>
              </div>

              <div className="col-span-2 xs:col-span-1 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">Intensity</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{avgIntensity} <span className="text-sm sm:text-lg text-slate-400">/ 5</span></p>
                </div>
              </div>

              <div className="col-span-2 xs:col-span-1 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <Target className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">Success</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{total > 0 ? Math.round((goingGood / total) * 100) : 0}%</p>
                </div>
              </div>

              <div className="col-span-2 xs:col-span-1 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">Drop-off</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{dropoffRate}%</p>
                </div>
              </div>

              <div className="col-span-2 xs:col-span-1 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-[10px] sm:text-sm uppercase tracking-wider mb-0.5 sm:mb-1">Avg Leave</p>
                  <p className="text-2xl sm:text-3xl font-black text-slate-800">{avgDropoffTimeStr}</p>
                </div>
              </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Bar Chart */}
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Intensity Distribution</h2>
                <p className="text-slate-500 font-medium text-xs sm:text-sm mb-6 sm:mb-8">Urge rating (1-5) after sessions.</p>
                
                <div className="flex-1 min-h-[250px] sm:min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intensityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600, fontSize: 11 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 500, fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                      <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={50}>
                        {intensityChartData.map((entry, index) => (
                          <BarCell key={`cell-${index}`} fill={INTENSITY_COLORS[index % INTENSITY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Session Resolutions</h2>
                <p className="text-slate-500 font-medium text-xs sm:text-sm mb-6 sm:mb-8">Feelings reported after reflection.</p>
                
                <div className="flex-1 min-h-[250px] sm:min-h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {resolutionChartData.map((entry, index) => (
                          <PieCell key={`cell-${index}`} fill={RESOLUTION_COLORS[index % RESOLUTION_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 600, color: '#1e293b' }} 
                        itemStyle={{ color: '#1e293b' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value) => <span className="text-slate-700 font-bold ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}