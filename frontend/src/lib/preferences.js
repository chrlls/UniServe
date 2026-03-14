import { useSyncExternalStore } from 'react';

export const ACCOUNT_SETTINGS_KEY = 'settings_account_preferences';
const PREFERENCES_EVENT = 'app:preferences-changed';

const DEFAULT_ACCOUNT_SETTINGS = {
  username: '',
  timezone: 'Asia/Manila',
  timeFormat: 'browser',
  weekStart: 'sunday',
  language: 'browser',
};
const DEFAULT_SETTINGS_SNAPSHOT = Object.freeze({
  ...DEFAULT_ACCOUNT_SETTINGS,
});
let cachedSettingsRaw = null;
let cachedSettingsSnapshot = DEFAULT_SETTINGS_SNAPSHOT;

const UI_COPY = {
  en: {
    'common.walkIn': 'Walk-in',
    'common.orderSource.walkIn': 'Walk-in',
    'common.orderSource.online': 'Online',
    'common.orderSource.label': 'Order Source',
    'common.justNow': 'Just now',
    'topbar.search': 'Search menu, orders...',
    'mainLayout.dashboard': 'Dashboard',
    'mainLayout.menu': 'Menu Management',
    'mainLayout.orders': 'Order Queue',
    'mainLayout.inventory': 'Inventory',
    'mainLayout.users': 'User Management',
    'mainLayout.reports': 'Reports',
    'mainLayout.settings': 'Settings',
    'mainLayout.pos': 'POS Terminal',
    'mainLayout.browseMenu': 'Browse Menu',
    'mainLayout.myOrders': 'My Orders',
    'mainLayout.orderDetails': 'Order Details',
    'dashboard.greeting.morning': 'Good morning',
    'dashboard.greeting.afternoon': 'Good afternoon',
    'dashboard.greeting.evening': 'Good evening',
    'dashboard.subtitle': "Here's what's happening in your canteen today.",
    'dashboard.actions.newOrder': 'New Order',
    'dashboard.actions.viewReports': 'View Reports',
    'dashboard.kpi.totalRevenue.title': 'Total Revenue',
    'dashboard.kpi.totalRevenue.hint': 'vs last period',
    'dashboard.kpi.totalOrders.title': 'Total Orders',
    'dashboard.kpi.totalOrders.hint': 'orders recorded',
    'dashboard.kpi.averageOrderValue.title': 'Avg Order Value',
    'dashboard.kpi.averageOrderValue.hint': 'per transaction',
    'dashboard.kpi.todaysRevenue.title': "Today's Revenue",
    'dashboard.kpi.todaysRevenue.hint': 'live today',
    'dashboard.kpi.pendingOrders.title': 'Pending Orders',
    'dashboard.kpi.pendingOrders.hint': 'awaiting action',
    'dashboard.kpi.lowStockItems.title': 'Low Stock Items',
    'dashboard.kpi.lowStockItems.hint': 'needs restock',
    'dashboard.lowStockAlert': '{count} item running low on stock:',
    'dashboard.manage': 'Manage',
    'dashboard.charts.dailyRevenue.title': 'Daily Revenue',
    'dashboard.charts.dailyRevenue.description': 'Revenue per day over the reporting period',
    'dashboard.charts.salesByCategory.title': 'Sales by Category',
    'dashboard.charts.salesByCategory.description': 'Revenue breakdown across menu categories',
    'dashboard.charts.orderTrends.title': 'Order Trends',
    'dashboard.charts.orderTrends.description': 'Order volume and revenue over time',
    'dashboard.recentOrders.title': 'Recent Orders',
    'dashboard.recentOrders.latest': '{count} latest',
    'dashboard.recentOrders.viewAll': 'View all orders',
    'dashboard.bestSelling.title': 'Best Selling Items',
    'dashboard.bestSelling.viewAll': 'View full report',
    'dashboard.bestSelling.sold': '{count} sold',
    'menu.outOfStock': 'Out of Stock',
    'menu.stockLeft': '{count} left',
    'menu.addToCart': 'Add to Cart',
    'pos.title': 'POS Terminal',
    'pos.searchPlaceholder': 'Search items...',
    'pos.all': 'All',
    'pos.orderPlaced': 'Order Placed!',
    'pos.total': 'Total',
    'pos.newOrder': 'New Order',
    'pos.cart': 'Cart',
    'pos.cartItemsCount': '({count} items)',
    'pos.emptyCart': 'Tap items to add them to the cart',
    'pos.payment.cash': 'Cash',
    'pos.payment.card': 'Card',
    'pos.placeOrder': 'Place Order',
    'pos.placingOrder': 'Placing Order...',
    'pos.clearCart': 'Clear Cart',
    'orderQueue.title': 'Order Queue',
    'orderQueue.activeOrders': '{count} active orders',
    'orderQueue.searchPlaceholder': 'Search by order number...',
    'orderQueue.pending': 'Pending',
    'orderQueue.preparing': 'Preparing',
    'orderQueue.ready': 'Ready for Pickup',
    'orderQueue.completed': 'Completed',
    'orderQueue.cancelled': 'Cancelled',
    'orderQueue.refresh': 'Refresh',
    'orderQueue.noOrders': 'No orders in this lane',
    'orderQueue.moreItems': '+{count} more items',
    'orderQueue.pageOf': 'Page {page} of {total}',
    'orderQueue.archiveSummary': '{completed} done · {cancelled} cancelled',
    'orderQueue.action.startPreparing': 'Start Preparing',
    'orderQueue.action.markReady': 'Mark Ready',
    'orderQueue.action.completeOrder': 'Complete Order',
    'orderQueue.payment.cash': 'Cash',
    'orderQueue.payment.card': 'Card',
    'notifications.title': 'Notifications',
    'notifications.none': 'No recent notifications.',
    'notifications.markAllRead': 'Mark all as read',
    'notifications.lowStockAlert': 'Low Stock Alert',
  },
  fil: {
    'common.walkIn': 'Walk-in',
    'common.orderSource.walkIn': 'Walk-in',
    'common.orderSource.online': 'Online',
    'common.orderSource.label': 'Pinagmulan ng Order',
    'common.justNow': 'Ngayon lang',
    'topbar.search': 'Maghanap ng menu o order...',
    'mainLayout.dashboard': 'Dashboard',
    'mainLayout.menu': 'Pamamahala ng Menu',
    'mainLayout.orders': 'Pila ng Order',
    'mainLayout.inventory': 'Imbentaryo',
    'mainLayout.users': 'Pamamahala ng User',
    'mainLayout.reports': 'Mga Ulat',
    'mainLayout.settings': 'Settings',
    'mainLayout.pos': 'POS Terminal',
    'mainLayout.browseMenu': 'Tingnan ang Menu',
    'mainLayout.myOrders': 'Aking Mga Order',
    'mainLayout.orderDetails': 'Detalye ng Order',
    'dashboard.greeting.morning': 'Magandang umaga',
    'dashboard.greeting.afternoon': 'Magandang hapon',
    'dashboard.greeting.evening': 'Magandang gabi',
    'dashboard.subtitle': 'Narito ang nangyayari sa iyong kantina ngayong araw.',
    'dashboard.actions.newOrder': 'Bagong Order',
    'dashboard.actions.viewReports': 'Tingnan ang Mga Ulat',
    'dashboard.kpi.totalRevenue.title': 'Kabuuang Kita',
    'dashboard.kpi.totalRevenue.hint': 'kumpara sa huling yugto',
    'dashboard.kpi.totalOrders.title': 'Kabuuang Order',
    'dashboard.kpi.totalOrders.hint': 'naitalang order',
    'dashboard.kpi.averageOrderValue.title': 'Karaniwang Halaga ng Order',
    'dashboard.kpi.averageOrderValue.hint': 'bawat transaksyon',
    'dashboard.kpi.todaysRevenue.title': 'Kita Ngayon',
    'dashboard.kpi.todaysRevenue.hint': 'ngayong araw',
    'dashboard.kpi.pendingOrders.title': 'Mga Naka-pending na Order',
    'dashboard.kpi.pendingOrders.hint': 'naghihintay ng aksyon',
    'dashboard.kpi.lowStockItems.title': 'Mga Item na Mababa ang Stock',
    'dashboard.kpi.lowStockItems.hint': 'kailangang dagdagan',
    'dashboard.lowStockAlert': 'May {count} item na paubos na ang stock:',
    'dashboard.manage': 'Pamahalaan',
    'dashboard.charts.dailyRevenue.title': 'Kita Kada Araw',
    'dashboard.charts.dailyRevenue.description': 'Kita bawat araw sa napiling saklaw ng ulat',
    'dashboard.charts.salesByCategory.title': 'Benta ayon sa Kategorya',
    'dashboard.charts.salesByCategory.description': 'Hati ng kita sa mga kategorya ng menu',
    'dashboard.charts.orderTrends.title': 'Trend ng Mga Order',
    'dashboard.charts.orderTrends.description': 'Dami ng order at kita sa paglipas ng panahon',
    'dashboard.recentOrders.title': 'Mga Kamakailang Order',
    'dashboard.recentOrders.latest': '{count} pinakabago',
    'dashboard.recentOrders.viewAll': 'Tingnan lahat ng order',
    'dashboard.bestSelling.title': 'Mga Pinakamabentang Item',
    'dashboard.bestSelling.viewAll': 'Tingnan ang buong ulat',
    'dashboard.bestSelling.sold': '{count} nabenta',
    'menu.outOfStock': 'Ubos na ang Stock',
    'menu.stockLeft': '{count} natitira',
    'menu.addToCart': 'Idagdag sa Cart',
    'pos.title': 'POS Terminal',
    'pos.searchPlaceholder': 'Maghanap ng mga item...',
    'pos.all': 'Lahat',
    'pos.orderPlaced': 'Naiproseso na ang Order!',
    'pos.total': 'Kabuuan',
    'pos.newOrder': 'Bagong Order',
    'pos.cart': 'Cart',
    'pos.cartItemsCount': '({count} item)',
    'pos.emptyCart': 'I-tap ang mga item para maidagdag sa cart',
    'pos.payment.cash': 'Cash',
    'pos.payment.card': 'Card',
    'pos.placeOrder': 'Iproseso ang Order',
    'pos.placingOrder': 'Pinoproseso ang Order...',
    'pos.clearCart': 'I-clear ang Cart',
    'orderQueue.title': 'Pila ng Order',
    'orderQueue.activeOrders': '{count} aktibong order',
    'orderQueue.searchPlaceholder': 'Maghanap gamit ang order number...',
    'orderQueue.pending': 'Pending',
    'orderQueue.preparing': 'Inihahanda',
    'orderQueue.ready': 'Handa para Kunin',
    'orderQueue.completed': 'Nakumpleto',
    'orderQueue.cancelled': 'Kinansela',
    'orderQueue.refresh': 'I-refresh',
    'orderQueue.noOrders': 'Walang order sa lane na ito',
    'orderQueue.moreItems': '+{count} pang item',
    'orderQueue.pageOf': 'Pahina {page} ng {total}',
    'orderQueue.archiveSummary': '{completed} tapos · {cancelled} kinansela',
    'orderQueue.action.startPreparing': 'Simulan ang Paghahanda',
    'orderQueue.action.markReady': 'Markahang Handa',
    'orderQueue.action.completeOrder': 'Kumpletuhin ang Order',
    'orderQueue.payment.cash': 'Cash',
    'orderQueue.payment.card': 'Card',
    'notifications.title': 'Mga Notification',
    'notifications.none': 'Wala pang kamakailang notification.',
    'notifications.markAllRead': 'Markahan lahat bilang nabasa',
    'notifications.lowStockAlert': 'Babala sa Mababang Stock',
  },
};

function isBrowser() {
  return typeof window !== 'undefined';
}

function readLocalObject(key, fallback) {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);

    return typeof parsed === 'object' && parsed !== null
      ? { ...fallback, ...parsed }
      : fallback;
  } catch {
    return fallback;
  }
}

function readSettingsSnapshot() {
  if (!isBrowser()) return DEFAULT_SETTINGS_SNAPSHOT;

  const raw = window.localStorage.getItem(ACCOUNT_SETTINGS_KEY);

  if (raw === cachedSettingsRaw) {
    return cachedSettingsSnapshot;
  }

  cachedSettingsRaw = raw;
  cachedSettingsSnapshot = raw
    ? readLocalObject(ACCOUNT_SETTINGS_KEY, DEFAULT_ACCOUNT_SETTINGS)
    : DEFAULT_SETTINGS_SNAPSHOT;

  return cachedSettingsSnapshot;
}

function resolveLanguageLocale(language) {
  if (!isBrowser()) return 'en-US';

  switch (language) {
    case 'english':
      return 'en-US';
    case 'filipino':
      return 'fil-PH';
    case 'browser':
    default:
      return window.navigator.language || 'en-US';
  }
}

function resolveLanguageCode(language) {
  if (!isBrowser()) return 'en';

  switch (language) {
    case 'english':
      return 'en';
    case 'filipino':
      return 'fil';
    case 'browser':
    default: {
      const browserLanguage = (window.navigator.language || 'en-US').toLowerCase();
      return browserLanguage.startsWith('fil') || browserLanguage.startsWith('tl')
        ? 'fil'
        : 'en';
    }
  }
}

function resolveHour12(timeFormat) {
  if (timeFormat === '12h') return true;
  if (timeFormat === '24h') return false;
  return undefined;
}

function hasTimeFormatting(options = {}) {
  return ['hour', 'minute', 'second', 'timeStyle'].some((key) => key in options);
}

function getDateFromInput(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }
  return new Date(value);
}

function formatDateParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;

  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
  };
}

function parseIsoDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function interpolateText(template, replacements = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = replacements[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export function getStoredAccountSettings() {
  return readSettingsSnapshot();
}

export function setStoredAccountSettings(nextSettings) {
  if (!isBrowser()) return;

  const mergedSettings = {
    ...DEFAULT_ACCOUNT_SETTINGS,
    ...nextSettings,
  };
  const nextRaw = JSON.stringify(mergedSettings);

  cachedSettingsRaw = nextRaw;
  cachedSettingsSnapshot = mergedSettings;
  window.localStorage.setItem(ACCOUNT_SETTINGS_KEY, nextRaw);
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT));
}

function subscribeToPreferences(callback) {
  if (!isBrowser()) return () => {};

  const handler = () => callback();
  window.addEventListener('storage', handler);
  window.addEventListener(PREFERENCES_EVENT, handler);

  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener(PREFERENCES_EVENT, handler);
  };
}

export function getTodayDateString(settings = getStoredAccountSettings()) {
  const parts = formatDateParts(new Date(), settings.timezone);

  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function getLastNDaysRange(days, settings = getStoredAccountSettings()) {
  const endDate = parseIsoDate(getTodayDateString(settings));
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - Math.max(days - 1, 0));

  return {
    start_date: toIsoDate(startDate),
    end_date: toIsoDate(endDate),
  };
}

export function getWeekToDateRange(settings = getStoredAccountSettings()) {
  const endDate = parseIsoDate(getTodayDateString(settings));
  const startDate = new Date(endDate);
  const weekStartIndex = settings.weekStart === 'monday' ? 1 : 0;
  const dayIndex = startDate.getUTCDay();
  const diff = (dayIndex - weekStartIndex + 7) % 7;

  startDate.setUTCDate(startDate.getUTCDate() - diff);

  return {
    start_date: toIsoDate(startDate),
    end_date: toIsoDate(endDate),
  };
}

export function useAccountPreferences() {
  const settings = useSyncExternalStore(
    subscribeToPreferences,
    getStoredAccountSettings,
    () => DEFAULT_SETTINGS_SNAPSHOT,
  );

  const locale = resolveLanguageLocale(settings.language);
  const languageCode = resolveLanguageCode(settings.language);
  const hour12 = resolveHour12(settings.timeFormat);
  const dictionary = UI_COPY[languageCode] ?? UI_COPY.en;

  function formatDate(value, options = {}) {
    const date = getDateFromInput(value);
    if (Number.isNaN(date.getTime())) return '';

    const formatterOptions = {
      timeZone: settings.timezone,
      ...options,
    };

    if (hasTimeFormatting(formatterOptions) && hour12 !== undefined) {
      formatterOptions.hour12 = hour12;
    }

    return new Intl.DateTimeFormat(locale, formatterOptions).format(date);
  }

  function formatTime(value, options = {}) {
    return formatDate(value, {
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  }

  function formatDateTime(value, options = {}) {
    return formatDate(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      ...options,
    });
  }

  function formatNumber(value, options = {}) {
    return Number(value || 0).toLocaleString(locale, options);
  }

  function formatRelativeTime(value) {
    const date = getDateFromInput(value);
    if (Number.isNaN(date.getTime())) return '';

    const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const absSeconds = Math.abs(diffInSeconds);

    if (absSeconds < 60) return rtf.format(diffInSeconds, 'second');

    const diffInMinutes = Math.round(diffInSeconds / 60);
    if (Math.abs(diffInMinutes) < 60) return rtf.format(diffInMinutes, 'minute');

    const diffInHours = Math.round(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) return rtf.format(diffInHours, 'hour');

    const diffInDays = Math.round(diffInHours / 24);
    return rtf.format(diffInDays, 'day');
  }

  function getCurrentHour() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: settings.timezone,
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date());

    return Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  }

  function t(key, replacements = {}) {
    const template = dictionary[key] ?? UI_COPY.en[key] ?? key;
    return interpolateText(template, replacements);
  }

  return {
    accountSettings: settings,
    locale,
    languageCode,
    formatDate,
    formatTime,
    formatDateTime,
    formatNumber,
    formatRelativeTime,
    getCurrentHour,
    t,
    getTodayDateString: () => getTodayDateString(settings),
    getLastNDaysRange: (days) => getLastNDaysRange(days, settings),
    getWeekToDateRange: () => getWeekToDateRange(settings),
    saveAccountSettings: setStoredAccountSettings,
  };
}
