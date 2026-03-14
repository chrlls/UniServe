import { Outlet, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';
import { useAccountPreferences } from '@/lib/preferences';

export default function MainLayout() {
  const location = useLocation();
  const [isTopbarScrolled, setIsTopbarScrolled] = useState(false);
  const { t } = useAccountPreferences();

  const pageTitle = useMemo(() => {
    const { pathname } = location;

    if (pathname === '/admin/dashboard') return t('mainLayout.dashboard');
    if (pathname === '/admin/menu') return t('mainLayout.menu');
    if (pathname === '/admin/orders' || pathname === '/cashier/orders') return t('mainLayout.orders');
    if (pathname === '/admin/inventory') return t('mainLayout.inventory');
    if (pathname === '/admin/users') return t('mainLayout.users');
    if (pathname === '/admin/reports') return t('mainLayout.reports');
    if (pathname === '/admin/settings') return t('mainLayout.settings');
    if (pathname === '/cashier/pos') return t('mainLayout.pos');
    if (pathname === '/menu') return t('mainLayout.browseMenu');
    if (pathname === '/orders') return t('mainLayout.myOrders');
    if (pathname.startsWith('/orders/')) return t('mainLayout.orderDetails');

    return t('mainLayout.dashboard');
  }, [location, t]);

  return (
    <SidebarProvider className="h-svh overflow-hidden bg-background">
      <AppSidebar />
      <SidebarInset className="min-w-0 h-svh overflow-hidden print:m-0 print:min-h-0 print:rounded-none print:shadow-none">
        <main
          className="flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden bg-background px-4 pb-4 pt-2 md:px-5 xl:px-6 xl:pb-5 xl:pt-2 print:h-auto print:overflow-visible print:px-0 print:pb-0 print:pt-0"
          onScroll={(event) => {
            const nextScrolled = event.currentTarget.scrollTop > 12;
            setIsTopbarScrolled((current) => (current === nextScrolled ? current : nextScrolled));
          }}
        >
          <Topbar title={pageTitle} isScrolled={isTopbarScrolled} />
          <div className="w-full animate-fade-in pt-2 print:pt-0" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
