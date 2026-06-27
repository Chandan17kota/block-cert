"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Briefcase, GraduationCap, ShieldCheck } from "lucide-react";

import {
  Award,
  Shield,
  Sparkles,
  Brain,
  Zap,
  Users,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  Loader2
} from "lucide-react";

import { useAuthForm } from "@/lib/auth-context";
import { signinSchema, SigninFormData } from "@/lib/auth-types";
import { isApiError } from "@/lib/auth-api";
import { signIn } from "next-auth/react";

export default function SigninPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("STUDENT"); // Default role

  const router = useRouter();
  const { signin, isLoading } = useAuthForm();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    clearErrors
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema)
  });

  const onSubmit = async (data: SigninFormData) => {
    setError(null);
    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const response = await res.json();

      if (!res.ok) {
        if (response.errors) {
          response.errors.forEach((err: { field: string; message: string }) => {
            setFormError(err.field as keyof SigninFormData, {
              type: "server",
              message: err.message,
            });
          });
          setError(response.message || "Signin failed");
          return;
        }
      }

      // 🔒 STRICT ROLE ENFORCEMENT
      // If user is trying to login as ADMIN but account says STUDENT, deny it.
      const userRole = response.user.usertype;
      if (userRole !== activeTab) {
        // Allow INSTITUTION to act as ADMIN IF confirmed
        const isInstitutionAdminProxy = activeTab === 'ADMIN' && userRole === 'INSTITUTION' && response.user.admin;

        if (!isInstitutionAdminProxy) {
          setError(`Access Denied: You are not registered as a ${activeTab}. Please switch tabs.`);
          return;
        }
      }

      // Store user details in localStorage as requested
      if (typeof window !== "undefined") {
        localStorage.setItem("usertype", userRole || "");
        localStorage.setItem("isAdmin", response.user.admin ? "true" : "false");
        localStorage.setItem("current_role_view", activeTab); // Store which portal they entered
      }

      if (activeTab === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (activeTab === "COMPANY") {
        router.push("/dashboard/verify"); // Companies land on verify
      } else {
        router.push("/dashboard"); // Students land on overview
      }

    } catch (error) {
      console.error("Signin error:", error);

      if (isApiError(error)) {
        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err) => {
            if (err.field) {
              setFormError(err.field as keyof SigninFormData, {
                type: "server",
                message: err.message,
              });
            }
          });
        } else setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative">

      {/* GRID + NOISE BACKGROUND */}
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-40" />
      <div className="fixed inset-0 noise-overlay pointer-events-none opacity-10" />

      {/* GLOW ORBS */}
      <div className="fixed top-20 left-1/6 w-[420px] h-[420px] bg-gradient-to-br from-emerald-700/10 via-teal-600/10 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-20 right-1/6 w-[380px] h-[380px] bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent rounded-full blur-[130px] pointer-events-none" />

      {/* NAVBAR */}
      <nav className="border-b border-gray-900/60 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <Award className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-mono">
                <span className="font-light">True</span>
                <span className="font-semibold text-gradient ml-1">Ledger</span>
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <span className="text-gray-400">Don't have an account?</span>
              <Link href="/signup">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-900">
                  Sign Up
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-140px)]">

          {/* LEFT SIDE CONTENT */}
          <div className="space-y-8">

            <Badge variant="secondary" className="px-4 py-2 bg-emerald-950/20 text-emerald-300 border border-emerald-800/30 w-fit">
              <Sparkles className="w-4 h-4 mr-2" />
              Secure Role-Based Access
            </Badge>

            <h1 className="text-4xl lg:text-5xl font-mono font-bold leading-tight">
              <span className="text-white">Sign in</span>
              <span className="block text-gradient">to your portal</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-xl">
              Strictly regulated access for Students, Admin, and Verifiers. Choose your portal to proceed.
            </p>

            {/* FEATURE GRID */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[
                { icon: Brain, title: "AI-Powered OCR", color: "text-emerald-400" },
                { icon: Shield, title: "Blockchain Security", color: "text-emerald-400" },
                { icon: Zap, title: "Instant Processing", color: "text-emerald-400" },
                { icon: Users, title: "Role-Based Access", color: "text-emerald-400" }
              ].map((f, i) => (
                <div key={i} className="glass p-4 rounded-xl border border-emerald-900/20 hover:bg-gray-900/40 transition">
                  <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
                  <p className="font-mono text-gray-300">{f.title}</p>
                </div>
              ))}
            </div>

          </div>

          {/* SIGN-IN CARD */}
          <div className="lg:pl-8">
            <Card className="glass glow-border border border-emerald-900/20 bg-gray-900/40 shadow-2xl rounded-2xl">
              <CardHeader>
                <div className="text-center">
                  <CardTitle className="text-3xl font-mono font-semibold text-white">Welcome Back</CardTitle>
                  <CardDescription className="text-gray-400 mt-2">
                    Select your role to continue
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">

                {/* ROLE TABS */}
                <Tabs defaultValue="STUDENT" onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-emerald-900/30">
                    <TabsTrigger value="STUDENT" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-black">
                      <GraduationCap className="w-4 h-4 mr-2" /> Student
                    </TabsTrigger>
                    <TabsTrigger value="ADMIN" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-black">
                      <Briefcase className="w-4 h-4 mr-2" /> Admin
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* ERROR BANNER */}
                {error && (
                  <Alert variant="destructive" className="border-red-900 bg-red-900/20">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* GOOGLE SIGN IN */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-emerald-300 border border-emerald-800/30 hover:bg-emerald-900/10 hover:border-emerald-500/50 transition-all duration-300"
                    type="button"
                    onClick={() => {
                      // Set cookie to remember user type selection for implicit role check on callback
                      document.cookie = `signup-usertype=${encodeURIComponent(activeTab)}; path=/; max-age=300; SameSite=Lax`;

                      signIn("google", {
                        callbackUrl: "/dashboard",
                      });
                    }}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-900/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-black/60 text-gray-400">Or continue with email</span>
                  </div>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                  {/* EMAIL */}
                  <div className="space-y-2">
                    <Label className="font-medium text-gray-300">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 pl-10 bg-black/30 border-gray-700 text-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-400">{errors.email.message}</p>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-gray-300">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-emerald-400 hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 pl-10 pr-10 bg-black/30 border-gray-700 text-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    </div>

                    {errors.password && (
                      <p className="text-sm text-red-400">{errors.password.message}</p>
                    )}
                  </div>

                  {/* SUBMIT */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-black font-semibold rounded-lg shadow-lg hover:shadow-emerald-600/20 transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <ArrowRight className="w-5 h-5 mr-2" />
                    )}
                    {isLoading ? "Signing in..." : `Sign In as ${activeTab?.charAt(0) + activeTab?.slice(1).toLowerCase()}`}
                  </Button>
                </form>

                {/* FOOTER LINK */}
                <div className="text-center pt-4 border-t border-gray-800">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-emerald-400 hover:underline font-medium">
                      Sign up for free
                    </Link>
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
