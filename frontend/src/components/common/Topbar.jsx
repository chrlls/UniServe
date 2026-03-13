
import "@theme-toggles/react/css/Classic.css";
import { Classic } from "@theme-toggles/react";
import { Search, Bell, ChevronRight, SidebarIcon } from "lucide-react";
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function Topbar({ title = "Dashboard", breadcrumbs }) {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { isDark, toggle, toggleRef } = useTheme();
  const navigate = useNavigate();

  const fullName = user?.name ?? "Account";
  const roleLabel = user?.role ?? "No role assigned";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "NA";

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success("You have been signed out successfully.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        `Logout failed: ${error instanceof Error ? error.message : "Unable to log out."}`,
      );
    }
  };

  return (
    <div className="sticky top-0 z-40 flex h-[88px] w-full shrink-0 bg-transparent px-4 py-2 md:px-5 xl:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="z-10 flex h-[72px] w-full items-center justify-between gap-4 rounded-2xl bg-sidebar/90 px-5 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-sidebar/75"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 lg:hidden"
          >
            <SidebarIcon className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            {breadcrumbs ? (
              <nav className="flex items-center gap-1 text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {index > 0 && (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-semibold text-foreground">
                        {crumb.label}
                      </span>
                    ) : (
                      <span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            ) : (
              <h1 className="text-base font-semibold text-foreground">{title}</h1>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative hidden md:block">
            <label htmlFor="search-input" className="sr-only">
              Search
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
            <Input
              id="search-input"
              placeholder="Search menu, orders..."
              className="h-8 w-56 bg-background/90 pl-9 text-sm shadow-sm xl:w-64"
              aria-label="Search"
            />
          </div>

          {/* Theme toggle */}
          <div ref={toggleRef} className="flex items-center justify-center h-8 w-8">
            <Classic
              duration={750}
              toggled={isDark}
              onToggle={toggle}
              className="text-foreground"
              style={{ fontSize: "1.1rem" }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                aria-label="Notifications"
                title="View notifications"
              >
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]" aria-label="5 unread notifications">
                  5
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New Order Placed</p>
                  <p className="text-xs text-muted-foreground">Table 4 placed a new order</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">Chicken Adobo stock is running low</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Order Ready</p>
                  <p className="text-xs text-muted-foreground">Order #ORD-20260311-0042 is ready for pickup</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Daily Report</p>
                  <p className="text-xs text-muted-foreground">Today's sales report is now available</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">New User Registered</p>
                  <p className="text-xs text-muted-foreground">A new customer account was created</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full cursor-pointer"
                aria-label="User menu"
                title="Open user menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src="/placeholder-user.jpg"
                    alt={`${fullName} avatar`}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{fullName}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {roleLabel}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </div>
  );
}