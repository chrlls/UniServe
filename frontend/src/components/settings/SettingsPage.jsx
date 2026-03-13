import { useState } from 'react';
import { Save, User, Bell, Store, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../services/userService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const NOTIFICATION_SETTINGS_KEY = 'settings_notifications';
const CANTEEN_SETTINGS_KEY = 'settings_canteen';

function readLocalObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? { ...fallback, ...parsed } : fallback;
  } catch {
    return fallback;
  }
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Profile tab
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Security tab
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  // Notifications tab
  const [notifications, setNotifications] = useState(() => readLocalObject(NOTIFICATION_SETTINGS_KEY, {
    lowStock: true,
    newOrders: true,
    dailyReport: false,
  }));
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  // Canteen tab
  const [canteen, setCanteen] = useState(() => readLocalObject(CANTEEN_SETTINGS_KEY, {
    name: 'School Canteen',
    currency: '₱',
    taxRate: '0',
  }));
  const [canteenSaved, setCanteenSaved] = useState(false);

  if (!user) {
    return null;
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const updatedUser = await userService.update(user.id, {
        name: profile.name,
        email: profile.email,
        role: user.role,
      });

      setProfile({ name: updatedUser.name, email: updatedUser.email });
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (error) {
      setProfileError(error.message ?? 'Unable to save profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordError('');
    if (!passwords.current) { setPasswordError('Current password is required.'); return; }
    if (passwords.next.length < 8) { setPasswordError('New password must be at least 8 characters.'); return; }
    if (passwords.next !== passwords.confirm) { setPasswordError('Passwords do not match.'); return; }

    setPasswordSaving(true);
    try {
      await userService.update(user.id, {
        name: profile.name,
        email: profile.email,
        role: user.role,
        password: passwords.next,
      });
      setPasswordSaved(true);
      setPasswords({ current: '', next: '', confirm: '' });
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (error) {
      setPasswordError(error.message ?? 'Unable to update password.');
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleNotificationSave() {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(notifications));
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 2000);
  }

  function handleCanteenSave(e) {
    e.preventDefault();
    localStorage.setItem(CANTEEN_SETTINGS_KEY, JSON.stringify(canteen));
    setCanteenSaved(true);
    setTimeout(() => setCanteenSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and system preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm">
            <User size={14} /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm">
            <Shield size={14} /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
            <Bell size={14} /> Alerts
          </TabsTrigger>
          <TabsTrigger value="canteen" className="gap-2 text-xs sm:text-sm">
            <Store size={14} /> Canteen
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your display name and email address.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSave} className="space-y-4">
                {profileError && <p className="text-sm text-destructive">{profileError}</p>}
                <div className="space-y-1">
                  <Label htmlFor="profile-name">Name</Label>
                  <Input
                    id="profile-name"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    autoComplete="email"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" className="gap-2" disabled={profileSaving}>
                    {profileSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {profileSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                  {profileSaved && <span className="text-sm text-green-500">Saved!</span>}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Use a strong password at least 8 characters long.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSave} className="space-y-4">
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                <div className="space-y-1">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>
                <Separator />
                <div className="space-y-1">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.next}
                    onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                    autoComplete="new-password"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" className="gap-2" disabled={passwordSaving}>
                    {passwordSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {passwordSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                  {passwordSaved && <span className="text-sm text-green-500">Password updated!</span>}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose which alerts you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Low Stock Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify when an item falls below threshold.</p>
                </div>
                <Switch
                  checked={notifications.lowStock}
                  onCheckedChange={(v) => setNotifications((n) => ({ ...n, lowStock: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Order Notifications</p>
                  <p className="text-xs text-muted-foreground">Notify when a new order is placed.</p>
                </div>
                <Switch
                  checked={notifications.newOrders}
                  onCheckedChange={(v) => setNotifications((n) => ({ ...n, newOrders: v }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Daily Sales Report</p>
                  <p className="text-xs text-muted-foreground">Receive a daily summary email.</p>
                </div>
                <Switch
                  checked={notifications.dailyReport}
                  onCheckedChange={(v) => setNotifications((n) => ({ ...n, dailyReport: v }))}
                />
              </div>
              <div className="pt-2">
                <Button type="button" className="gap-2" onClick={handleNotificationSave}>
                  <Save size={15} /> Save Preferences
                </Button>
                {notificationsSaved && <span className="ml-3 text-sm text-green-500">Preferences saved!</span>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Canteen Tab */}
        <TabsContent value="canteen">
          <Card>
            <CardHeader>
              <CardTitle>Canteen Settings</CardTitle>
              <CardDescription>Configure your canteen name, currency, and tax rate.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCanteenSave} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="canteen-name">Canteen Name</Label>
                  <Input
                    id="canteen-name"
                    value={canteen.name}
                    onChange={(e) => setCanteen((c) => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    value={canteen.currency}
                    onChange={(e) => setCanteen((c) => ({ ...c, currency: e.target.value }))}
                    className="w-24"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={canteen.taxRate}
                    onChange={(e) => setCanteen((c) => ({ ...c, taxRate: e.target.value }))}
                    className="w-32"
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="gap-2">
                    <Save size={15} /> Save Settings
                  </Button>
                  {canteenSaved && <span className="ml-3 text-sm text-green-500">Settings saved!</span>}
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
