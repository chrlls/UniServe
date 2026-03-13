import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import LoadingSpinner from '../common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLE_TABS = ['all', 'admin', 'cashier', 'customer'];
const ROLE_BADGE_CLASS = {
  admin:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cashier:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  customer: 'bg-green-500/10 text-green-400 border-green-500/20',
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  async function fetchUsers() {
    try {
      setError(null);
      const params = roleFilter !== 'all' ? { role: roleFilter } : {};
      const data = await userService.getAll(params);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  function openCreateModal() {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'customer' });
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  }

  function openEditModal(user) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setFormError('');
    setFieldErrors({});
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    // Client validation
    const errors = {};
    if (!form.name.trim()) errors.name = ['Name is required.'];
    if (!form.email.trim()) errors.email = ['Email is required.'];
    if (!editingUser && !form.password) errors.password = ['Password is required.'];
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormError('');
    setFieldErrors({});
    try {
      const payload = { name: form.name, email: form.email, role: form.role };
      if (form.password) payload.password = form.password;
      if (editingUser) {
        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(payload);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message);
      if (err.errors) setFieldErrors(err.errors);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user) {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await userService.delete(user.id);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function FieldError({ name }) {
    const msgs = fieldErrors[name];
    if (!msgs) return null;
    return <p className="text-xs mt-1 text-destructive">{msgs[0]}</p>;
  }

  if (loading) return <LoadingSpinner message="Loading users..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle size={48} className="text-destructive mb-4" />
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={fetchUsers} className="mt-4" size="sm">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm mt-1 text-muted-foreground">{users.length} users</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus size={18} /> Add User
        </Button>
      </div>

      {/* Role filter tabs */}
      <Tabs value={roleFilter} onValueChange={setRoleFilter}>
        <TabsList>
          {ROLE_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <Users size={48} className="text-muted-foreground/30 mb-4" />
              <p className="text-sm text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="text-center">Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <span className="font-medium">{u.name}</span>
                      {u.id === currentUser?.id && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`capitalize ${ROLE_BADGE_CLASS[u.role] ?? ROLE_BADGE_CLASS.customer}`}
                      >
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => openEditModal(u)}
                        >
                          <Pencil size={14} />
                        </Button>
                        {u.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(u)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="off"
              />
              <FieldError name="name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="off"
              />
              <FieldError name="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">
                Password{' '}
                {editingUser && (
                  <span className="text-xs font-normal text-muted-foreground">(leave blank to keep current)</span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <FieldError name="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(val) => handleChange({ target: { name: 'role', value: val } })}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <FieldError name="role" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
