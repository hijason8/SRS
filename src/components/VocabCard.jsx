import { useState, useCallback, useEffect } from 'react';
import { VocabStatus } from '../db';

const SPEECH_RATE = 0.8;

export default function VocabCard({ item, onFeedback }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    setShowHint(false);
    setShowAnswer(false);
  }, [item?.id]);

  const speak = useCallback(() => {
    const text = item?.kana || item?.kanji;
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = SPEECH_RATE;
    const voices = window.speechSynthesis.getVoices();
    const jaVoice =
      voices.find((v) => v.lang === 'ja-JP') ||
      voices.find((v) => v.lang.startsWith('ja'));
    if (jaVoice) u.voice = jaVoice;
    window.speechSynthesis.speak(u);
  }, [item?.kana, item?.kanji]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const handlePlay = () => {
    setAudioUnlocked(true);
    if (!window.speechSynthesis) return;
    window.speechSynthesis.getVoices();
    setTimeout(speak, 100);
  };

  const handleFeedback = (newStatus) => {
    onFeedback?.(newStatus);
  };

  if (!item) return null;

  return (
    <div className="vocab-card-content flex flex-col items-center justify-center min-h-[60vh] px-4 pb-24">
      {/* 第一層：大大的漢字 */}
      <p className="text-5xl md:text-6xl font-bold text-center mb-6 select-none">
        {item.kanji}
      </p>

      {/* 第二層：聽發音（使用 iPhone 內建日文語音） */}
      <div className="flex flex-col items-center gap-3 mb-4">
        <button
          type="button"
          onClick={handlePlay}
          className="min-h-[50px] px-6 py-3 rounded-xl bg-amber-500/90 text-white font-medium text-lg touch-manipulation active:scale-95"
          style={{ minHeight: '50px' }}
        >
          {audioUnlocked ? '聽發音' : '解鎖發音'}
        </button>
        <p className="text-xs text-slate-500 max-w-[280px] text-center">
          使用裝置內建語音。若無日文：設定 → 輔助使用 → 語音內容 → 語音 → 加入「日文」
        </p>
        {!showHint && (
          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="min-h-[50px] px-6 py-3 rounded-xl bg-slate-600 text-white font-medium touch-manipulation active:scale-95"
            style={{ minHeight: '50px' }}
          >
            看提示
          </button>
        )}
      </div>

      {/* 第三層：假名與筆記 */}
      {showHint && (
        <div className="text-center mb-4 space-y-2 max-w-md">
          <p className="text-2xl text-amber-200/90">{item.kana || '—'}</p>
          {item.note && (
            <p className="text-sm text-slate-400 italic">{item.note}</p>
          )}
          {!showAnswer && (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className="min-h-[50px] mt-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium touch-manipulation"
              style={{ minHeight: '50px' }}
            >
              看答案
            </button>
          )}
        </div>
      )}

      {/* 第四層：中文意思 */}
      {showAnswer && (
        <p className="text-xl text-slate-300 mb-6">{item.meaning || '—'}</p>
      )}

      {/* 回饋按鈕：僅在顯示答案後出現 */}
      {showAnswer && (
        <div className="fixed bottom-0 left-0 right-0 flex gap-2 p-4 bg-slate-900/95 safe-area-pb">
          <button
            type="button"
            onClick={() => handleFeedback(VocabStatus.UNLEARNED)}
            className="flex-1 min-h-[50px] rounded-xl bg-red-600 text-white font-medium touch-manipulation active:scale-95"
            style={{ minHeight: '50px' }}
          >
            忘記
          </button>
          <button
            type="button"
            onClick={() => handleFeedback(VocabStatus.FUZZY)}
            className="flex-1 min-h-[50px] rounded-xl bg-amber-600 text-white font-medium touch-manipulation active:scale-95"
            style={{ minHeight: '50px' }}
          >
            模糊
          </button>
          <button
            type="button"
            onClick={() => handleFeedback(VocabStatus.MASTERED)}
            className="flex-1 min-h-[50px] rounded-xl bg-emerald-600 text-white font-medium touch-manipulation active:scale-95"
            style={{ minHeight: '50px' }}
          >
            記得
          </button>
        </div>
      )}
    </div>
  );
}
