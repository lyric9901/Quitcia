// @/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Activity, Target, Hash, RefreshCw } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell as BarCell,
  PieChart, Pie, Cell as PieCell, Legend
} from 'recharts';

interface ReflectionData {
  intensity: number;
  resolution: string;
}

const INTENSITY_COLORS = ['#38bdf8', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];
const RESOLUTION_COLORS = ['#f97316', '#10b981']; // Orange for Fresh, Emerald for Good

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [reflections, setReflections] = useState<ReflectionData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") { // Change this to a secure password
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert("Incorrect password");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "reflections"));
      const data: ReflectionData[] = [];
      querySnapshot.forEach((doc) => {
        data.push(doc.data() as ReflectionData);
      });
      setReflections(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
          <h1 className="text-2xl font-black mb-2 text-slate-800">Admin Portal</h1>
          <p className="text-slate-500 font-medium mb-8">Enter your credentials to view analytics.</p>
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

  // --- DATA PROCESSING FOR CHARTS ---
  const total = reflections.length;
  
  // 1. Intensity Processing (1-5)
  const intensityMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalIntensitySum = 0;
  
  // 2. Resolution Processing
  let startingFresh = 0;
  let goingGood = 0;

  reflections.forEach(r => {
    // Tally Intensity
    if (r.intensity >= 1 && r.intensity <= 5) {
      intensityMap[r.intensity as keyof typeof intensityMap]++;
      totalIntensitySum += r.intensity;
    }
    // Tally Resolution
    if (r.resolution === "Starting fresh") startingFresh++;
    if (r.resolution === "Going good") goingGood++;
  });

  // Format data for Recharts
  const intensityChartData = [1, 2, 3, 4, 5].map(level => ({
    name: `Level ${level}`,
    count: intensityMap[level as keyof typeof intensityMap],
  }));

  const resolutionChartData = [
    { name: 'Starting fresh', value: startingFresh },
    { name: 'Going good', value: goingGood }
  ];

  const avgIntensity = total > 0 ? (totalIntensitySum / total).toFixed(1) : "0";

  // Custom Tooltip for Bar Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium">
          <p className="text-slate-300 mb-1">{label}</p>
          <p className="font-bold text-lg">{payload[0].value} Sessions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10 font-sans pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Analytics Overview</h1>
            <p className="text-slate-500 font-medium mt-1">Real-time urge relief insights and statistics</p>
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-slate-100">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : total === 0 ? (
          <div className="bg-white p-16 rounded-3xl shadow-sm border border-slate-100 text-center flex flex-col items-center">
            <Activity className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No Data Yet</h3>
            <p className="text-slate-500 font-medium">Analytics will appear here once users log their reflections.</p>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <Hash className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Total Reflections</p>
                  <p className="text-3xl font-black text-slate-800">{total}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                  <Activity className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Avg. Urge Intensity</p>
                  <p className="text-3xl font-black text-slate-800">{avgIntensity} <span className="text-lg text-slate-400">/ 5</span></p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <Target className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-1">Success Rate</p>
                  <p className="text-3xl font-black text-slate-800">
                    {Math.round((goingGood / total) * 100)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Bar Chart: Intensity */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Urge Intensity Distribution</h2>
                <p className="text-slate-500 font-medium text-sm mb-8">How users rated their urge (1-5) after completing an audio session.</p>
                
                <div className="flex-1 min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={intensityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600, fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 500, fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                      <Bar dataKey="count" radius={[8, 8, 8, 8]} maxBarSize={60}>
                        {intensityChartData.map((entry, index) => (
                          <BarCell key={`cell-${index}`} fill={INTENSITY_COLORS[index % INTENSITY_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart: Resolution */}
              <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Session Resolutions</h2>
                <p className="text-slate-500 font-medium text-sm mb-8">How users reported feeling after the 31-minute reflection period.</p>
                
                <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionChartData}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={120}
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