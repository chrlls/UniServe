let chartModulesPromise = null;
let dashboardPrefetchPromise = null;
let reportsPrefetchPromise = null;

function preloadChartModules() {
  if (!chartModulesPromise) {
    chartModulesPromise = Promise.all([
      import('./SalesChart'),
      import('./CategoryPieChart'),
      import('./OrderTrendChart'),
    ]).catch(() => {
      chartModulesPromise = null;
    });
  }

  return chartModulesPromise;
}

export function preloadDashboardIntent() {
  if (!dashboardPrefetchPromise) {
    dashboardPrefetchPromise = Promise.all([
      import('./AdminDashboard'),
      preloadChartModules(),
    ]).catch(() => {
      dashboardPrefetchPromise = null;
    });
  }

  return dashboardPrefetchPromise;
}

export function preloadReportsIntent() {
  if (!reportsPrefetchPromise) {
    reportsPrefetchPromise = Promise.all([
      import('./ReportsPage'),
      preloadChartModules(),
    ]).catch(() => {
      reportsPrefetchPromise = null;
    });
  }

  return reportsPrefetchPromise;
}
