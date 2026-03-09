import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSessionWords, getVocabByStatus, updateProgress, VocabStatus } from '../db';
import VocabCard from '../components/VocabCard';

const SESSION_SIZE = 20;

export default function Review() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [masteredCountAtStart, setMasteredCountAtStart] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getSessionWords(SESSION_SIZE),
      getVocabByStatus(VocabStatus.MASTERED).then((arr) => arr.length),
    ]).then(([words, masteredCount]) => {
      if (!cancelled) {
        setQueue(words);
        setMasteredCountAtStart(masteredCount);
        setIndex(0);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleFeedback = useCallback(
    async (newStatus) => {
      const current = queue[index];
      if (!current?.id) return;

      await updateProgress(current.id, newStatus);

      if (newStatus === VocabStatus.UNLEARNED) {
        setQueue((prev) => [...prev, current]);
      }

      setIndex((i) => {
        const next = i + 1;
        const nextQueue = newStatus === VocabStatus.UNLEARNED ? [...queue, current] : queue;
        if (next >= nextQueue.length) {
          navigate('/review/summary', {
            state: {
              stepsCount: next,
              initialSessionSize: SESSION_SIZE,
              masteredCountAtStart,
            },
          });
        }
        return next;
      });
    },
    [queue, index, masteredCountAtStart, navigate]
  );

  const current = queue[index];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>載入中…</p>
      </div>
    );
  }

  if (!queue.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white px-4">
        <p className="mb-4">目前沒有待複習的單字，明天再來或到資料管理匯入更多。</p>
        <Link to="/" className="text-amber-400 underline">回首頁</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <Link to="/" className="text-slate-400">首頁</Link>
        <span className="text-slate-400">
          第 {index + 1} / {queue.length}
        </span>
      </header>
      <VocabCard item={current} onFeedback={handleFeedback} />
    </div>
  );
}
