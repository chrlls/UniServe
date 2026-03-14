import { useState, useEffect, useMemo } from "react";
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Users,
  Search,
  Shield,
  CreditCard,
  User,
  Eye,
  EyeOff,
  UserCheck,
  MoreHorizontal,
  KeyRound,
  UserCog,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import { goeyToast } from "@/components/ui/goey-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AppModal,
  AppModalBody,
  AppModalFooter,
} from "@/components/ui/app-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, getUserAvatarSrc } from "@/lib/avatar";

/* ─── Constants ─────────────────────────────────────────────────────── */
const ROLE_TABS = ["all", "admin", "cashier", "customer"];

const ROLE_META = {
  admin: {
    label: "Admin",
    badgeClass: "border border-violet-400/35 bg-violet-500/12 text-violet-300",
    icon: Shield,
  },
  cashier: {
    label: "Cashier",
    badgeClass: "border border-blue-400/35 bg-blue-500/12 text-blue-300",
    icon: CreditCard,
  },
  customer: {
    label: "Customer",
    badgeClass:
      "border border-emerald-400/35 bg-emerald-500/12 text-emerald-300",
    icon: User,
  },
};

const DEFAULT_FORM = { name: "", email: "", password: "", role: "customer" };
const SORT_OPTIONS = ["name-asc", "name-desc", "role"];

const AVATAR_TONES = {
  admin: [
    "bg-violet-500/20 text-violet-100 ring-violet-400/30",
    "bg-indigo-500/20 text-indigo-100 ring-indigo-400/30",
  ],
  cashier: [
    "bg-blue-500/20 text-blue-100 ring-blue-400/30",
    "bg-cyan-500/20 text-cyan-100 ring-cyan-400/30",
  ],
  customer: [
    "bg-emerald-500/20 text-emerald-100 ring-emerald-400/30",
    "bg-teal-500/20 text-teal-100 ring-teal-400/30",
  ],
};

const KPI_CARD_CLASS =
  "rounded-2xl border-0 bg-card/95 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-card/100 hover:shadow-md";

function getKpiCardMotion(index = 0) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.28,
      delay: 0.06 + index * 0.045,
      ease: [0.22, 1, 0.36, 1],
    },
  };
}

/* ─── Skeleton ───────────────────────────────────────────────────────── */
function UserManagementSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-2xl shadow-sm">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-10" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-72 rounded-lg" />
      </div>
      {/* Table */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full hidden sm:block" />
                <div className="flex gap-1 ml-auto">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────────── */
function StatCard({ index = 0, label, count, icon: Icon, colorClass, helper }) {
  return (
    <motion.div {...getKpiCardMotion(index)}>
      <Card className={KPI_CARD_CLASS}>
        <CardContent className="flex items-start justify-between gap-3 p-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 text-[1.9rem] font-bold leading-none tracking-tight">
              {count}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${colorClass}`}
          >
            <Icon size={18} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Data fetching ── */
  async function fetchUsers(silent = false) {
    if (!silent) setLoading(true);
    try {
      setError(null);
      const params = roleFilter !== "all" ? { role: roleFilter } : {};
      const data = await userService.getAll(params);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  /* ── Derived: search filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const filteredAndSorted = useMemo(() => {
    const list = [...filtered];

    if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "role") {
      list.sort(
        (a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name),
      );
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [filtered, sortBy]);

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      cashier: users.filter((u) => u.role === "cashier").length,
      customer: users.filter((u) => u.role === "customer").length,
    }),
    [users],
  );

  /* ── Modal helpers ── */
  function openCreateModal() {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    setFieldErrors({});
    setShowPassword(false);
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormError("");
    setFieldErrors({});
    setShowPassword(false);
    setShowModal(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (!form.name.trim()) errors.name = ["Name is required."];
    if (!form.email.trim()) errors.email = ["Email is required."];
    if (!editingUser && !form.password)
      errors.password = ["Password is required."];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormError("");
    setFieldErrors({});
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      if (editingUser) {
        await userService.update(editingUser.id, payload);
        goeyToast.success("User updated successfully");
      } else {
        await userService.create(payload);
        goeyToast.success("User created successfully");
      }
      setShowModal(false);
      fetchUsers(true);
    } catch (err) {
      setFormError(err.message);
      if (err.errors) setFieldErrors(err.errors);
      goeyToast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Delete ── */
  function promptDelete(user) {
    if (user.id === currentUser?.id) {
      goeyToast.error("You cannot delete your own account.");
      return;
    }
    setDeleteTarget(user);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.delete(deleteTarget.id);
      goeyToast.success(`"${deleteTarget.name}" has been removed`);
      setDeleteTarget(null);
      fetchUsers(true);
    } catch (err) {
      goeyToast.error(err.message || "Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  async function handleQuickRoleChange(targetUser, nextRole) {
    if (targetUser.role === nextRole) return;

    try {
      await userService.update(targetUser.id, {
        name: targetUser.name,
        email: targetUser.email,
        role: nextRole,
      });
      goeyToast.success(
        `${targetUser.name} is now ${ROLE_META[nextRole].label}`,
      );
      fetchUsers(true);
    } catch (err) {
      goeyToast.error(err.message || "Failed to update role");
    }
  }

  /* ── Field error helper ── */
  function FieldError({ name }) {
    const msgs = fieldErrors[name];
    if (!msgs) return null;
    return (
      <p className="text-xs mt-1 text-destructive flex items-center gap-1">
        <AlertCircle size={11} /> {msgs[0]}
      </p>
    );
  }

  function getAvatarTone(user) {
    const role = user.role in AVATAR_TONES ? user.role : "customer";
    const palette = AVATAR_TONES[role];
    const numericSeed = Number(user.id) || user.name.length || 0;
    return palette[numericSeed % palette.length];
  }

  /* ── States ── */
  if (loading) return <UserManagementSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle size={28} className="text-destructive" />
        </div>
        <div>
          <p className="font-semibold">Failed to load users</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={() => fetchUsers()} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage accounts and permissions for all roles
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          id="add-user-btn"
          className="gap-2 shrink-0"
        >
          <Plus size={17} /> Add User
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          index={0}
          label="Total Users"
          count={stats.all}
          icon={Users}
          colorClass="bg-primary/15 text-primary ring-primary/30"
          helper={`${stats.admin + stats.cashier} staff + ${stats.customer} customers`}
        />
        <StatCard
          index={1}
          label="Admins"
          count={stats.admin}
          icon={Shield}
          colorClass="bg-violet-500/15 text-violet-300 ring-violet-400/30"
          helper={`${stats.all ? Math.round((stats.admin / stats.all) * 100) : 0}% of total users`}
        />
        <StatCard
          index={2}
          label="Cashiers"
          count={stats.cashier}
          icon={CreditCard}
          colorClass="bg-blue-500/15 text-blue-300 ring-blue-400/30"
          helper={`${stats.all ? Math.round((stats.cashier / stats.all) * 100) : 0}% operational accounts`}
        />
        <StatCard
          index={3}
          label="Customers"
          count={stats.customer}
          icon={UserCheck}
          colorClass="bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
          helper={`${stats.all ? Math.round((stats.customer / stats.all) * 100) : 0}% end-user accounts`}
        />
      </div>

      {/* ── Toolbar: search + role tabs ── */}
      <div className="space-y-3 rounded-2xl border border-border/40 bg-card/90 p-4 shadow-sm">
        {/* Search */}
        <div className="relative max-w-xl">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="user-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>

        {/* Role filter tabs */}
        <Tabs
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v);
            setSearch("");
          }}
        >
          <TabsList className="h-9 bg-muted/50 p-1">
            {ROLE_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="capitalize px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {tab === "all" ? "All" : (ROLE_META[tab]?.label ?? tab)}
                <span className="ml-1.5 text-[10px] font-semibold opacity-70">
                  {stats[tab] ?? 0}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-full sm:w-[170px]">
              <SelectValue placeholder="Sort users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SORT_OPTIONS[0]}>Name (A-Z)</SelectItem>
              <SelectItem value={SORT_OPTIONS[1]}>Name (Z-A)</SelectItem>
              <SelectItem value={SORT_OPTIONS[2]}>Role</SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-muted-foreground">
            {filteredAndSorted.length} of {users.length} users
          </p>
        </div>
      </div>

      {/* ── Users table ── */}
      <Card className="overflow-hidden rounded-2xl border border-border/45 bg-card/95 shadow-sm">
        <CardContent className="p-0">
          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center">
                <Users size={24} className="text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-sm">No users found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search
                    ? "Try a different search term"
                    : "Add a user to get started"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="[&_tr]:border-border/55">
                <TableRow className="border-border/55 hover:bg-transparent">
                  <TableHead className="pl-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="text-right pr-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSorted.map((u) => {
                  const meta = ROLE_META[u.role] ?? ROLE_META.customer;
                  const isMe = u.id === currentUser?.id;
                  const avatarSrc = getUserAvatarSrc(u);
                  return (
                    <TableRow
                      key={u.id}
                      className="group border-border/40 transition-colors hover:bg-primary/5"
                    >
                      {/* Name + avatar */}
                      <TableCell className="pl-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            className={`h-9 w-9 shrink-0 text-xs font-semibold ring-1 ${getAvatarTone(u)}`}
                          >
                            <AvatarImage
                              src={avatarSrc}
                              alt={`${u.name} avatar`}
                              className="object-cover"
                            />
                            <AvatarFallback
                              className={`ring-1 ${getAvatarTone(u)}`}
                            >
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="truncate text-sm font-semibold text-foreground">
                                {u.name}
                              </span>
                              {isMe && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                                  You
                                </span>
                              )}
                            </div>
                            {/* Email shown inline on mobile */}
                            <p className="text-xs text-muted-foreground truncate md:hidden">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Email (desktop) */}
                      <TableCell className="hidden py-3.5 text-sm text-muted-foreground md:table-cell">
                        {u.email}
                      </TableCell>

                      {/* Role badge */}
                      <TableCell className="text-center py-3.5">
                        <Badge
                          variant="outline"
                          className={`h-6 min-w-[78px] justify-center rounded-full px-2.5 text-[11px] font-semibold capitalize ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                            onClick={() => openEditModal(u)}
                            title="Edit user"
                          >
                            <Pencil size={14} />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                                title="More actions"
                              >
                                <MoreHorizontal size={14} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => openEditModal(u)}
                              >
                                <Pencil size={14} />
                                Edit user
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditModal(u)}
                              >
                                <KeyRound size={14} />
                                Set new password
                              </DropdownMenuItem>
                              {!isMe && u.role !== "admin" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickRoleChange(u, "admin")
                                  }
                                >
                                  <Shield size={14} />
                                  Set as Admin
                                </DropdownMenuItem>
                              )}
                              {!isMe && u.role !== "cashier" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickRoleChange(u, "cashier")
                                  }
                                >
                                  <UserCog size={14} />
                                  Set as Cashier
                                </DropdownMenuItem>
                              )}
                              {!isMe && u.role !== "customer" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleQuickRoleChange(u, "customer")
                                  }
                                >
                                  <User size={14} />
                                  Set as Customer
                                </DropdownMenuItem>
                              )}
                              {!isMe && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => promptDelete(u)}
                                >
                                  <Trash2 size={14} />
                                  Delete user
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Result count ── */}
      {filteredAndSorted.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {filteredAndSorted.length} of {users.length} users
        </p>
      )}

      {/* ══ Create / Edit Modal ══ */}
      <AppModal
        isOpen={showModal}
        onClose={() => {
          if (!submitting) {
            setShowModal(false);
          }
        }}
        title={editingUser ? "Edit User" : "Add New User"}
        size="md"
        isDismissable={false}
      >
        <AppModalBody>
          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {formError}
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-muted/25 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar
                  className={`h-16 w-16 shrink-0 text-base font-semibold ring-1 ${getAvatarTone(
                    {
                      id: editingUser?.id ?? form.email ?? form.name,
                      name: form.name || "Account",
                      role: form.role,
                    },
                  )}`}
                >
                  <AvatarImage
                    src={getUserAvatarSrc({
                      id: editingUser?.id,
                      name: form.name || editingUser?.name || "Account",
                      email: form.email || editingUser?.email,
                      role: form.role,
                    })}
                    alt={`${form.name || editingUser?.name || "User"} avatar`}
                    className="object-cover"
                  />
                  <AvatarFallback
                    className={`ring-1 ${getAvatarTone({
                      id: editingUser?.id ?? form.email ?? form.name,
                      name: form.name || "Account",
                      role: form.role,
                    })}`}
                  >
                    {getInitials(form.name || editingUser?.name || "Account")}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Generated avatar
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    User avatars are generated automatically from their account
                    details for a consistent small-project setup.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="um-name" className="text-sm font-medium">
                Full name
              </Label>
              <Input
                id="um-name"
                name="name"
                placeholder="e.g. Juan dela Cruz"
                value={form.name}
                onChange={handleChange}
                autoComplete="off"
                className={
                  fieldErrors.name
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              <FieldError name="name" />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="um-email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="um-email"
                type="email"
                name="email"
                placeholder="e.g. juan@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
                className={
                  fieldErrors.email
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }
              />
              <FieldError name="email" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label
                htmlFor="um-password"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                Password
                {editingUser && (
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="um-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={editingUser ? "••••••••" : "Min. 8 characters"}
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  className={`pr-10 ${fieldErrors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </Button>
              </div>
              <FieldError name="password" />
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label htmlFor="um-role" className="text-sm font-medium">
                Role
              </Label>
              <Select
                value={form.role}
                onValueChange={(val) =>
                  handleChange({ target: { name: "role", value: val } })
                }
              >
                <SelectTrigger id="um-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield size={14} className="text-purple-500" /> Admin
                    </span>
                  </SelectItem>
                  <SelectItem value="cashier">
                    <span className="flex items-center gap-2">
                      <CreditCard size={14} className="text-blue-500" /> Cashier
                    </span>
                  </SelectItem>
                  <SelectItem value="customer">
                    <span className="flex items-center gap-2">
                      <User size={14} className="text-emerald-500" /> Customer
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError name="role" />
            </div>
          </form>
        </AppModalBody>
        {/*  */}{" "}
        <AppModalFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowModal(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={submitting}
            className="min-w-[100px]"
          >
            {submitting
              ? editingUser
                ? "Updating…"
                : "Creating…"
              : editingUser
                ? "Update User"
                : "Create User"}
          </Button>
        </AppModalFooter>
      </AppModal>

      {/* ══ Delete Confirm Dialog ══ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                "{deleteTarget?.name}"
              </span>{" "}
              and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 min-w-[90px]"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
