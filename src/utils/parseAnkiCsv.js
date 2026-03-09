/**
 * 解析 Anki 風格的 Tab 分隔 CSV（第一欄為 漢字[假名] 格式）。
 * - 分隔符號：\t
 * - 第一欄拆成 kanji（去掉括號）與 kana（括號內相連）
 * - meaning 自動從第 5/6 欄（或鄰近欄位）偵測，並過濾 [sound:...]
 *
 * 範例轉換：
 * 輸入：銀[ぎん] 行[こう] 員[いん]\t③\t名\t銀行職員
 * 輸出：{ kanji: "銀行員", kana: "ぎんこういん", meaning: "銀行職員" }
 */

/** 移除字串中所有 [sound:...] 標籤 */
function stripSoundTags(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\[sound:[^\]]*\]/gi, '').trim();
}

/**
 * 從第一欄「漢字[假名] 漢字[假名]」拆出 kanji 與 kana
 * 例：学[がく] 生[せい] → kanji: 学生, kana: がくせい
 */
function parseKanjiKana(firstCol) {
  const s = (firstCol || '').trim();
  if (!s) return { kanji: '', kana: '' };

  const kanji = s
    .replace(/\s+/g, '')
    .replace(/\[[^\]]+\]/g, '');
  const kanaMatches = s.match(/\[([^\]]+)\]/g);
  const kana = kanaMatches ? kanaMatches.map((m) => m.slice(1, -1)).join('') : '';

  return { kanji, kana };
}

/**
 * 判斷是否像「意思」欄位：非僅符號、非僅聲調標記（如 ③、⓪）、非僅詞性（名、接尾）
 */
function looksLikeMeaning(str) {
  const t = str.trim();
  if (!t) return false;
  if (/^[①②③④⑤⑥⑦⑧⑨⑩⓪]+$/.test(t)) return false;
  if (/^[ぁ-んァ-ン]+$/.test(t)) return false; // 僅假名視為讀音
  if (/^(名|接尾|動|形|副|助|感)$/.test(t)) return false; // 單一詞性標籤
  return true;
}

/**
 * 從一行的欄位中自動選出 meaning（你的格式：第 6 欄為意思，第 7 欄為 [sound:...]）
 * 並過濾 [sound:...]
 */
function pickMeaning(cols) {
  const indices = [5, 4, 6, 3, 2]; // 第6欄(index 5)優先，再試第5、第7、第4、第3
  for (const i of indices) {
    if (i >= cols.length) continue;
    const cell = stripSoundTags(cols[i]);
    if (cell && looksLikeMeaning(cell)) return cell;
  }
  return '';
}

/**
 * 解析 Anki 風格 Tab 分隔內容，回傳 { kanji, kana, meaning } 陣列
 * @param {string} content - 檔案全文（Tab 分隔，一筆一行）
 * @returns {Array<{ kanji: string, kana: string, meaning: string }>}
 */
export function parseAnkiCsv(content) {
  if (!content || typeof content !== 'string') return [];

  const lines = content.trim().split(/\r?\n/);
  const result = [];

  for (const line of lines) {
    const cols = line.split('\t');
    const first = (cols[0] || '').trim();
    if (!first) continue;

    const { kanji, kana } = parseKanjiKana(first);
    if (!kanji) continue;

    const meaning = pickMeaning(cols);

    result.push({
      kanji,
      kana,
      meaning,
    });
  }

  return result;
}
