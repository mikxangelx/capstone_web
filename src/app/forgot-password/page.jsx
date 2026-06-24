"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { AuthCardShell } from "@/components/auth-card-shell";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function validateEmail(value) {
  if (!value.trim()) return "Email address is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    return "Please enter a valid email address.";
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    setEmailError(error);
    if (error) return;

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
      toast.success("Reset link sent!", {
        description:
          "If an account exists for that email, a reset link has been sent.",
      });
    }, 800);
  };

  return (
    <AuthCardShell>
      {submitted ? (
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Check your inbox
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for{" "}
            <span className="font-medium text-foreground">{email}</span>, a
            password reset link has been sent.
          </p>
          <Link
            href="/login"
            className={buttonVariants({
              className:
                "mt-6 h-12 w-full rounded-full bg-gradient-to-r from-primary to-rose-700 text-sm font-semibold shadow-lg shadow-primary/30 hover:opacity-95",
            })}
          >
            <ArrowLeft className="size-4" />
            Back to Log In
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8 text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Reset your password
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@hhca.edu.ph"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(undefined);
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  disabled={isLoading}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className="h-12 rounded-full bg-slate-100 pl-11 pr-5"
                />
              </div>
              {emailError && (
                <p id="email-error" role="alert" className="px-2 text-xs text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <div className="flex justify-center pt-1">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-full bg-gradient-to-r from-primary to-rose-700 text-sm font-semibold tracking-wide shadow-lg shadow-primary/30 hover:opacity-95"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              Back to Log In
            </Link>
          </div>
        </>
      )}
    </AuthCardShell>
  );
}
