import { useEffect, useMemo, useState } from "react";
import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";
import { Bell, CheckCheck, ChevronRight, SidebarIcon } from "lucide-react";
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useAccountPreferences } from "@/lib/preferences";
import { useNavigate } from "react-router-dom";
import orderService from "@/services/orderService";
import inventoryService from "@/services/inventoryService";

const NOTIFICATION_READ_KEY = "topbar_read_notifications";

function orderStatusText(status) {
  switch (status) {
    case "pending":
      return "is awaiting preparation";
    case "preparing":
      return "is now being prepared";
    case "ready":
      return "is ready for pickup";
    case "completed":
      return "has been completed";
    case "cancelled":
      return "was cancelled";
    default:
      return "was updated";
  }
}

export function Topbar({
  title = "Dashboard",
  breadcrumbs,
  isScrolled = false,
}) {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { isDark, toggle, toggleRef } = useTheme();
  const { formatDateTime, t } = useAccountPreferences();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    if (typeof window === "undefined") return [];

    try {
      const raw = window.localStorage.getItem(NOTIFICATION_READ_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  const normalizedNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications],
  );
  const hasUnreadNotifications = unreadCount > 0;
  const topbarSurfaceClass = isDark
    ? isScrolled
      ? "bg-[#0d121b]/72 shadow-[0_16px_40px_rgba(0,0,0,0.52)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#0d121b]/58"
      : "bg-[#101823]/96 shadow-[0_8px_22px_rgba(0,0,0,0.22)]"
    : isScrolled
      ? "bg-[#f6f8fb]/82 shadow-[0_14px_34px_rgba(15,23,42,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#f6f8fb]/70"
      : "bg-[#f8fafc]/92 shadow-[0_8px_22px_rgba(15,23,42,0.07)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#f8fafc]/88";
  const iconButtonClass = isDark
    ? "text-foreground hover:bg-white/6"
    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900";
  const titleClass = isDark ? "text-foreground" : "text-slate-900";
  const crumbClass = isDark
    ? "text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
    : "cursor-pointer text-slate-500 transition-colors hover:text-slate-900";

  function persistReadNotificationIds(nextIds) {
    setReadNotificationIds(nextIds);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        NOTIFICATION_READ_KEY,
        JSON.stringify(nextIds),
      );
    }
  }

  function markNotificationAsRead(notificationId) {
    if (readNotificationIds.includes(notificationId)) return;
    persistReadNotificationIds([...readNotificationIds, notificationId]);
  }

  function handleMarkAllAsRead() {
    const unreadIds = notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    persistReadNotificationIds([
      ...new Set([...readNotificationIds, ...unreadIds]),
    ]);
  }

  useEffect(() => {
    let isActive = true;

    async function loadNotifications() {
      if (!userId) {
        if (isActive) setNotifications([]);
        return;
      }

      const [ordersResult, inventoryResult] = await Promise.allSettled([
        orderService.getAll(),
        userRole === "admin" || userRole === "cashier"
          ? inventoryService.getAll({ low_stock_only: true })
          : Promise.resolve({ inventoryItems: [] }),
      ]);

      if (
        ordersResult.status === "rejected" &&
        inventoryResult.status === "rejected"
      ) {
        return;
      }

      const orders =
        ordersResult.status === "fulfilled" && Array.isArray(ordersResult.value)
          ? ordersResult.value
          : [];

      const inventoryItems =
        inventoryResult.status === "fulfilled" &&
        Array.isArray(inventoryResult.value?.inventoryItems)
          ? inventoryResult.value.inventoryItems
          : [];

      const orderNotifications = orders.slice(0, 4).map((order) => {
        const notificationId = `order-${order.id}-${order.updated_at ?? order.created_at ?? order.ordered_at}`;
        const timestamp = new Date(
          order.updated_at ??
            order.created_at ??
            order.ordered_at ??
            Date.now(),
        ).getTime();
        return {
          id: notificationId,
          title: `Order ${order.order_number}`,
          message:
            order.status === "cancelled"
              ? "Order was cancelled."
              : `Status ${orderStatusText(order.status)}.`,
          timestamp,
          href: `/orders/${order.id}`,
          timeLabel: Number.isFinite(timestamp) ? formatDateTime(timestamp) : t("common.justNow"),
          isRead: readNotificationIds.includes(notificationId),
        };
      });

      const lowStockNotifications = inventoryItems.slice(0, 2).map((item) => {
        const notificationId = `stock-${item.id}-${item.updated_at ?? item.created_at}`;
        const timestamp = new Date(
          item.updated_at ?? item.created_at ?? Date.now(),
        ).getTime();
        return {
          id: notificationId,
          title: t("notifications.lowStockAlert"),
          message: `${item.name} is at ${item.stock_quantity} remaining.`,
          timestamp,
          timeLabel: Number.isFinite(timestamp) ? formatDateTime(timestamp) : t("common.justNow"),
          isRead: readNotificationIds.includes(notificationId),
        };
      });

      const merged = [...orderNotifications, ...lowStockNotifications]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

      if (isActive) {
        setNotifications(merged);
      }
    }

    loadNotifications();
    const interval = setInterval(loadNotifications, 45000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [formatDateTime, readNotificationIds, t, userId, userRole]);

  return (
    <div className="sticky top-0 z-40 w-full pb-2 print:hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className={`relative z-10 flex h-[72px] w-full items-center justify-between gap-4 overflow-hidden rounded-2xl px-6 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-250 ease-out ${topbarSurfaceClass}`}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`h-9 w-9 lg:hidden ${iconButtonClass}`}
          >
            <SidebarIcon className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            {breadcrumbs ? (
              <nav className="flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {index === breadcrumbs.length - 1 ? (
                      <span className={`font-medium ${titleClass}`}>
                        {crumb.label}
                      </span>
                    ) : (
                      <span className={crumbClass}>
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            ) : (
              <h1 className={`text-xl font-semibold ${titleClass}`}>{title}</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Theme toggle */}
          <div
            ref={toggleRef}
            className="flex items-center justify-center h-8 w-8"
          >
            <Classic
              duration={500}
              toggled={isDark}
              onToggle={toggle}
              className={isDark ? "text-foreground" : "text-slate-700"}
              style={{ fontSize: "1.1rem" }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-9 w-9 ${iconButtonClass}`}
                aria-label="Notifications"
                title="View notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span
                    className="pointer-events-none absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {Math.min(unreadCount, 9)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-80 rounded-2xl border-border/60 p-1.5"
            >
              <DropdownMenuLabel className="flex items-center justify-between gap-3 px-2 py-2">
                <span>{t("notifications.title")}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleMarkAllAsRead}
                  disabled={!hasUnreadNotifications}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t("notifications.markAllRead")}
                </Button>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {normalizedNotifications.length === 0 ? (
                <DropdownMenuItem disabled>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.none")}
                  </p>
                </DropdownMenuItem>
              ) : (
                normalizedNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => {
                      markNotificationAsRead(notification.id);
                      if (notification.href) navigate(notification.href);
                    }}
                    className={
                      notification.href
                        ? cn(
                            "group cursor-pointer rounded-xl px-3 py-3 transition-colors focus:text-foreground data-[highlighted]:text-foreground",
                            notification.isRead
                              ? "text-foreground hover:bg-muted/60 focus:bg-muted/60 data-[highlighted]:bg-muted/60"
                              : "bg-primary/8 text-foreground hover:bg-primary/12 focus:bg-primary/12 data-[highlighted]:bg-primary/12",
                          )
                        : ""
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          notification.isRead
                            ? "text-foreground"
                            : "text-foreground",
                        )}
                      >
                        {notification.title}
                      </p>
                      <p
                        className={cn(
                          "text-xs",
                          notification.isRead
                            ? "text-muted-foreground"
                            : "text-primary/80 dark:text-primary/70",
                        )}
                      >
                        {notification.message}
                      </p>
                      <p
                        className={cn(
                          "text-[11px]",
                          notification.isRead
                            ? "text-muted-foreground/80"
                            : "text-primary/70 dark:text-primary/60",
                        )}
                      >
                        {notification.timeLabel}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </motion.div>
    </div>
  );
}
