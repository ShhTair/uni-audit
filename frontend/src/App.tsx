import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import UniversityDetail from '@/pages/UniversityDetail';
import PageReport from '@/pages/PageReport';
import Brandbook from '@/pages/Brandbook';
import PlaygroundPage from "@/pages/PlaygroundPage";
import GuideGenerator from '@/pages/GuideGenerator';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Standalone full-page routes (have their own header/nav) */}
          <Route path="/brandbook" element={<ErrorBoundary><Brandbook /></ErrorBoundary>} />
          <Route path="/playground" element={<ErrorBoundary><PlaygroundPage /></ErrorBoundary>} />
          {/* App shell routes — wrapped in Layout (sidebar + main) */}
          <Route element={<Layout />}>
            <Route path="/" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
            <Route path="/university/:id" element={<ErrorBoundary><UniversityDetail /></ErrorBoundary>} />
            <Route path="/university/:id/guide" element={<ErrorBoundary><GuideGenerator /></ErrorBoundary>} />
            <Route path="/university/:id/page/:pageId" element={<ErrorBoundary><PageReport /></ErrorBoundary>} />
          </Route>
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  );
}
