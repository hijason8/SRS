import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-2">日文單字 PWA</h1>
      <p className="text-slate-400 text-sm mb-8">專為 iPhone 設計，離線也能背單字</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          to="/review"
          className="min-h-[50px] flex items-center justify-center rounded-xl bg-amber-500 text-white font-medium text-lg touch-manipulation"
        >
          開始複習
        </Link>
        <Link
          to="/manage"
          className="min-h-[50px] flex items-center justify-center rounded-xl bg-slate-600 text-white font-medium touch-manipulation"
        >
          資料管理
        </Link>
      </div>
    </div>
  );
}
