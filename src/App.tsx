/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { ARABIC_DATA, SENTENCES } from './data';
import confetti from 'canvas-confetti';

// --- Types ---
interface Word {
  text: string;
  meaning: string;
}

interface LetterData {
  char: string;
  name: string;
  words: Word[];
}

// --- App Component ---
export default function App() {
  const [view, setView] = useState<'grid' | 'learning' | 'sentences' | 'words'>('grid');
  const [currentLetter, setCurrentLetter] = useState<LetterData | null>(null);
  const [currentTashkeel, setCurrentTashkeel] = useState('');
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  
  // Audio state
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    // Load progress
    const saved = localStorage.getItem('arabic_progress');
    if (saved) setProgress(JSON.parse(saved));

    // Setup voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) setVoice(arVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'ar-SA';
    if (voice) msg.voice = voice;
    msg.rate = 0.8;
    msg.pitch = 1.2;
    window.speechSynthesis.speak(msg);
  };

  const handleDone = () => {
    if (!currentLetter) return;
    const newProgress = { ...progress, [currentLetter.char]: true };
    setProgress(newProgress);
    localStorage.setItem('arabic_progress', JSON.stringify(newProgress));
    
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0EA5E9', '#22C55E', '#F97316', '#A855F7']
    });

    setTimeout(() => {
      setView('grid');
    }, 1500);
  };

  const completedCount = Object.keys(progress).length;

  return (
    <div className="min-h-screen bg-[#E0F2FE] font-['Cairo'] text-slate-800 pb-24" dir="rtl">
      {/* Background Decorators */}
      <div className="fixed -top-20 -right-20 w-80 h-80 bg-yellow-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>
      <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-green-200 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('grid')}>
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-sky-200">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-sky-800 tracking-tight">مُغَامَرَاتُ العَرَبِيَّةِ</h1>
              <p className="text-xs font-bold text-sky-600/60 uppercase tracking-widest hidden md:block">تعلم بمتعة وإبداع</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border-2 border-white shadow-sm flex items-center gap-4">
            <div className="flex gap-1 text-yellow-400 text-xl">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className={i <= Math.floor((completedCount / 28) * 5) ? '' : 'text-slate-200'}>★</span>
              ))}
            </div>
            <span className="text-xl font-bold text-sky-900 border-r-2 border-sky-100 pr-4">{completedCount} / 28</span>
          </div>
        </header>

        {/* Views */}
        <main>
          {view === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
              {ARABIC_DATA.map((letter) => (
                <div 
                  key={letter.char}
                  onClick={() => {
                    setCurrentLetter(letter);
                    setCurrentTashkeel('');
                    setView('learning');
                    speak(letter.char);
                  }}
                  className={`aspect-square cursor-pointer rounded-[32px] flex flex-col items-center justify-center text-4xl font-bold border-b-8 relative transition-all hover:scale-105 active:scale-95 shadow-lg
                    ${progress[letter.char] ? 'bg-green-400 text-white border-green-600' : 'bg-white text-sky-800 border-slate-200 hover:border-sky-300'}`}
                >
                  <span>{letter.char}</span>
                  <span className="text-[10px] text-current opacity-60 absolute bottom-3 font-semibold">{letter.name}</span>
                  {progress[letter.char] && <div className="absolute top-2 right-2 text-sm bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center shadow-sm text-white">⭐</div>}
                </div>
              ))}
            </div>
          )}

          {view === 'learning' && currentLetter && (
            <LearningView 
              letter={currentLetter} 
              tashkeel={currentTashkeel}
              setTashkeel={setCurrentTashkeel}
              speak={speak}
              onBack={() => setView('grid')}
              onDone={handleDone}
            />
          )}

          {view === 'words' && (
            <WordsGridView data={ARABIC_DATA} speak={speak} />
          )}

          {view === 'sentences' && (
            <SentencesView sentences={SENTENCES} speak={speak} />
          )}
        </main>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] px-4 py-3 z-50">
        <div className="max-w-[600px] mx-auto flex items-center justify-between gap-2">
          <NavButton 
            active={view === 'grid' || view === 'learning'} 
            onClick={() => setView('grid')} 
            icon="🔠" 
            label="الحروف" 
            color="sky"
          />
          <NavButton 
            active={view === 'words'} 
            onClick={() => setView('words')} 
            icon="🍎" 
            label="الكلمات" 
            color="orange"
          />
          <NavButton 
            active={view === 'sentences'} 
            onClick={() => setView('sentences')} 
            icon="📖" 
            label="الجمل" 
            color="purple"
          />
        </div>
      </nav>
    </div>
  );
}

// --- Navigation Button Component ---
function NavButton({ active, onClick, icon, label, color }: any) {
  const colorClasses: any = {
    sky: active ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:bg-slate-50',
    orange: active ? 'bg-orange-100 text-orange-600' : 'text-slate-400 hover:bg-slate-50',
    purple: active ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:bg-slate-50',
  };

  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-1 px-2 rounded-2xl transition-all duration-300 ${colorClasses[color]}`}
    >
      <span className={`text-2xl transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
      <span className="text-[10px] md:text-sm font-black whitespace-nowrap">{label}</span>
      {active && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 bg-current animate-pulse`}></div>}
    </button>
  );
}

// --- Words Grid View ---
function WordsGridView({ data, speak }: { data: any[], speak: (t: string) => void }) {
  // Flatten all words into one list
  const allWords = data.flatMap(char => char.words);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-orange-600 mb-2">قاموس الكلمات</h2>
        <p className="text-slate-500 font-bold">اضغط على الكلمة لتسمع نطقها الصحيح</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {allWords.map((word, i) => (
          <button 
            key={i}
            onClick={() => speak(word.text)}
            className="bg-white p-6 rounded-[30px] shadow-lg border-b-4 border-slate-100 hover:border-orange-300 transition-all flex flex-col items-center justify-center gap-2 group active:scale-95"
          >
            <span className="text-3xl font-bold text-slate-800 group-hover:scale-110 transition-transform">{word.text}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{word.meaning}</span>
            <span className="text-xs bg-orange-50 px-3 py-1 rounded-full text-orange-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">🔊 انقر</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Learning View Component ---
function LearningView({ letter, tashkeel, setTashkeel, speak, onBack, onDone }: any) {
  const [activeTab, setActiveTab] = useState<'trace' | 'words'>('trace');

  return (
    <div className="grid grid-cols-12 gap-6 md:gap-8 animate-in fade-in duration-500">
      {/* Tab Switcher (Mobile) */}
      <div className="col-span-12 lg:hidden flex gap-2">
        <button 
          onClick={() => setActiveTab('trace')}
          className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${activeTab === 'trace' ? 'bg-sky-600 text-white border-sky-600' : 'bg-white border-white'}`}
        >✍️ التتبع</button>
        <button 
          onClick={() => setActiveTab('words')}
          className={`flex-1 py-3 rounded-2xl font-bold border-2 transition-all ${activeTab === 'words' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-white'}`}
        >🍎 الكلمات</button>
      </div>

      {/* Sidebar: Info & Tashkeel */}
      <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
        <div className="bg-white rounded-[40px] p-8 shadow-xl border-4 border-white h-full flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-8xl md:text-9xl font-extrabold text-sky-800 drop-shadow-sm mb-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => speak(letter.char + tashkeel)}>
              {letter.char}{tashkeel}
            </h2>
            <p className="text-xl text-slate-400 font-bold">{letter.name}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-center text-sky-900 font-bold text-lg mb-2">حَرَكَات التَّشْكِيل</h3>
            {[
              { t: 'َ', name: 'فَتْحَة', color: 'bg-orange-50 border-orange-100 text-orange-600' },
              { t: 'ُ', name: 'ضَمَّة', color: 'bg-sky-50 border-sky-100 text-sky-600' },
              { t: 'ِ', name: 'كَسْرَة', color: 'bg-purple-50 border-purple-100 text-purple-600' }
            ].map(item => (
              <button 
                key={item.t}
                onClick={() => { setTashkeel(item.t); speak(letter.char + item.t); }}
                className={`w-full py-4 rounded-[30px] border-4 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 group ${item.color} ${tashkeel === item.t ? 'ring-4 ring-offset-2 ring-sky-200' : ''}`}
              >
                <span className="text-4xl font-bold group-hover:scale-110 transition-transform">◌{item.t}</span>
                <span className="font-bold">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area: Trace or Words */}
      <div className={`col-span-12 lg:col-span-9 order-1 lg:order-2 ${activeTab === 'trace' ? 'block' : 'hidden lg:block lg:col-span-6'}`}>
         {activeTab === 'trace' ? (
           <TracingBoard char={letter.char} onDone={onDone} />
         ) : null}
      </div>

      {/* Words List (Persistent on large screens, tab on mobile) */}
      <div className={`col-span-12 lg:col-span-3 order-3 ${activeTab === 'words' ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white rounded-[40px] p-6 shadow-xl border-4 border-white h-[600px] flex flex-col overflow-hidden">
          <h3 className="text-center text-sky-900 font-bold text-lg mb-4">كلمات تبدأ بـ ({letter.char})</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {letter.words.map((word: any, i: number) => (
              <button 
                key={i}
                onClick={() => speak(word.text)}
                className="w-full p-4 bg-slate-50 hover:bg-sky-50 rounded-2xl border-2 border-transparent hover:border-sky-200 transition-all flex items-center justify-between group"
              >
                <div className="text-right">
                  <p className="text-2xl font-bold text-sky-800 group-hover:scale-105 transition-transform">{word.text}</p>
                  <p className="text-xs text-slate-400 font-bold">{word.meaning}</p>
                </div>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-lg">🔊</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Tracing Board Component ---
function TracingBoard({ char, onDone }: { char: string, onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    initCanvas();
  }, [char]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal size to match display size for 1:1 pixel mapping
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Guide Letter
    ctx.font = `${canvas.width * 0.8}px Cairo`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(char, canvas.width / 2, canvas.height / 2 + (canvas.width * 0.1));
    
    // Tools
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = canvas.width / 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  return (
    <div className="bg-white rounded-[60px] shadow-2xl relative border-[12px] border-white flex flex-col items-center justify-center p-4 md:p-8 min-h-[500px]">
      <div className="absolute inset-4 md:inset-8 border-[3px] border-dashed border-slate-100 rounded-[40px] pointer-events-none"></div>
      
      <canvas 
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={() => setIsDrawing(false)}
        onTouchStart={(e) => { e.preventDefault(); startDrawing(e); }}
        onTouchMove={(e) => { e.preventDefault(); draw(e); }}
        onTouchEnd={() => setIsDrawing(false)}
        className="w-full aspect-square max-w-[500px] cursor-crosshair touch-none relative z-10"
      />

      <div className="absolute bottom-6 md:bottom-10 left-6 right-6 flex justify-between items-center z-20">
        <button onClick={initCanvas} className="px-6 md:px-10 py-3 bg-red-100 text-red-500 font-bold rounded-full border-b-4 border-red-200 active:border-0 hover:bg-red-200 transition-all text-sm md:text-base">إِعَادَةُ الكِتَابَةِ</button>
        <button onClick={onDone} className="px-10 md:px-16 py-3 bg-green-500 text-white font-bold rounded-full border-b-4 border-green-700 shadow-xl hover:bg-green-600 active:transform active:translate-y-1 transition-all text-sm md:text-base">تَمَّ</button>
      </div>
    </div>
  );
}

// --- Sentences View Component ---
function SentencesView({ sentences, speak }: { sentences: any[], speak: (t: string) => void }) {
  const [completed, setCompleted] = useState<number[]>([]);

  const handleComplete = (idx: number, text: string) => {
    if (completed.includes(idx)) return;
    setCompleted([...completed, idx]);
    speak(text);
    confetti({
      particleCount: 80,
      spread: 60,
      colors: ['#0EA5E9', '#A855F7']
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-sky-900 mb-2">طريق القراءة</h2>
        <p className="text-slate-500">اقرأ الجمل واجمع النجوم!</p>
      </div>

      {sentences.map((item, i) => (
        <div 
          key={i} 
          className={`bg-white p-6 rounded-[30px] shadow-lg border-4 transition-all flex flex-col md:flex-row items-center justify-between gap-4 
            ${completed.includes(i) ? 'border-green-200 bg-green-50/50' : 'border-white hover:border-sky-100'}`}
        >
          <div className="text-center md:text-right">
             <p className="text-2xl md:text-3xl font-bold text-sky-800 mb-1 leading-relaxed">{item.text}</p>
             <p className="text-sm text-slate-400 font-bold">{item.meaning}</p>
          </div>
          <button 
            onClick={() => handleComplete(i, item.text)}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-3xl transition-all shadow-md
              ${completed.includes(i) ? 'bg-yellow-400 text-white scale-110 rotate-12' : 'bg-sky-100 text-sky-600 hover:bg-sky-200'}`}
          >
            {completed.includes(i) ? '⭐' : '🔊'}
          </button>
        </div>
      ))}
    </div>
  );
}
