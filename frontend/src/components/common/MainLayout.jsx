import { Outlet, useLocation } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';

export default function MainLayout() {
  const location = useLocation();

  return (
    <SidebarProvider className="h-svh overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="min-w-0 h-svh overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background px-4 py-4 md:px-5 xl:px-6 xl:py-5">
          <div className="w-full animate-fade-in" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
