"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthCardShell } from "@/components/auth-card-shell";
import { useAuth } from "@/components/auth-provider";
import { DEMO_CREDENTIALS, ROLE_LABELS, ROLE_HOME } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function validateEmail(value) {
  if (!value.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Please enter a valid email address.";
}

function validatePassword(value) {
  if (!value) return "Password is required.";
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Already signed in → go straight to the role's home.
  useEffect(() => {
    if (!loading && user) router.replace(ROLE_HOME[user.role] ?? "/login");
  }, [loading, user, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });
    if (emailError || passwordError) return;

    setIsLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (!result.ok) {
        setIsLoading(false);
        toast.error(result.error ?? "Unable to sign in.");
        return;
      }
      toast.success("Welcome back!");
      router.replace(ROLE_HOME[result.user.role] ?? "/login");
    }, 600);
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
  };

  return (
    <AuthCardShell>
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Please login to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-muted-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@hhca.edu.ph"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            }}
            onBlur={() => setErrors((p) => ({ ...p, email: validateEmail(email) }))}
            disabled={isLoading}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-12 rounded-full bg-slate-100 px-5"
          />
          {errors.email && (
            <p id="email-error" role="alert" className="px-2 text-xs text-destructive">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-muted-foreground">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((p) => ({ ...p, password: undefined }));
              }}
              onBlur={() =>
                setErrors((p) => ({ ...p, password: validatePassword(password) }))
              }
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-12 rounded-full bg-slate-100 px-5 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-4 flex items-center text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" role="alert" className="px-2 text-xs text-destructive">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={isLoading}
              className="size-4 rounded border-border accent-[#8B0029]"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="flex justify-center pt-1">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 w-44 rounded-full bg-gradient-to-r from-primary to-rose-700 text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 hover:opacity-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "LOGIN"
            )}
          </Button>
        </div>
      </form>

      {/* Demo accounts — quick fill for testing. Remove when a backend is connected. */}
      <div className="mt-8 border-t border-border pt-5 text-center">
        <p className="mb-2 text-xs text-muted-foreground">
          Demo accounts — click to fill:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {DEMO_CREDENTIALS.map((cred) => (
            <button
              key={cred.email}
              type="button"
              onClick={() => fillDemo(cred.email, cred.password)}
              disabled={isLoading}
              className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {ROLE_LABELS[cred.role]}
            </button>
          ))}
        </div>
      </div>
    </AuthCardShell>
  );
}
