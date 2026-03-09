# 日文單字 PWA

React + Tailwind CSS 的日文單字背誦 PWA，專為 iPhone 設計，離線可用。

## 技術棧

- **React** + **Vite**
- **Tailwind CSS v4**
- **Dexie.js**（IndexedDB）
- **PapaParse**（CSV 匯入）
- **React Router**

## 功能

### 第一階段：資料庫
- `vocab` 表：id, kanji, kana, meaning, note, status (0 未學 / 1 模糊 / 2 熟練), lastReviewed
- `initDB()`：初始化並載入手機本地資料
- `upsertVocab(dataArray)`：CSV 匯入；若漢字已存在則**保留**原有 status 與 lastReviewed
- `updateProgress(id, newStatus)`：即時更新單字狀態
- 離線可運作（IndexedDB 本地儲存）

### 第二階段：單字卡與發音
- 第一層：畫面中央顯示漢字
- 第二層：「解鎖發音」/「聽發音」按鈕，`speechSynthesis` 日文朗讀，語速 0.8
- 第三層：「看提示」顯示假名與筆記
- 第四層：「看答案」顯示中文意思
- 回饋：「忘記」「模糊」「記得」更新資料庫並切換下一題
- iPhone：按鈕至少 50px、`user-select: none`、解鎖發音一次以符合 iOS 音訊政策

### 第三階段：資料管理
- CSV 匯入：PapaParse 解析，自動對應「單字 / 讀音 / 意思」等標頭
- 統計：總數（上限 6000）、已熟練百分比、今日待複習數
- 單字表：分頁載入（每頁 100 筆），避免大量資料卡頓
- 匯出備份：將全部學習進度匯出為 JSON 下載

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
npm run preview  # 預覽 production 建置
```

## 部署

專案已設定好 SPA 路由轉發，可選以下任一方式部署（皆免費、HTTPS、適合手機開啟）。

### 方式一：Vercel（推薦）

1. 將專案推到 [GitHub](https://github.com)（若尚未）。
2. 前往 [vercel.com](https://vercel.com)，用 GitHub 登入。
3. 點「Add New」→「Project」，選你的 repo，直接 Deploy。
4. 完成後會得到網址，例如 `https://xxx.vercel.app`，用 iPhone Safari 開啟即可。

之後每次 push 到 GitHub，Vercel 會自動重新部署。

### 方式二：Netlify

1. 前往 [netlify.com](https://netlify.com)，用 GitHub 登入。
2. 「Add new site」→「Import an existing project」→ 選 GitHub 與 repo。
3. Build command 填 `npm run build`，Publish directory 填 `dist`（若用專案裡的 `netlify.toml` 會自動帶入）。
4. Deploy 後會得到 `https://xxx.netlify.app`。

### 方式三：手動上傳（不依賴 Git）

1. 本機執行 `npm run build`，會產生 `dist` 資料夾。
2. 到 [Netlify Drop](https://app.netlify.com/drop) 或 [Vercel](https://vercel.com) 的「Upload」把整個 `dist` 拖曳上傳，即可取得網址。

### iPhone 加到主畫面（當 App 用）

用 Safari 開啟你的部署網址 → 分享 →「加入主畫面」，之後可像 App 一樣開啟，且資料存在手機 IndexedDB，離線也能複習。

## 使用流程建議

1. **第一階段**：先手動或匯入幾筆測試，確認資料庫與離線正常。
2. **第二階段**：使用「開始複習」體驗漸進式提示與發音。
3. **第三階段**：從網路取得 CSV（單字、讀音、意思），在「資料管理」匯入，必要時匯出備份。

## CSV 範例

支援標頭例如：`單字` / `word` / `kanji`、`讀音` / `kana` / `reading`、`意思` / `meaning`。

```csv
單字,讀音,意思
日本,にほん,日本
```
