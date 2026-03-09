import Dexie from 'dexie';

const DB_NAME = 'JapaneseVocabPWA';
const DB_VERSION = 3;

export const VocabStatus = {
  UNLEARNED: 0,
  FUZZY: 1,
  MASTERED: 2,
};

const db = new Dexie(DB_NAME);

db.version(1).stores({
  vocab: 'id, kanji, status, lastReviewed',
});

db.version(2).stores({
  vocab: 'id, kanji, status, lastReviewed, nextReviewAt',
});

db.version(3).stores({
  vocab: 'id, kanji, status, lastReviewed, nextReviewAt',
});

/**
 * 初始化並載入手機本地數據
 * 離線時也能正常運作（IndexedDB 為本地儲存）
 */
export async function initDB() {
  try {
    await db.open();
    return db;
  } catch (e) {
    console.error('initDB failed:', e);
    throw e;
  }
}

/**
 * 匯入/更新單字。若漢字已存在，更新內容但「保留」原有的 status 與 lastReviewed。
 * @param {Array<{id?: string, kanji: string, kana?: string, meaning?: string, note?: string}>} dataArray - CSV 轉出的陣列
 */
export async function upsertVocab(dataArray) {
  if (!dataArray?.length) return { added: 0, updated: 0 };

  let added = 0;
  let updated = 0;

  for (const row of dataArray) {
    const kanji = (row.kanji ?? row.word ?? row.單字 ?? '').toString().trim();
    if (!kanji) continue;

    const existing = await db.vocab.where('kanji').equals(kanji).first();

    const payload = {
      kanji,
      kana: (row.kana ?? row.reading ?? row.讀音 ?? row.kana ?? '').toString().trim(),
      meaning: (row.meaning ?? row.意思 ?? '').toString().trim(),
      note: (row.note ?? row.筆記 ?? row.note ?? '').toString().trim(),
    };

    if (existing) {
      await db.vocab.update(existing.id, {
        ...payload,
        status: existing.status,
        lastReviewed: existing.lastReviewed,
        nextReviewAt: existing.nextReviewAt ?? null,
        intervalLevel: existing.intervalLevel ?? 0,
      });
      updated++;
    } else {
      await db.vocab.add({
        id: crypto.randomUUID(),
        ...payload,
        status: VocabStatus.UNLEARNED,
        lastReviewed: null,
        nextReviewAt: null,
        intervalLevel: 0,
      });
      added++;
    }
  }

  return { added, updated };
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_INTERVAL_DAYS = 60; // 熟練後最多隔 60 天再出現

/**
 * 使用者點擊背誦結果時，更新該單字狀態與下次複習日
 * - 記得：遞增間隔 4 → 8 → 16 → 32 天…（上限 60 天），越熟越少出現
 * - 模糊：明天再出現，間隔等級歸零
 * - 忘記：下次仍會出現（nextReviewAt = null），間隔等級歸零
 */
export async function updateProgress(id, newStatus) {
  const allowed = [VocabStatus.UNLEARNED, VocabStatus.FUZZY, VocabStatus.MASTERED];
  if (!allowed.includes(newStatus)) return;

  const now = Date.now();
  let nextReviewAt = null;
  let intervalLevel = 0;

  if (newStatus === VocabStatus.MASTERED) {
    const row = await db.vocab.get(id);
    const level = row?.intervalLevel ?? 0;
    const days = Math.min(4 * 2 ** level, MAX_INTERVAL_DAYS);
    nextReviewAt = now + days * ONE_DAY_MS;
    intervalLevel = level + 1;
  } else if (newStatus === VocabStatus.FUZZY) {
    nextReviewAt = now + 1 * ONE_DAY_MS;
    intervalLevel = 0;
  }
  // 忘記：nextReviewAt 保持 null，intervalLevel 已在上面為 0

  await db.vocab.update(id, {
    status: newStatus,
    lastReviewed: now,
    nextReviewAt,
    intervalLevel,
  });
}

/** 今日 0 點的時間戳 */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * 取得本回合要複習的單字（最多 limit 筆）
 * 條件：nextReviewAt 為 null 或 <= 今日 0 點
 */
export async function getSessionWords(limit = 20) {
  const due = startOfToday();
  const all = await db.vocab.toArray();
  const filtered = all.filter(
    (v) => v.nextReviewAt == null || v.nextReviewAt <= due
  );
  return filtered.slice(0, limit);
}

export async function getAllVocab() {
  return db.vocab.toArray();
}

export async function getVocabCount() {
  return db.vocab.count();
}

export async function getVocabByStatus(status) {
  return db.vocab.where('status').equals(status).toArray();
}

/** 今日待複習數量：nextReviewAt 為 null 或 <= 今日 0 點 */
export async function getTodayReviewCount() {
  const due = startOfToday();
  const all = await db.vocab.toArray();
  return all.filter((v) => v.nextReviewAt == null || v.nextReviewAt <= due).length;
}

/** 匯出全部學習進度為 JSON（備份用） */
export async function exportAllAsJson() {
  const list = await db.vocab.toArray();
  return JSON.stringify(list, null, 2);
}

export { db };
