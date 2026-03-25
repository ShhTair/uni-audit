import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { GeometricPattern } from '@/components/ui/GeometricPattern';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto relative z-0">
        <GeometricPattern />
        <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

