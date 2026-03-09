import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getVocabByStatus, VocabStatus } from '../db';

const SESSION_SIZE = 20;

export default function ReviewSummary() {
  const location = useLocation();
  const state = location.state || {};
  const stepsCount = state.stepsCount ?? 0;
  const initialSessionSize = state.initialSessionSize ?? SESSION_SIZE;
  const masteredCountAtStart = state.masteredCountAtStart ?? 0;

  const [masteredCountNow, setMasteredCountNow] = useState(null);

  useEffect(() => {
    getVocabByStatus(VocabStatus.MASTERED).then((arr) => setMasteredCountNow(arr.length));
  }, []);

  const masteredDelta = masteredCountNow != null ? masteredCountNow - masteredCountAtStart : null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-6">本回合結算</h1>
      <div className="rounded-xl bg-slate-800 p-6 w-full max-w-sm space-y-4">
        <p className="text-slate-300">
          本回合練習：<span className="text-white font-medium">{initialSessionSize}</span> 張單字
        </p>
        <p className="text-slate-300">
          共作答：<span className="text-white font-medium">{stepsCount}</span> 次
        </p>
        {masteredDelta !== null && (
          <p className="text-slate-300">
            熟練單字：
            <span className={masteredDelta >= 0 ? 'text-emerald-400 font-medium' : 'text-white font-medium'}>
              {masteredDelta >= 0 ? '+' : ''}{masteredDelta}
            </span>
          </p>
        )}
      </div>
      <Link
        to="/"
        className="mt-8 min-h-[50px] px-8 py-3 rounded-xl bg-amber-500 text-white font-medium text-lg touch-manipulation flex items-center justify-center"
      >
        回首頁
      </Link>
    </div>
  );
}
