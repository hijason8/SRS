import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import {
  db,
  getVocabCount,
  getVocabByStatus,
  getTodayReviewCount,
  upsertVocab,
  exportAllAsJson,
  VocabStatus,
} from '../db';
import { parseAnkiCsv } from '../utils/parseAnkiCsv';

const MAX_VOCAB = 6000;
const PAGE_SIZE = 100;

const KANJI_KEYS = ['單字', 'word', 'kanji', '漢字', 'vocabulary'];
const KANA_KEYS = ['讀音', 'kana', 'reading', '假名', 'pronunciation'];
const MEANING_KEYS = ['意思', 'meaning', 'definition', 'definition'];

function pickFirst(obj, possibleKeys) {
  const o = obj || {};
  const keyList = possibleKeys.map((k) => k.toLowerCase());
  for (const [key, val] of Object.entries(o)) {
    if (val == null || String(val).trim() === '') continue;
    if (keyList.includes(String(key).trim().toLowerCase())) return String(val).trim();
  }
  return '';
}

function mapRowToVocab(row) {
  return {
    kanji: pickFirst(row, KANJI_KEYS) || (row[0] != null ? String(row[0]).trim() : ''),
    kana: pickFirst(row, KANA_KEYS) || (row[1] != null ? String(row[1]).trim() : ''),
    meaning: pickFirst(row, MEANING_KEYS) || (row[2] != null ? String(row[2]).trim() : ''),
    note: (row.note || row.筆記 || row.note || '').toString().trim(),
  };
}

export default function Manage() {
  const [total, setTotal] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [todayReview, setTodayReview] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [vocabList, setVocabList] = useState([]);
  const [page, setPage] = useState(0);
  const [file, setFile] = useState(null);

  const refreshStats = useCallback(async () => {
    const [count, mastered, review] = await Promise.all([
      getVocabCount(),
      (await getVocabByStatus(VocabStatus.MASTERED)).length,
      getTodayReviewCount(),
    ]);
    setTotal(count);
    setMasteredCount(mastered);
    setTodayReview(review);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    let cancelled = false;
    db.vocab
      .orderBy('kanji')
      .offset(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray()
      .then((arr) => {
        if (!cancelled) setVocabList(arr);
      });
    return () => { cancelled = true; };
  }, [page, total]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    const text = await file.text();
    const isAnki = text.includes('\t') && /\[[^\]]+\]/.test(text.split('\n')[0] || '');
    const dataArray = isAnki
      ? parseAnkiCsv(text).filter((r) => r.kanji)
      : (() => {
          const withHeaders = Papa.parse(text, { header: true, skipEmptyLines: true });
          const rows = withHeaders.data || [];
          return rows.map((row) => mapRowToVocab(row)).filter((r) => r.kanji);
        })();
    const limited = dataArray.slice(0, MAX_VOCAB);
    const result = await upsertVocab(limited);
    setImportResult(result);
    setFile(null);
    refreshStats();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportAllAsJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocab-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-8">
      <header className="flex items-center justify-between mb-6">
        <Link to="/" className="text-slate-400">首頁</Link>
        <h1 className="text-xl font-semibold">資料管理</h1>
      </header>

      {/* 統計面板 */}
      <section className="rounded-xl bg-slate-800 p-4 mb-6">
        <h2 className="text-sm font-medium text-slate-400 mb-3">統計</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-slate-400">已儲存 / {MAX_VOCAB}</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {total ? Math.round((masteredCount / total) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400">已熟練</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{todayReview}</p>
            <p className="text-xs text-slate-400">今日待複習</p>
          </div>
        </div>
      </section>

      {/* CSV 匯入 */}
      <section className="rounded-xl bg-slate-800 p-4 mb-6">
        <h2 className="text-sm font-medium text-slate-400 mb-3">匯入 CSV</h2>
        <p className="text-xs text-slate-500 mb-2">
          一般 CSV：標頭 單字/word、讀音/kana、意思/meaning。Tab 分隔且第一欄為「漢字[假名]」時自動用 Anki 解析。
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="min-h-[50px] px-4 py-3 rounded-xl bg-amber-600 text-white font-medium cursor-pointer flex items-center touch-manipulation">
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFile} />
            選擇 CSV
          </label>
          <button
            type="button"
            onClick={handleImport}
            disabled={!file}
            className="min-h-[50px] px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium disabled:opacity-50 touch-manipulation"
          >
            匯入
          </button>
        </div>
        {importResult && (
          <p className="mt-2 text-sm text-slate-400">
            新增 {importResult.added} 筆，更新 {importResult.updated} 筆（已保留進度）
          </p>
        )}
      </section>

      {/* 備份匯出 */}
      <section className="rounded-xl bg-slate-800 p-4 mb-6">
        <h2 className="text-sm font-medium text-slate-400 mb-3">備份</h2>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="min-h-[50px] px-4 py-3 rounded-xl bg-slate-600 text-white font-medium disabled:opacity-50 touch-manipulation"
        >
          {exporting ? '匯出中…' : '匯出備份檔 (JSON)'}
        </button>
      </section>

      {/* 單字表：分頁虛擬列表 */}
      <section className="rounded-xl bg-slate-800 p-4">
        <h2 className="text-sm font-medium text-slate-400 mb-3">單字表（分頁）</h2>
        {total === 0 ? (
          <p className="text-slate-500 text-sm">尚無資料，請先匯入 CSV。</p>
        ) : (
          <>
            <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
              {vocabList.map((v) => (
                <li
                  key={v.id}
                  className="flex justify-between items-center py-2 border-b border-slate-700 text-sm"
                >
                  <span className="font-medium">{v.kanji}</span>
                  <span className="text-slate-400 text-xs">
                    {v.status === VocabStatus.MASTERED ? '熟練' : v.status === VocabStatus.FUZZY ? '模糊' : '未學'}
                  </span>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="min-h-[44px] px-4 rounded-lg bg-slate-600 disabled:opacity-50"
                >
                  上一頁
                </button>
                <span className="flex items-center px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="min-h-[44px] px-4 rounded-lg bg-slate-600 disabled:opacity-50"
                >
                  下一頁
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
