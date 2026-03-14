import { useEffect, useState } from "react";
import {
  Bell,
  Loader2,
  LockKeyhole,
  Pencil,
  Save,
  Store,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import { goeyToast } from "@/components/ui/goey-toast";
import {
  AppModal,
  AppModalBody,
  AppModalFooter,
} from "@/components/ui/app-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountPreferences } from "@/lib/preferences";
import {
  DICEBEAR_STYLE_OPTIONS,
  getDefaultAvatarSeed,
  getInitials,
  getUserAvatarSrc,
} from "@/lib/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NOTIFICATION_SETTINGS_KEY = "settings_notifications";
const CANTEEN_SETTINGS_KEY = "settings_canteen";

const TIMEZONE_OPTIONS = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/Rome",
  "America/New_York",
];

const TIME_FORMAT_OPTIONS = [
  { value: "browser", label: "Browser Default" },
  { value: "12h", label: "12-hour format" },
  { value: "24h", label: "24-hour format" },
];

const WEEK_START_OPTIONS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
];

const LANGUAGE_OPTIONS = [
  { value: "browser", label: "Browser Default" },
  { value: "english", label: "English" },
  { value: "filipino", label: "Filipino" },
];

const CURRENCY_OPTIONS = [
  { value: "PHP", label: "PHP" },
  { value: "₱", label: "₱" },
];

function readLocalObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? { ...fallback, ...parsed }
      : fallback;
  } catch {
    return fallback;
  }
}

function fieldLabelClassName() {
  return "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { accountSettings: storedAccountSettings, saveAccountSettings } =
    useAccountPreferences();
  const [accountSettings, setAccountSettings] = useState(storedAccountSettings);
  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState(
    user?.avatar_style ?? "lorelei",
  );
  const [avatarSeed, setAvatarSeed] = useState(user?.avatar_seed ?? "");
  const [pickerAvatarStyle, setPickerAvatarStyle] = useState(
    user?.avatar_style ?? "lorelei",
  );
  const [pickerAvatarSeed, setPickerAvatarSeed] = useState(
    user?.avatar_seed ?? "",
  );

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const [notifications, setNotifications] = useState(() =>
    readLocalObject(NOTIFICATION_SETTINGS_KEY, {
      lowStock: true,
      newOrders: true,
      dailyReport: false,
    }),
  );
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  const [canteen, setCanteen] = useState(() =>
    readLocalObject(CANTEEN_SETTINGS_KEY, {
      name: "Campus Canteen",
      currency: "PHP",
      taxRate: "0",
    }),
  );
  const [canteenSaved, setCanteenSaved] = useState(false);

  const [deleteEmail, setDeleteEmail] = useState("");

  useEffect(() => {
    setAccountSettings(storedAccountSettings);
  }, [storedAccountSettings]);

  useEffect(() => {
    setAvatarStyle(user?.avatar_style ?? "lorelei");
    setAvatarSeed(user?.avatar_seed ?? "");
    setPickerAvatarStyle(user?.avatar_style ?? "lorelei");
    setPickerAvatarSeed(user?.avatar_seed ?? "");
  }, [user?.avatar_style, user?.avatar_seed]);

  if (!user) {
    return null;
  }

  const initials = getInitials(profile.name || user.name);
  const generatedAvatarBaseSeed = getDefaultAvatarSeed({
    ...user,
    name: profile.name || user.name,
    email: profile.email || user.email,
  });
  const selectedGeneratedAvatarSeed = avatarSeed || generatedAvatarBaseSeed;
  const generatedAvatarChoices = [
    generatedAvatarBaseSeed,
    ...Array.from(
      { length: 5 },
      (_, index) => `${generatedAvatarBaseSeed}-choice-${index + 2}`,
    ),
  ];
  const profilePhoto = getUserAvatarSrc({
    ...user,
    name: profile.name || user.name,
    email: profile.email || user.email,
    avatar_style: avatarStyle,
    avatar_seed: selectedGeneratedAvatarSeed,
  });

  function handleGeneratedAvatarSelect(seed) {
    setProfileError("");
    setPickerAvatarSeed(seed);
  }

  function openAvatarPicker() {
    setPickerAvatarStyle(avatarStyle);
    setPickerAvatarSeed(selectedGeneratedAvatarSeed);
    setShowAvatarPicker(true);
  }

  function handleConfirmGeneratedAvatar() {
    setAvatarStyle(pickerAvatarStyle);
    setAvatarSeed(pickerAvatarSeed);
    setShowAvatarPicker(false);
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    setProfileError("");
    setProfileSaving(true);

    try {
      const updatedUser = await authService.updateProfile({
        name: profile.name,
        email: profile.email,
        avatar_style: avatarStyle,
        avatar_seed: selectedGeneratedAvatarSeed,
      });

      saveAccountSettings(accountSettings);

      setProfile({
        name: updatedUser.name,
        email: updatedUser.email,
      });
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2200);
    } catch (error) {
      const validationMessage = Object.values(error.errors ?? {})[0]?.[0];
      setProfileError(
        validationMessage ?? error.message ?? "Unable to save profile.",
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePasswordSave(event) {
    event.preventDefault();
    setPasswordError("");

    if (!passwords.current) {
      setPasswordError("Current password is required.");
      return;
    }
    if (passwords.next.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await authService.updatePassword({
        current_password: passwords.current,
        password: passwords.next,
        password_confirmation: passwords.confirm,
      });

      setPasswords({ current: "", next: "", confirm: "" });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2200);
    } catch (error) {
      const validationMessage = Object.values(error.errors ?? {})[0]?.[0];
      setPasswordError(
        validationMessage ?? error.message ?? "Unable to update password.",
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  function handleNotificationSave() {
    localStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(notifications),
    );
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 2200);
  }

  function handleCanteenSave(event) {
    event.preventDefault();
    localStorage.setItem(CANTEEN_SETTINGS_KEY, JSON.stringify(canteen));
    setCanteenSaved(true);
    setTimeout(() => setCanteenSaved(false), 2200);
  }

  function handleDeleteAccountRequest() {
    goeyToast.error("Account deletion is not enabled in this build.");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-1 pb-8">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
        </div>

        <Tabs defaultValue="account" className="space-y-8">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-border/70 bg-card/70 p-1 text-sm shadow-sm sm:w-auto">
            <TabsTrigger
              value="account"
              className="rounded-xl px-4 py-2.5 data-[state=active]:shadow-none"
            >
              Account
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="rounded-xl px-4 py-2.5 data-[state=active]:shadow-none"
            >
              Security
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="rounded-xl px-4 py-2.5 data-[state=active]:shadow-none"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger
              value="canteen"
              className="rounded-xl px-4 py-2.5 data-[state=active]:shadow-none"
            >
              Canteen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-0 space-y-10">
            <section className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                  Profile Account
                </h2>
                <p className="max-w-3xl text-base text-muted-foreground">
                  Manage your canteen account. These profile preferences help
                  personalize how your admin workspace behaves.
                </p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-8">
                <div className="space-y-4">
                  <p className={fieldLabelClassName()}>Profile Avatar</p>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24 rounded-[1.7rem] border border-border/80 bg-muted/60 shadow-sm">
                        <AvatarImage
                          src={profilePhoto}
                          alt={`${profile.name || user.name} avatar`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/12 text-lg font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        size="icon"
                        className="absolute -bottom-2 -right-2 h-11 w-11 rounded-full border border-border/70 bg-background text-foreground shadow-md hover:bg-muted"
                        onClick={openAvatarPicker}
                        aria-label="Choose profile avatar"
                      >
                        <Pencil className="h-4 w-4 text-foreground" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {profile.name || user.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generated avatars are used across the app, with initials
                        only as the final fallback if the icon cannot render.
                      </p>
                    </div>
                  </div>
                </div>

                {profileError ? (
                  <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {profileError}
                  </p>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className={fieldLabelClassName()}>
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={accountSettings.username}
                      onChange={(event) =>
                        setAccountSettings((current) => ({
                          ...current,
                          username: event.target.value,
                        }))
                      }
                      className="h-11 rounded-xl border-border/70 bg-background/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="full-name"
                      className={fieldLabelClassName()}
                    >
                      Full Name
                    </Label>
                    <Input
                      id="full-name"
                      value={profile.name}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      autoComplete="name"
                      className="h-11 rounded-xl border-border/70 bg-background/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className={fieldLabelClassName()}>
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      autoComplete="email"
                      className="h-11 rounded-xl border-border/70 bg-background/60"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className={fieldLabelClassName()}>Time Zone</Label>
                    <Select
                      value={accountSettings.timezone}
                      onValueChange={(value) =>
                        setAccountSettings((current) => ({
                          ...current,
                          timezone: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={fieldLabelClassName()}>Time Format</Label>
                    <Select
                      value={accountSettings.timeFormat}
                      onValueChange={(value) =>
                        setAccountSettings((current) => ({
                          ...current,
                          timeFormat: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_FORMAT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className={fieldLabelClassName()}>
                      Start of the Week
                    </Label>
                    <Select
                      value={accountSettings.weekStart}
                      onValueChange={(value) =>
                        setAccountSettings((current) => ({
                          ...current,
                          weekStart: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                        <SelectValue placeholder="Select start day" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEK_START_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-1">
                    <Label className={fieldLabelClassName()}>Language</Label>
                    <Select
                      value={accountSettings.language}
                      onValueChange={(value) =>
                        setAccountSettings((current) => ({
                          ...current,
                          language: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    className="h-11 rounded-xl px-5"
                    disabled={profileSaving}
                  >
                    {profileSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {profileSaving ? "Updating..." : "Update"}
                  </Button>
                  {profileSaved ? (
                    <span className="text-sm text-emerald-500">
                      Profile updated successfully.
                    </span>
                  ) : null}
                </div>
              </form>
            </section>

            <Separator className="bg-border/70" />

            <section className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  Delete Account
                </h3>
                <p className="max-w-xl text-base text-muted-foreground">
                  Once you delete your account and account data, there is no
                  going back.
                </p>
              </div>

              <div className="max-w-md space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-email"
                    className={fieldLabelClassName()}
                  >
                    Delete your account and account data
                  </Label>
                  <Input
                    id="confirm-email"
                    type="email"
                    placeholder="Confirm Email"
                    value={deleteEmail}
                    onChange={(event) => setDeleteEmail(event.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 rounded-xl px-5"
                  disabled={
                    deleteEmail.trim().toLowerCase() !==
                    profile.email.trim().toLowerCase()
                  }
                  onClick={handleDeleteAccountRequest}
                >
                  Delete Account
                </Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="password" className="mt-0 space-y-8">
            <section className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Security
              </h2>
              <p className="max-w-3xl text-base text-muted-foreground">
                Manage password protection and account access for your canteen
                admin account.
              </p>
            </section>

            <form onSubmit={handlePasswordSave} className="max-w-3xl space-y-6">
              {passwordError ? (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {passwordError}
                </p>
              ) : null}

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="current-password"
                    className={fieldLabelClassName()}
                  >
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwords.current}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-password"
                    className={fieldLabelClassName()}
                  >
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.next}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        next: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className={fieldLabelClassName()}
                  >
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(event) =>
                      setPasswords((current) => ({
                        ...current,
                        confirm: event.target.value,
                      }))
                    }
                    autoComplete="new-password"
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  className="h-11 rounded-xl px-5"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="mr-2 h-4 w-4" />
                  )}
                  {passwordSaving ? "Updating..." : "Update Password"}
                </Button>
                {passwordSaved ? (
                  <span className="text-sm text-emerald-500">
                    Password updated successfully.
                  </span>
                ) : null}
              </div>
            </form>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 space-y-8">
            <section className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Notifications
              </h2>
              <p className="max-w-3xl text-base text-muted-foreground">
                Choose which operational alerts should reach your account.
              </p>
            </section>

            <div className="max-w-3xl space-y-0 overflow-hidden rounded-3xl border border-border/70 bg-card/55 shadow-sm">
              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Low Stock Alerts
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Notify when an item falls below its stock threshold.
                  </p>
                </div>
                <Switch
                  checked={notifications.lowStock}
                  onCheckedChange={(value) =>
                    setNotifications((current) => ({
                      ...current,
                      lowStock: value,
                    }))
                  }
                />
              </div>

              <Separator className="bg-border/70" />

              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    New Order Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Notify when a new order is submitted for processing.
                  </p>
                </div>
                <Switch
                  checked={notifications.newOrders}
                  onCheckedChange={(value) =>
                    setNotifications((current) => ({
                      ...current,
                      newOrders: value,
                    }))
                  }
                />
              </div>

              <Separator className="bg-border/70" />

              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    Daily Sales Report
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of revenue and order activity.
                  </p>
                </div>
                <Switch
                  checked={notifications.dailyReport}
                  onCheckedChange={(value) =>
                    setNotifications((current) => ({
                      ...current,
                      dailyReport: value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="h-11 rounded-xl px-5"
                onClick={handleNotificationSave}
              >
                <Bell className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
              {notificationsSaved ? (
                <span className="text-sm text-emerald-500">
                  Notification preferences saved.
                </span>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="canteen" className="mt-0 space-y-8">
            <section className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Canteen Settings
              </h2>
              <p className="max-w-3xl text-base text-muted-foreground">
                Configure the canteen identity and the values used in reports
                and daily operations.
              </p>
            </section>

            <form onSubmit={handleCanteenSave} className="max-w-3xl space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="canteen-name"
                    className={fieldLabelClassName()}
                  >
                    Canteen Name
                  </Label>
                  <Input
                    id="canteen-name"
                    value={canteen.name}
                    onChange={(event) =>
                      setCanteen((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                </div>

                <div className="space-y-2">
                  <Label className={fieldLabelClassName()}>Currency</Label>
                  <Select
                    value={canteen.currency}
                    onValueChange={(value) =>
                      setCanteen((current) => ({
                        ...current,
                        currency: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-border/70 bg-background/60">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax-rate" className={fieldLabelClassName()}>
                    Tax Rate (%)
                  </Label>
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={canteen.taxRate}
                    onChange={(event) =>
                      setCanteen((current) => ({
                        ...current,
                        taxRate: event.target.value,
                      }))
                    }
                    className="h-11 rounded-xl border-border/70 bg-background/60"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" className="h-11 rounded-xl px-5">
                  <Store className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
                {canteenSaved ? (
                  <span className="text-sm text-emerald-500">
                    Canteen settings saved.
                  </span>
                ) : null}
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <AppModal
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        title="Choose Profile Avatar"
        size="xl"
      >
        <AppModalBody className="max-h-[68dvh] overflow-y-auto">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-24 w-24 rounded-[1.7rem] border border-border/70 bg-muted/50 shadow-sm">
                <AvatarImage
                  src={profilePhoto}
                  alt="Current profile avatar"
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/12 text-lg font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">
                  Edit Profile
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose a profile icon.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {DICEBEAR_STYLE_OPTIONS.map((option) => (
                <section key={option.value} className="space-y-3">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    {option.label}
                  </h3>

                  <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
                    {generatedAvatarChoices.map((seed) => {
                      const isSelected =
                        pickerAvatarSeed === seed &&
                        pickerAvatarStyle === option.value;

                      return (
                        <button
                          key={`${option.value}-${seed}`}
                          type="button"
                          onClick={() => {
                            setPickerAvatarStyle(option.value);
                            handleGeneratedAvatarSelect(seed);
                          }}
                          className={`group relative overflow-hidden rounded-[1.35rem] border p-2 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/8 shadow-sm ring-2 ring-primary/20"
                              : "border-border/60 bg-background/55 hover:border-primary/40 hover:bg-muted/40"
                          }`}
                          aria-label={`Choose ${option.label} avatar`}
                        >
                          <Avatar className="h-full w-full rounded-[1rem]">
                            <AvatarImage
                              src={getUserAvatarSrc({
                                ...user,
                                name: profile.name || user.name,
                                email: profile.email || user.email,
                                avatar_style: option.value,
                                avatar_seed: seed,
                              })}
                              alt={`${option.label} avatar option`}
                              className="aspect-square object-cover"
                            />
                            <AvatarFallback className="rounded-[1rem] bg-primary/12 text-sm font-semibold text-primary">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`pointer-events-none absolute inset-0 rounded-[1rem] transition-opacity ${
                              isSelected
                                ? "opacity-100 ring-2 ring-inset ring-primary/25"
                                : "opacity-0 ring-1 ring-inset ring-primary/10 group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </AppModalBody>
        <AppModalFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowAvatarPicker(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirmGeneratedAvatar}>
            Use Avatar
          </Button>
        </AppModalFooter>
      </AppModal>
    </div>
  );
}
