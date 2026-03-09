import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { initDB } from './db';
import Home from './pages/Home';
import Review from './pages/Review';
import ReviewSummary from './pages/ReviewSummary';
import Manage from './pages/Manage';

export default function App() {
  useEffect(() => {
    initDB().catch(console.error);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/review" element={<Review />} />
        <Route path="/review/summary" element={<ReviewSummary />} />
        <Route path="/manage" element={<Manage />} />
      </Routes>
    </BrowserRouter>
  );
}
