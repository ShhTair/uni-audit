import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import UniversityDetail from '@/pages/UniversityDetail';
import PageReport from '@/pages/PageReport';
import Brandbook from '@/pages/Brandbook';
import PlaygroundPage from "@/pages/PlaygroundPage";
import GuideGenerator from '@/pages/GuideGenerator';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/university/:id" element={<UniversityDetail />} />
          <Route path="/university/:id/guide" element={<GuideGenerator />} />
          <Route path="/university/:id/page/:pageId" element={<PageReport />} />
          <Route path="/brandbook" element={<Brandbook />} />
          <Route path="/playground" element={<PlaygroundPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}
