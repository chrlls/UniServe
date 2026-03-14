import { useState } from "react";
// eslint-disable-next-line no-unused-vars -- used as <motion.div> JSX element
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import canteenImage from "@/assets/Images/blue-tray.png";
import authBgImage from "@/assets/Images/max-frajer-VZFHWCaVBqw-unsplash.jpg";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const roleRedirects = {
  admin: "/admin/dashboard",
  cashier: "/cashier/pos",
  customer: "/menu",
};

function isCredentialsError(err) {
  const message = err?.message ?? "";
  const emailError = Array.isArray(err?.errors?.email)
    ? err.errors.email[0]
    : "";

  return (
    message === "The provided credentials are incorrect." &&
    emailError === "The provided credentials are incorrect."
  );
}

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
    name: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function toggleMode() {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError("");
    setFieldErrors({});
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (fieldErrors[name]) setFieldErrors((p) => ({ ...p, [name]: "" }));
    if (error) setError("");
  }

  function validate() {
    const errs = {};
    if (mode === "register" && !form.name.trim())
      errs.name = "Name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      errs.email = "Enter a valid email address.";
    if (!form.password) errs.password = "Password is required.";
    else if (mode === "register" && form.password.length < 8)
      errs.password = "Password must be at least 8 characters.";
    if (mode === "register" && form.password !== form.password_confirmation)
      errs.password_confirmation = "Passwords do not match.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setIsSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      let user;
      if (mode === "login") {
        user = await login(form);
      } else {
        user = await register({
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
      }
      navigate(roleRedirects[user.role] ?? "/", { replace: true });
    } catch (err) {
      const nextError =
        err.message ??
        (mode === "login" ? "Login failed." : "Registration failed.");
      setError(nextError);

      if (err.errors) {
        const mapped = {};
        for (const [key, messages] of Object.entries(err.errors)) {
          mapped[key] = messages[0];
        }

        if (mode === "login" && isCredentialsError(err)) {
          delete mapped.email;
          delete mapped.password;
        }

        setFieldErrors(mapped);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <LayoutGroup>
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-hidden">
        <img
          src={authBgImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover brightness-[0.9] saturate-[1.05]"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.46)_0%,rgba(30,64,175,0.24)_42%,rgba(248,250,252,0.36)_100%)] backdrop-blur-[5px]" />

        <motion.div
          className="relative z-10 w-full max-w-[1000px] bg-background rounded-2xl md:rounded-[2.5rem] shadow-[0_4px_6px_rgba(0,0,0,0.03),0_24px_64px_rgba(0,0,0,0.13)] overflow-hidden"
          layout
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.75,
            ease: [0.22, 1, 0.36, 1],
            layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          <div className="grid lg:grid-cols-[58%_42%] gap-0 min-h-[700px]">
            {/* Left Side - Hero Image Panel */}
            <div className="relative lg:rounded-[2rem] m-0 lg:m-4 overflow-hidden min-h-[300px] lg:min-h-0 order-2 lg:order-1">
              {/* Background Image */}
              <img
                src={canteenImage}
                alt="Blue cafeteria tray with plated campus meal"
                className="absolute inset-0 w-full h-full object-cover object-[center_28%]"
              />

              {/* Left-to-right readability overlay — preserves tray visibility */}
              <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(2,6,23,0.58)_0%,rgba(2,6,23,0.44)_18%,rgba(2,6,23,0.24)_38%,rgba(2,6,23,0.08)_56%,rgba(2,6,23,0.01)_72%,rgba(2,6,23,0)_84%)]" />
              {/* Subtle top vignette */}
              <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(2,6,23,0.12)_0%,rgba(2,6,23,0)_100%)]" />

              <div className="relative z-10 flex h-full items-start p-6 lg:p-8">
                <div className="max-w-[20rem] space-y-3.5 pt-7 lg:pt-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-white/80">
                    UniServe
                  </p>
                  <div className="space-y-3">
                    <h2 className="max-w-[10ch] text-[1.625rem] font-medium leading-[1.12] tracking-[-0.035em] text-white lg:text-[2.4rem]">
                      Serve faster.
                      <br />
                      Manage smarter.
                      <br />
                      Feed campus better.
                    </h2>
                    <p className="max-w-[32ch] text-[13px] leading-[1.65] text-white/72 lg:text-[14px]">
                      Manage orders, inventory, and service with one streamlined
                      platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login/Register Form */}
            <motion.div
              layout
              className="flex flex-col items-center justify-center p-6 lg:p-10 order-1 lg:order-2"
            >
              <div
                className="bg-white rounded-2xl w-full p-8 max-w-[420px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.05),0_20px_52px_rgba(0,0,0,0.09)]"
                style={{ transform: "none", transformOrigin: "50% 50% 0px" }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    layout
                    key={mode}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.25,
                      ease: "easeInOut",
                      layout: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    }}
                  >
                    {/* Heading */}
                    <div className="mb-4 text-center">
                      <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-foreground sm:text-[32px]">
                        {mode === "login" ? "Sign in" : "Create account"}
                      </h1>
                      <p className="mx-auto mt-1.5 max-w-[30ch] text-[14px] leading-[1.6] text-muted-foreground">
                        {mode === "login"
                          ? "Enter your account details to continue."
                          : "Fill in the details to create your account."}
                      </p>
                    </div>

                    {/* Global error */}
                    {error && (
                      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                        {error}
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="space-y-4"
                    >
                      {/* Name - register only */}
                      {mode === "register" && (
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <Label
                            htmlFor="name"
                            className="text-[13px] font-medium"
                          >
                            Full name
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            value={form.name}
                            onChange={handleChange}
                            className={`h-[50px] rounded-xl ${
                              fieldErrors.name
                                ? "border-red-400 focus-visible:ring-red-300"
                                : "border-slate-300 focus-visible:ring-0 focus-visible:border-slate-300"
                            }`}
                          />
                          {fieldErrors.name && (
                            <p className="text-xs text-red-500">
                              {fieldErrors.name}
                            </p>
                          )}
                        </motion.div>
                      )}

                      {/* Email */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-[13px] font-medium"
                        >
                          Email address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            className={`h-[50px] pl-10 rounded-xl ${
                              fieldErrors.email
                                ? "border-red-400 focus-visible:ring-red-300"
                                : "border-slate-300 focus-visible:ring-0 focus-visible:border-slate-300"
                            }`}
                          />
                        </div>
                        {fieldErrors.email && (
                          <p className="text-xs text-red-500">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-[13px] font-medium"
                        >
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete={
                              mode === "login"
                                ? "current-password"
                                : "new-password"
                            }
                            placeholder="Password"
                            value={form.password}
                            onChange={handleChange}
                            className={`h-[50px] pl-10 pr-10 rounded-xl ${
                              fieldErrors.password
                                ? "border-red-400 focus-visible:ring-red-300"
                                : "border-slate-300 focus-visible:ring-0 focus-visible:border-slate-300"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {fieldErrors.password && (
                          <p className="text-xs text-red-500">
                            {fieldErrors.password}
                          </p>
                        )}
                      </div>

                      {/* Password confirm - register only */}
                      {mode === "register" && (
                        <motion.div
                          className="space-y-2"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <Label
                            htmlFor="password_confirmation"
                            className="text-[13px] font-medium"
                          >
                            Confirm password
                          </Label>
                          <Input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirm password"
                            value={form.password_confirmation}
                            onChange={handleChange}
                            className={`h-[50px] rounded-xl ${
                              fieldErrors.password_confirmation
                                ? "border-red-400 focus-visible:ring-red-300"
                                : "border-slate-300 focus-visible:ring-0 focus-visible:border-slate-300"
                            }`}
                          />
                          {fieldErrors.password_confirmation && (
                            <p className="text-xs text-red-500">
                              {fieldErrors.password_confirmation}
                            </p>
                          )}
                        </motion.div>
                      )}

                      {/* Remember me + Forgot password - login only */}
                      {mode === "login" && (
                        <motion.div
                          className="flex items-center justify-between"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="remember"
                              checked={form.remember}
                              onCheckedChange={(checked) =>
                                setForm((p) => ({
                                  ...p,
                                  remember: checked === true,
                                }))
                              }
                            />
                            <Label
                              htmlFor="remember"
                              className="text-sm text-muted-foreground cursor-pointer font-normal"
                            >
                              Remember me
                            </Label>
                          </div>
                          <Link
                            to="#"
                            className="text-sm text-[#2563EB] hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </motion.div>
                      )}

                      {/* Submit */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-12 mt-2 rounded-lg text-base font-semibold text-white relative 
                        isolate overflow-hidden bg-gradient-to-r from-[#00033D] to-[#0033FF] ring-1 ring-white/10 
                        shadow-[0_6px_18px_rgba(0,16,120,0.26)] transform-gpu will-change-transform 
                        transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] 
                        hover:-translate-y-[0.5px] hover:shadow-[0_8px_22px_rgba(0,22,140,0.34)] active:translate-y-0 
                        active:scale-[0.997] disabled:opacity-80 disabled:cursor-not-allowed [&>*]:relative [&>*]:z-10 before:content-[''] 
                        before:absolute before:top-0 before:left-[-80%] before:h-full before:w-full 
                        before:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.16),transparent)] before:transition-[left] 
                        before:duration-[450ms] before:ease-out hover:before:left-[100%]"
                      >
                        {isSubmitting
                          ? mode === "login"
                            ? "Signing in..."
                            : "Creating account..."
                          : mode === "login"
                            ? "Sign in"
                            : "Create account"}
                      </Button>
                    </form>
                  </motion.div>
                </AnimatePresence>

                {/* Mode toggle */}
                <p className="mt-5 text-sm text-center text-muted-foreground">
                  {mode === "login"
                    ? "Don't have an account? "
                    : "Already have an account? "}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="font-medium text-[#2563EB] hover:text-[#1d4ed8] hover:underline transition-colors duration-150"
                  >
                    {mode === "login" ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </LayoutGroup>
  );
}
