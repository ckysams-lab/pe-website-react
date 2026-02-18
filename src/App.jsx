/**
 * 版本: 2.0 (全新四層架構版)
 * 項目: 正覺蓮社學校 體育科網站
 * 說明:
 * 1. 架構: 引入 React Router，將網站重構成多頁面應用，包含「首頁」、「體適能測試」、「老師後台」。
 * 2. 首頁: 嚴格按照「倒金字塔」四層架構 (Wow, Pathway, Science, Outcome) 進行設計。
 * 3. 整合: 將原有的 FitnessPage (體適能評測) 完整遷移到獨立的 '/fitness-test' 頁面。
 * 4. 擴充性: 預留了 '/dashboard' 給老師後台，並將首頁各層級做成獨立元件，方便日後擴充。
 */

// --- 必需套件 ---
// 請先安裝: npm install react-router-dom recharts lucide-react firebase
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';

// --- 圖示與圖表 ---
import { 
  Home, Activity, Lock, Dumbbell, Star, BookOpen, Menu, Trophy, User, LogOut, ChevronRight, TrendingUp, AlertCircle, Calendar, Smile, Award, Medal, Target, ThumbsUp, Sparkles, Brain, Bot, Download, Save, Key, Users, Clock, BarChart2, TrendingUpIcon, Eye, Zap, Shield
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

// --- Firebase 配置 (與舊版相同) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const HARDCODED_AI_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "sk-or-v1-80a...."; // 您可以保留一個舊的作為備用

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase 初始化失敗:", e);
}

const appId = 'pe-system-v1';

// --- 核心業務邏輯 (與舊版相同) ---
const calculateScore = (gender, age, item, value) => {
  let score = 0;
  if (item === 'bmi') {
    if (value > 18.5 && value < 23) return 4;
    return 2;
  }
  score = Math.min(Math.floor(value / 5), 5); 
  return score > 0 ? score : 1;
};

const getBadgeColor = (score) => {
  if (score >= 5) return '#fbbf24'; 
  if (score >= 4) return '#94a3b8'; 
  if (score >= 3) return '#b45309'; 
  return '#475569'; 
};

// --- 可重用 UI 組件 (與舊版相同) ---
const Card = ({ children, className = "", theme = "dark" }) => {
  const themes = {
    white: "bg-white border-slate-100 shadow-sm",
    ai: "bg-gradient-to-br from-indigo-900/80 to-violet-900/80 border-indigo-500/30 shadow-lg shadow-indigo-500/20 text-white",
    dark: "bg-slate-900 text-white border-slate-800 shadow-xl"
  };
  return <div className={`rounded-2xl p-6 border transition-all duration-300 ${themes[theme] || themes.white} ${className}`}>{children}</div>;
};

const Button = ({ children, onClick, variant = "primary", disabled = false, className = "" }) => {
  const baseStyle = "px-4 py-2.5 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm";
  const variants = {
    primary: "bg-yellow-500 text-slate-900 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 border border-slate-600",
    ai: "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:brightness-110 shadow-lg shadow-fuchsia-500/30",
    success: "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-500/20"
  };
  return <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>{children}</button>;
};

// ==================================================================
//  1. 首頁區塊元件 (Homepage Sections)
// ==================================================================

// --- 1.A 動態計數器 (Wow Factor Section 的子元件) ---
const AnimatedCounter = ({ end, duration = 2000, title, icon }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const endValue = parseInt(end, 10);
    if (isNaN(endValue) || endValue === 0) { setCount(endValue); return; }
    const incrementTime = Math.max(duration / endValue, 1);
    const timer = setInterval(() => {
      start += 1;
      if (start >= endValue) {
        setCount(endValue);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);
    return () => clearInterval(timer);
  }, [end, duration]);
  return (
    <div className="text-center">
      {icon && <div className="text-yellow-400 mb-2">{icon}</div>}
      <h3 className="text-4xl md:text-5xl font-bold text-white">{count}<span className="text-yellow-400">+</span></h3>
      <p className="text-slate-300 mt-2">{title}</p>
    </div>
  );
};

// --- 1.B 第一層: 願景與規模 (The "Wow" Factor) ---
const WowFactorSection = () => (
  <section className="relative bg-slate-900 py-16 sm:py-20 px-4 text-white overflow-hidden border-b-4 border-yellow-500">
    <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2940&auto=format&fit=crop')" }}></div>
    <div className="relative max-w-5xl mx-auto z-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          <span className="block text-yellow-400">看得見的投入</span>
          <span className="block text-slate-300 text-2xl mt-2">為每位學生創造卓越的運動機會</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-y-10 gap-x-6">
        <AnimatedCounter end={300} title="全校運動員" icon={<Users size={40} className="mx-auto" />} />
        <AnimatedCounter end={15} title="校隊與興趣班" icon={<Target size={40} className="mx-auto" />} />
        <AnimatedCounter end={5000} title="全年訓練總時數" icon={<Clock size={40} className="mx-auto" />} />
      </div>
    </div>
  </section>
);

// --- 1.C 第二層: 梯隊成長路徑 (The Pathway) ---
const PathwaySection = () => (
  <section className="bg-slate-100 dark:bg-[#0F0F1B] py-16 sm:py-20 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">系統化的成長階梯</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-3 text-lg">從普及到精英，每個孩子都有屬於自己的跑道</p>
      </div>
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-center">
        {/* 金字塔底層 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg w-full md:w-1/3 border-t-4 border-green-500">
          <Zap size={32} className="mx-auto text-green-500 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">普及層 (P1-P2)</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">興趣班與體適能基石</p>
          <div className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400">多元化體驗</div>
        </div>
        {/* 金字塔中層 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg w-full md:w-1/3 border-t-4 border-blue-500">
          <Shield size={32} className="mx-auto text-blue-500 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">發展層 (P3-P4)</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">預備隊與專項基礎</p>
          <div className="mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400">專項技能訓練</div>
        </div>
        {/* 金字塔頂層 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg w-full md:w-1/3 border-t-4 border-red-500">
          <Trophy size={32} className="mx-auto text-red-500 mb-3" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">精英層 (P5-P6)</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">校隊代表與競賽</p>
          <div className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">高強度競賽</div>
        </div>
      </div>
    </div>
  </section>
);

// --- 1.D 第三層: 科學化訓練 (Science & Tech) ---
const ScienceTechSection = () => (
  <section className="bg-slate-900 py-16 sm:py-20 px-4 text-white">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold">科學訓練，科技賦能</h2>
        <p className="text-slate-400 mt-3 text-lg">引入 AI 數據分析，讓訓練更高效、更個人化</p>
      </div>
      <div className="bg-gradient-to-br from-indigo-900/80 to-violet-900/80 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8 border border-indigo-500/30">
        <div className="md:w-1/2">
          <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center"><Brain className="mr-2" /> AI 智能體適能分析</h3>
          <p className="text-slate-300 mb-6">
            這不只是一個簡單的測試系統。我們利用 AI 技術，為每位學生提供個人化的運動建議、發掘他們的運動潛能，並推薦最適合的校隊。數據驅動，因材施教。
          </p>
          <Link to="/fitness-test">
            <Button variant="ai" className="w-full md:w-auto">
              <Zap size={16} className="mr-2" /> 立即體驗 AI 分析
            </Button>
          </Link>
        </div>
        <div className="md:w-1/2 w-full">
          {/* 這裡是 FitnessPage 的精華截圖/預覽 */}
          <div className="bg-slate-900/50 p-4 rounded-lg shadow-2xl border border-slate-700 aspect-video flex items-center justify-center">
             <p className="text-slate-400">AI 體適能雷達圖預覽</p>
             {/* 可以在此處放置一張靜態雷達圖的圖片 */}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// --- 1.E 第四層: 榮譽與發展 (Outcome) ---
const OutcomeSection = () => (
  <section className="bg-slate-100 dark:bg-[#0F0F1B] py-16 sm:py-20 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">榮譽與成果</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-3 text-lg">我們重視的，不只是獎牌，更是學生的進步與全人發展</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center"><Star className="text-yellow-500 mr-2"/> 榮譽榜 (The Hall of Fame)</h3>
          <p className="text-slate-500 dark:text-slate-400">除了冠軍，我們更嘉許「進步獎」和「突破獎」。</p>
          {/* 在此處可以從 Firestore 讀取 StarsPage 的數據來展示 */}
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center"><BarChart2 className="text-blue-500 mr-2"/> 體育與學業平衡</h3>
          <p className="text-slate-500 dark:text-slate-400">數據證明，合理的體育訓練能促進學業表現。</p>
          {/* 在此處可以放置匿名的「訓練時數 vs 學業成績」圖表 */}
        </div>
      </div>
    </div>
  </section>
);


// ==================================================================
//  2. 頁面元件 (Pages)
// ==================================================================

// --- 2.A 首頁 (Home Page) ---
// 這個頁面組合了上面所有的區塊元件
const HomePage = () => (
  <div className="animate-fade-in">
    <WowFactorSection />
    <PathwaySection />
    <ScienceTechSection />
    <OutcomeSection />
  </div>
);

// --- 2.B 體適能測試頁 (Fitness Test Page) ---
// 這裡幾乎是您舊版 App_new.jsx 中的 FitnessPage 元件，直接遷移過來
const FitnessTestPage = ({ user }) => {
  const [formData, setFormData] = useState({ name: '', class: '6A', classNo: '', gender: 'M', sitUps: 0, flexibility: 0, handGrip: 0, run9min: 0, height: 150, weight: 40 });
  const [result, setResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [userAiKey, setUserAiKey] = useState("");

  const calculate = async () => {
    if (!formData.name || !formData.classNo) { alert("請填寫姓名及班號"); return; }
    
    const bmi = (formData.weight / ((formData.height / 100) ** 2)).toFixed(1);
    const scores = [
      { subject: '仰臥起坐', A: calculateScore(formData.gender, 12, 'situp', formData.sitUps), fullMark: 5, value: formData.sitUps, unit: '次' },
      { subject: '坐姿體前彎', A: calculateScore(formData.gender, 12, 'sitreach', formData.flexibility), fullMark: 5, value: formData.flexibility, unit: 'cm' },
      { subject: '手握力', A: calculateScore(formData.gender, 12, 'grip', formData.handGrip), fullMark: 5, value: formData.handGrip, unit: 'kg' },
      { subject: '心肺耐力', A: calculateScore(formData.gender, 12, 'run', formData.run9min), fullMark: 5, value: formData.run9min, unit: 'm' },
      { subject: 'BMI健康度', A: calculateScore(formData.gender, 12, 'bmi', bmi), fullMark: 5, value: bmi, unit: '' },
    ];
    
    let recommendations = [];
    scores.forEach(s => {
      if (s.A >= 4) {
        if (s.subject === '仰臥起坐') recommendations.push('⚽ 足球隊 (核心強)');
        if (s.subject === '坐姿體前彎') recommendations.push('🎾 壁球隊 (柔軟)');
        if (s.subject === '手握力') recommendations.push('🏓 乒乓球隊 (爆發力)');
        if (s.subject === '心肺耐力') recommendations.push('🏊 游泳隊 / 🏃 田徑隊 (耐力)');
      }
    });
    recommendations = [...new Set(recommendations)];
    
    const newResult = { scores, bmi, recommendations, bestItem: scores.reduce((a,b)=>a.A>b.A?a:b), worstItem: scores.reduce((a,b)=>a.A<b.A?a:b) };
    setResult(newResult);
    setAiAnalysis(""); 

    if (db) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'fitness_records'), {
          ...formData, uid: user ? user.uid : 'anonymous', bmi, scores: scores.map(s => s.A), totalScore: scores.reduce((sum, item) => sum + item.A, 0), recommendations, date: new Date().toISOString()
        });
      } catch (e) { console.error("Auto-save failed:", e); }
    }
  };

  const generateAIAnalysis = async () => {
    const keyToUse = HARDCODED_AI_KEY || userAiKey;
    if (!keyToUse) {
      setAiAnalysis("⚠️ 請在上方輸入 OpenRouter Key，或請管理員在程式碼中設定 HARDCODED_AI_KEY。");
      return;
    }
    setIsAiLoading(true);
    const prompt = `角色：你是一位資深、熱情的小學體育科主任。任務：根據以下學生的體適能數據，撰寫一份約 150 字的「個人化運動建議」。學生：${formData.name} (${formData.gender === 'M' ? '男' : '女'}, ${formData.class}) 數據： - 仰臥起坐: ${formData.sitUps}次 (得分${result.scores[0].A}/5) - 柔軟度: ${formData.flexibility}cm (得分${result.scores[1].A}/5) - 手握力: ${formData.handGrip}kg (得分${result.scores[2].A}/5) - 9分鐘跑: ${formData.run9min}m (得分${result.scores[3].A}/5) 請包含：1. 親切開場。 2. 針對弱項 (2分或以下) 給出具體訓練建議（例如：如果柔軟度差，建議做什麼伸展）。 3. 根據優勢推薦適合的校隊。 4. 語氣要正面、溫暖、鼓勵。`;
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${keyToUse}`, "Content-Type": "application/json" },
        body: JSON.stringify({ "model": "google/gemini-2.0-flash-001", "messages": [{"role": "user", "content": prompt}] })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setAiAnalysis(data.choices[0].message.content);
      } else {
        setAiAnalysis(`API 錯誤: ${data.error ? data.error.message : "未知錯誤"}`);
      }
    } catch (error) {
      setAiAnalysis(`連線錯誤: ${error.message}`);
    }
    setIsAiLoading(false);
  };

  // The JSX for FitnessTestPage is identical to the old FitnessPage
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border-t-4 border-yellow-500 h-fit">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
          <Activity className="mr-2 text-yellow-500" /> 輸入評測數據
        </h2>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">個人資料 (必填)</h3>
             <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="姓名" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <input type="number" placeholder="班號" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.classNo} onChange={e => setFormData({...formData, classNo: Number(e.target.value)})} />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <select className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>{['1A','1B','2A','2B','3A','3B','4A','4B','5A','5B','6A','6B'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option value="M">男</option><option value="F">女</option></select>
             </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">測驗項目</h3>
            <div className="grid grid-cols-2 gap-4">
               <div><label className="text-xs text-slate-500 mb-1 block">仰臥起坐</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.sitUps} onChange={e => setFormData({...formData, sitUps: Number(e.target.value)})} /></div>
               <div><label className="text-xs text-slate-500 mb-1 block">柔軟度</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.flexibility} onChange={e => setFormData({...formData, flexibility: Number(e.target.value)})} /></div>
               <div><label className="text-xs text-slate-500 mb-1 block">手握力</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.handGrip} onChange={e => setFormData({...formData, handGrip: Number(e.target.value)})} /></div>
               <div><label className="text-xs text-slate-500 mb-1 block">9分鐘跑</label><input type="number" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.run9min} onChange={e => setFormData({...formData, run9min: Number(e.target.value)})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
               <input type="number" placeholder="身高 cm" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.height} onChange={e => setFormData({...formData, height: Number(e.target.value)})} />
               <input type="number" placeholder="體重 kg" className="w-full p-2 rounded bg-white text-slate-900 border border-slate-300 outline-none" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} />
            </div>
          </div>
          <button onClick={calculate} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2">
             <Save size={18}/> 計算並儲存成績
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {result ? (
          <>
            <Card theme="ai">
               <div className="flex justify-between items-start mb-4">
                 <h3 className="text-lg font-bold text-indigo-300 flex items-center"><Brain className="mr-2 text-purple-400" /> AI 智能教練評語</h3>
                 {!aiAnalysis && !isAiLoading && <Button onClick={generateAIAnalysis} variant="ai" className="text-xs py-2 px-4"><Sparkles size={14}/> 生成報告</Button>}
               </div>
               {!HARDCODED_AI_KEY && !aiAnalysis && !isAiLoading && (
                 <div className="mb-4">
                   <input type="password" placeholder="請在此輸入 OpenRouter API Key (sk-or-...)" className="w-full p-2 rounded bg-slate-800/50 border border-indigo-500/30 text-white text-xs" value={userAiKey} onChange={(e) => setUserAiKey(e.target.value)} />
                 </div>
               )}
               {isAiLoading ? <p className="text-indigo-400 animate-pulse">教練正在思考中...</p> : aiAnalysis ? <p className="whitespace-pre-line leading-relaxed text-slate-200">{aiAnalysis}</p> : <p className="text-slate-400 text-sm">點擊按鈕，獲取個人化訓練建議。</p>}
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl"><h3 className="text-lg font-bold text-white mb-4">綜合能力雷達</h3><ResponsiveContainer width="100%" height={250}><RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.scores}><PolarGrid stroke="#475569" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 12 }} /><PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} /><Radar name="表現" dataKey="A" stroke="#EAB308" fill="#EAB308" fillOpacity={0.6} /><Tooltip contentStyle={{ backgroundColor: '#1e293b' }} /></RadarChart></ResponsiveContainer></div>
              <div className="bg-slate-900 p-6 rounded-2xl"><h3 className="text-lg font-bold text-white mb-4">單項得分</h3><ResponsiveContainer width="100%" height={250}><BarChart data={result.scores} layout="vertical" margin={{left: 40}}><XAxis type="number" domain={[0, 5]} tick={{ fill: '#FFFFFF' }} /><YAxis dataKey="subject" type="category" width={80} tick={{ fill: '#FFFFFF', fontSize: 12 }} /><Bar dataKey="A" barSize={20}>{result.scores.map((e, i) => (<Cell key={`cell-${i}`} fill={getBadgeColor(e.A)} />))}</Bar></BarChart></ResponsiveContainer></div>
            </div>
          </>
        ) : (
          <div className="text-center text-slate-500 py-20"><Activity size={64} className="mx-auto mb-4 opacity-50" /><p>請在左側輸入數據以獲取報告</p></div>
        )}
      </div>
    </div>
  );
};


// --- 2.C 老師後台頁 (Dashboard Page) ---
// 這是未來放置老師管理工具的頁面
const DashboardPage = ({ user }) => {
  if (!user) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
         <Lock size={48} className="mx-auto text-red-500 mb-4" />
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">存取權限不足</h2>
         <p className="text-slate-500 mt-2">此頁面為老師管理後台，請先登入。</p>
         {/* 在此可以放置登入表單 */}
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">老師管理後台</h1>
      <p className="text-slate-600 dark:text-slate-400">
        歡迎，{user.email}。
        <br />
        這裡將會放置「器材管理」、「發佈最新動態」、「匯出報告」等管理工具。
      </p>
      {/* 
        未來步驟:
        1. 將舊版 App_new.jsx 中的 AdminPage, EquipmentPage 等元件移到這裡。
        2. 建立一個側邊欄或標籤頁，用於在不同的管理功能之間切換。
      */}
    </div>
  );
};

// ==================================================================
//  3. 導航列 & 主應用程式 (Navbar & Main App)
// ==================================================================

// --- 3.A 網站導航列 ---
const Navbar = () => {
    const activeLinkStyle = {
        color: '#FBBF24', // yellow-400
        fontWeight: 'bold',
    };
    
    return (
        <nav className="bg-slate-900/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 text-white font-bold text-lg flex items-center">
                            <Trophy size={20} className="text-yellow-400 mr-2"/>
                            正覺體育
                        </Link>
                    </div>
                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/" className="text-slate-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>首頁</NavLink>
                            <NavLink to="/fitness-test" className="text-slate-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>AI 體適能</NavLink>
                            <NavLink to="/dashboard" className="text-slate-300 hover:text-yellow-400 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>老師後台</NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};


// --- 3.B 主應用程式 App ---
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      // 保持匿名登入或自訂 token 登入的邏輯
      if (!currentUser) {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          signInWithCustomToken(auth, __initial_auth_token);
        } else {
          signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
        }
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="bg-slate-100 dark:bg-[#0F0F1B] min-h-screen font-sans">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/fitness-test" element={<FitnessTestPage user={user} />} />
            <Route path="/dashboard" element={<DashboardPage user={user} />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-center p-4 text-sm text-slate-400 mt-12">
            正覺蓮社學校 體育組 © {new Date().getFullYear()}
        </footer>
      </div>
      <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </BrowserRouter>
  );
}
