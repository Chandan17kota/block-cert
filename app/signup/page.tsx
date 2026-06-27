"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Award,
  Shield,
  Users,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Brain,
  Zap
} from "lucide-react";
import Link from "next/link";
import { signupSchema, SignupFormData } from "@/lib/auth-types";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"INSTITUTION" | "STUDENT" | "COMPANY">("INSTITUTION");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // NEW: Institution dropdown state
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
  const [institutionSearch, setInstitutionSearch] = useState("");

  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  React.useEffect(() => {
    if (searchParams && searchParams.get("error") === "AccountNotFound") {
      setError("No account found. Please create an account to continue.");
    }
  }, []);

  // NEW: Fetch available institutions when user switches to STUDENT
  React.useEffect(() => {
    if (userType === 'STUDENT') {
      setInstitutionsLoading(true);
      fetch('/api/institutions')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setInstitutions(data.institutions);
          }
        })
        .catch(err => console.error('Failed to fetch institutions:', err))
        .finally(() => setInstitutionsLoading(false));
    }
  }, [userType]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    clearErrors,
    setValue,
    watch
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      usertype: "INSTITUTION",
      firstname: "",
      lastname: "",
      email: "",
      username: "",
      password: "",
      institutionname: ""
    }
  });

  const watchedUsertype = watch("usertype");

  React.useEffect(() => {
    setValue("usertype", userType);
  }, [userType, setValue]);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onSubmit = async (data: SignupFormData) => {
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }

    setIsLoading(true);
    setError(null);
    clearErrors();

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const response = await res.json();

      if (!res.ok) {
        // show API validation errors
        if (response.errors) {
          response.errors.forEach((err: any) => {
            setFormError(err.field as keyof SignupFormData, {
              type: "server",
              message: err.message
            });
          });
        }

        setError(response.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      // SUCCESS — user created, cookies set by backend

      // Store user details in localStorage as requested
      if (typeof window !== "undefined") {
        localStorage.setItem("usertype", response.user.usertype || "");
        localStorage.setItem("isAdmin", response.user.admin ? "true" : "false");
      }

      // Redirect based on role
      if (response.user.usertype === "INSTITUTION" && response.user.admin) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 relative">
      {/* Grid + noise background — same as landing */}
      <div className="fixed inset-0 grid-pattern pointer-events-none z-0" />
      <div className="fixed inset-0 noise-overlay pointer-events-none z-0 opacity-6" />

      {/* subtle orbs behind content */}
      <div className="fixed -z-10 top-12 left-[6%] w-[360px] h-[360px] rounded-full blur-[110px] bg-gradient-to-br from-emerald-700/6 to-transparent pointer-events-none" />
      <div className="fixed -z-10 bottom-12 right-[8%] w-[300px] h-[300px] rounded-full blur-[90px] bg-gradient-to-br from-teal-600/5 to-transparent pointer-events-none" />

      {/* Navigation - dark, translucent */}
      <nav className="border-b border-gray-900/60 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
                <Award className="w-5 h-5 text-black" />
              </div>
              <div>
                <span className="text-2xl font-mono font-light">
                  True<span className="font-semibold text-gradient ml-1">Ledger</span>
                </span>
                <div className="text-xs text-gray-400 font-mono">Blockchain-Verified Credentials</div>
              </div>
            </Link>

            <div className="hidden lg:flex items-center space-x-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Process</a>
              <a href="#verify" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Verify</a>
              <a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Contact</a>
            </div>

            <div className="flex items-center space-x-3">
              <Link href="/signin">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-black font-medium">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main container - keep two-column layout like original */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-140px)] relative z-10">
          {/* Left - Marketing / Stats */}
          <div className="space-y-8 lg:-mt-50">
            <Badge variant="glow" className="px-4 py-2 text-sm font-medium inline-flex items-center bg-emerald-900/10 text-emerald-300">
              <Sparkles className="w-4 h-4 mr-2" />
              Join 500+ Institutions Worldwide
            </Badge>

            <div>
              <h1 className="text-4xl lg:text-5xl font-mono font-bold mb-4 leading-tight">
                <span className="block text-white">Transform Certificate</span>
                <span className="block text-gradient">Management with AI & Blockchain</span>
              </h1>
              <p className="text-lg text-gray-400 max-w-xl">
                Issue, verify, and manage certificates with tamper-proof storage and AI-powered extraction — trusted by top institutions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4 border border-emerald-900/20">
                <div className="w-10 h-10 bg-emerald-900/10 rounded-lg flex items-center justify-center mb-3">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">AI-Powered OCR</h3>
                <p className="text-sm text-gray-400">Automatically extract certificate data</p>
              </div>

              <div className="glass rounded-xl p-4 border border-emerald-900/20">
                <div className="w-10 h-10 bg-emerald-900/10 rounded-lg flex items-center justify-center mb-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Blockchain Security</h3>
                <p className="text-sm text-gray-400">Tamper-proof verification system</p>
              </div>

              <div className="glass rounded-xl p-4 border border-emerald-900/20">
                <div className="w-10 h-10 bg-emerald-900/10 rounded-lg flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Instant Processing</h3>
                <p className="text-sm text-gray-400">Real-time credential verification</p>
              </div>

              <div className="glass rounded-xl p-4 border border-emerald-900/20">
                <div className="w-10 h-10 bg-emerald-900/10 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-1">Multi-User Dashboard</h3>
                <p className="text-sm text-gray-400">Manage teams and permissions</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full border-2 border-black/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">H</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-black/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">M</span>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full border-2 border-black/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-black">S</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-full border-2 border-black/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-300">+500</span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-white">Trusted by leading institutions</p>
                <p className="text-sm text-gray-400">Harvard, MIT, Stanford and 500+ more</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-900/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">2M+</div>
                <div className="text-sm text-gray-400">Certificates Issued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">99.9%</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-300">500+</div>
                <div className="text-sm text-gray-400">Institutions</div>
              </div>
            </div>
          </div>

          {/* Right - Signup Form Card (glass, lighter hybrid) */}
          <div className="lg:pl-8">
            <Card className="glass rounded-2xl bg-[rgba(15,17,18,0.6)] border border-emerald-900/20 shadow-2xl">
              <CardHeader className="space-y-4 pb-4">
                <div className="text-center">
                  <CardTitle className="text-2xl font-mono font-semibold text-white">Create Your Account</CardTitle>
                  <CardDescription className="text-gray-400 mt-2">Start your free trial today. No credit card required.</CardDescription>
                </div>

                <Tabs defaultValue="INSTITUTION" value={userType} onValueChange={(v) => setUserType(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-emerald-900/30">
                    <TabsTrigger value="STUDENT" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-black">
                      <GraduationCap className="w-4 h-4 mr-2" /> Student
                    </TabsTrigger>
                    <TabsTrigger value="INSTITUTION" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-black">
                      <Building className="w-4 h-4 mr-2" /> Admin
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="bg-[rgba(255,40,40,0.06)] border border-red-700/20 text-red-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-emerald-300 border border-emerald-800/30 hover:bg-emerald-900/10 hover:border-emerald-500/50 transition-all duration-300"
                    type="button"
                    onClick={() => {
                      const currentInstitutionName = watch("institutionname");

                      if (userType === "INSTITUTION" && !currentInstitutionName) {
                        setError("Please enter your Institution Name before continuing with Google");
                        return;
                      }

                      // Set cookie to remember user type selection
                      document.cookie = `signup-usertype=${encodeURIComponent(userType)}; path=/; max-age=300; SameSite=Lax`; // 5 mins

                      if (userType === "INSTITUTION") {
                        document.cookie = `signup-institutionname=${encodeURIComponent(currentInstitutionName || "")}; path=/; max-age=300; SameSite=Lax`;
                      }

                      signIn("google", {
                        callbackUrl: "/dashboard",
                      });
                    }}
                  >
                    {/* Google SVG */}
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register("usertype")} value={userType} />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-300">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        className="h-11 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                        {...register("firstname")}
                      />
                      {errors.firstname && <p className="text-sm text-red-600">{errors.firstname.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        className="h-11 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                        {...register("lastname")}
                      />
                      {errors.lastname && <p className="text-sm text-red-600">{errors.lastname.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@university.edu"
                        className="h-11 pl-10 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                        {...register("email")}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-300">Username</Label>
                    <Input
                      id="username"
                      placeholder="johndoe123"
                      className="h-11 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                      {...register("username")}
                    />
                    {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
                  </div>

                  {/* Institution Field - Dropdown for Students, Text Input for Admins */}
                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-sm font-medium text-gray-300">
                      {userType === "INSTITUTION" ? "Institution Name" : userType === "COMPANY" ? "Company Name" : "Select Your Institution"}
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />

                      {userType === "STUDENT" ? (
                        // STUDENT: Dropdown with autocomplete
                        <>
                          <Input
                            id="institution"
                            placeholder={institutionsLoading ? "Loading institutions..." : "Search for your institution..."}
                            className="h-11 pl-10 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                            value={institutionSearch}
                            disabled={institutionsLoading}
                            onChange={(e) => {
                              setInstitutionSearch(e.target.value);
                              setValue("institutionname", e.target.value);
                              setShowInstitutionDropdown(true);
                            }}
                            onFocus={() => setShowInstitutionDropdown(true)}
                          />

                          {showInstitutionDropdown && institutions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-black border border-emerald-900/30 rounded-lg shadow-2xl">
                              {institutions
                                .filter(inst =>
                                  inst.toLowerCase().includes(institutionSearch.toLowerCase())
                                )
                                .map((inst, idx) => (
                                  <div
                                    key={idx}
                                    className="px-4 py-3 hover:bg-emerald-900/20 cursor-pointer text-white border-b border-emerald-900/10 last:border-b-0 transition-colors"
                                    onClick={() => {
                                      setInstitutionSearch(inst);
                                      setValue("institutionname", inst);
                                      setShowInstitutionDropdown(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Building className="w-4 h-4 text-emerald-400" />
                                      <span>{inst}</span>
                                    </div>
                                  </div>
                                ))
                              }
                              {institutions.filter(inst =>
                                inst.toLowerCase().includes(institutionSearch.toLowerCase())
                              ).length === 0 && (
                                  <div className="px-4 py-3 text-gray-400 text-sm">
                                    No institutions found matching &quot;{institutionSearch}&quot;
                                  </div>
                                )}
                            </div>
                          )}
                        </>
                      ) : (
                        // ADMIN/COMPANY: Regular text input
                        <Input
                          id="institution"
                          placeholder={
                            userType === "INSTITUTION" ? "R V COLLEGE OF ENGINEERING" :
                              userType === "COMPANY" ? "Acme Corp" :
                                "Search for your institution..."
                          }
                          className="h-11 pl-10 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                          {...register("institutionname")}
                        />
                      )}
                    </div>
                    {errors.institutionname && <p className="text-sm text-red-600">{errors.institutionname.message}</p>}

                    {userType === "STUDENT" && !institutionsLoading && institutions.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        ⚠️ No institutions available yet. Contact your admin to register first.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="h-11 pl-10 pr-10 bg-[rgba(255,255,255,0.02)] border border-emerald-900/10 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-emerald-500"
                        {...register("password")}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                      <p>Password must contain:</p>
                      <ul className="list-disc list-inside ml-3">
                        <li>At least 8 characters</li>
                        <li>One uppercase letter</li>
                        <li>One number or special character</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="terms"
                      className="mt-1 border-emerald-800/30"
                      checked={agreedToTerms}
                      onCheckedChange={(checked: boolean) => setAgreedToTerms(checked)}
                    />
                    <Label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                      I agree to TrueLedger's{" "}
                      <Link href="/terms" className="text-emerald-300 hover:underline">Terms of Service</Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-emerald-300 hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Checkbox id="marketing" className="mt-1 border-emerald-800/30" />
                    <Label htmlFor="marketing" className="text-sm text-gray-300">Send me product updates and educational content (optional)</Label>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !agreedToTerms}
                    className="w-full h-12 bg-gradient-to-br from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-300 text-black font-semibold text-base shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="w-5 h-5 mr-2" />
                    )}
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>

                <div className="glass rounded-lg p-4 border border-emerald-900/10 mt-2 bg-[rgba(15,17,18,0.45)]">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-emerald-300 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-emerald-200 mb-1">Your data is secure</p>
                      <p className="text-gray-400">We use enterprise-grade encryption and never share your information with third parties.</p>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-900/20">
                  <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <Link href="/signin" className="text-emerald-300 hover:text-emerald-400 font-medium hover:underline">Sign in here</Link>
                  </p>
                </div>
              </CardContent>
            </Card >
          </div >
        </div >
      </div >
    </div >
  )
}
