import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  ClipboardList,
  Package,
  BarChart3,
  Settings,
  Users,
  ChefHat,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useIsMobile } from '@/hooks/use-mobile'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'

const navItems = [
  {
    title: 'Dashboard',
    url: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['admin'],
    section: 'menu',
  },
  {
    title: 'Menu Management',
    url: '/admin/menu',
    icon: UtensilsCrossed,
    roles: ['admin'],
    section: 'menu',
  },
  {
    title: 'POS',
    url: '/cashier/pos',
    icon: ShoppingCart,
    roles: ['admin', 'cashier'],
    section: 'menu',
  },
  {
    title: 'Order Queue',
    url: '/admin/orders',
    icon: ClipboardList,
    roles: ['admin'],
    section: 'menu',
  },
  {
    title: 'Order Queue',
    url: '/cashier/orders',
    icon: ClipboardList,
    roles: ['cashier'],
    section: 'menu',
  },
  {
    title: 'Inventory',
    url: '/admin/inventory',
    icon: Package,
    roles: ['admin'],
    section: 'menu',
  },
  {
    title: 'Reports',
    url: '/admin/reports',
    icon: BarChart3,
    roles: ['admin'],
    section: 'system',
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
    roles: ['admin'],
    section: 'system',
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
    roles: ['admin'],
    section: 'system',
  },
  {
    title: 'Browse Menu',
    url: '/menu',
    icon: UtensilsCrossed,
    roles: ['customer'],
    section: 'menu',
  },
  {
    title: 'My Orders',
    url: '/orders',
    icon: ClipboardList,
    roles: ['customer'],
    section: 'menu',
  },
]

const roleLabels = {
  admin: 'Administrator',
  cashier: 'Cashier',
  customer: 'Customer',
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (index) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: index * 0.045,
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  }),
}

export function AppSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  if (!user) return null

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role))
  const menuItems = filteredNavItems.filter((item) => item.section === 'menu')
  const systemItems = filteredNavItems.filter((item) => item.section === 'system')

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  const transitionTo = (url) => {
    if (url === pathname) return

    if (!document.startViewTransition) {
      navigate(url)
      return
    }

    const main = document.querySelector('main')
    if (main) main.style.viewTransitionName = 'page'

    const transition = document.startViewTransition(() => navigate(url))
    transition.finished.finally(() => {
      if (main) main.style.viewTransitionName = ''
    })
  }

  return (
    <Sidebar
      variant="inset"
      collapsible={isMobile ? 'offcanvas' : 'none'}
      className="min-h-svh border-r-0 bg-transparent"
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className="flex h-svh flex-col gap-3 px-4 pb-4 pt-2"
      >
        <SidebarHeader className="p-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="flex h-[72px] items-center rounded-2xl bg-card px-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/40 text-primary shadow-sm"
              >
                <ChefHat className="h-5 w-5" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.14 }}
                className="min-w-0 flex flex-col"
              >
                <span className="truncate text-[1.35rem] font-semibold leading-tight tracking-tight">Campus Canteen</span>
                <span className="truncate text-sm text-muted-foreground">Management System</span>
              </motion.div>
            </div>
          </motion.div>
        </SidebarHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 26 }}
          className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-card shadow-sm"
        >
          <SidebarContent className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Menu
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item, index) => {
                    const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                    return (
                      <motion.div
                        key={item.url}
                        custom={index}
                        variants={menuItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className="h-11 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                          >
                            <Link
                              to={item.url}
                              onClick={(event) => {
                                event.preventDefault()
                                transitionTo(item.url)
                              }}
                              className="flex items-center gap-3"
                            >
                              <motion.span whileHover={{ opacity: 0.8 }} whileTap={{ opacity: 0.9 }}>
                                <item.icon className="h-4 w-4" />
                              </motion.span>
                              <span className="truncate text-[1.05rem]">{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {systemItems.length > 0 && (
              <>
                <SidebarSeparator className="mx-2 my-4 bg-border/30" />
                <SidebarGroup className="p-0">
                  <SidebarGroupLabel className="px-3 pb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    System
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {systemItems.map((item, index) => {
                        const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                        return (
                          <motion.div
                            key={item.url}
                            custom={index + menuItems.length}
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                          >
                            <SidebarMenuItem>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="h-11 rounded-xl px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/70 data-[active=true]:bg-primary/10 data-[active=true]:text-primary"
                              >
                                <Link
                                  to={item.url}
                                  onClick={(event) => {
                                    event.preventDefault()
                                    transitionTo(item.url)
                                  }}
                                  className="flex items-center gap-3"
                                >
                                  <motion.span whileHover={{ opacity: 0.8 }} whileTap={{ opacity: 0.9 }}>
                                    <item.icon className="h-4 w-4" />
                                  </motion.span>
                                  <span className="truncate text-[1.05rem]">{item.title}</span>
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          </motion.div>
                        )
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </>
            )}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 24 }}
              className="flex items-center gap-3"
            >
              <Avatar className="h-10 w-10 shadow-sm">
                <AvatarFallback className="bg-muted/60 text-base text-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[1.05rem] font-semibold text-foreground">{user.name}</span>
                <span className="block truncate text-sm text-muted-foreground">{roleLabels[user.role]}</span>
              </div>
              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => navigate('/admin/settings')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              )}
            </motion.div>
          </SidebarFooter>
        </motion.div>
      </motion.div>
    </Sidebar>
  )
}
