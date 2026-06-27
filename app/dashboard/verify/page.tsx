"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, CheckCircle2, XCircle, Search, AlertTriangle, Activity, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VerificationResult {
  valid: boolean;
  verified: boolean;
  status: string;
  trustScore: number;
  message: string;
  certificate?: {
    id: string;
    title: string;
    description: string;
    issuedBy: string;
    issuedTo: string;
    createdAt: string;
  };
  analysis?: {
    metadataIntegrity: string;
    contentAnalysis: string;
    blockchainAnchor: string;
  };
}

export default function VerifyPage() {
  const router = useRouter();

  // 🔒 ROLE PROTECTION: Allow all roles to verify
  useEffect(() => {
    const userRole = localStorage.getItem("usertype");
    // Students can verify too, just redirect admins to their dashboard
    if (userRole === "ADMIN" || userRole === "INSTITUTION") {
      // router.push("/dashboard/admin"); // Actually, let admins verify too
    }
  }, [router]);

  const [certId, setCertId] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid" | "pending">("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);

  // Check for ID in URL query params (for shared links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');
    if (idFromUrl) {
      setCertId(idFromUrl);
      // Auto-verify if ID is present
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      }, 100);
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certId.trim()) return;

    setStatus("loading");
    setResult(null);

    try {
      const response = await fetch(`/api/verify/${encodeURIComponent(certId.trim())}`);
      const data = await response.json();

      setResult(data);

      // Determine UI status based on certificate status
      if (!response.ok || data.status === "NOT_FOUND") {
        setStatus("invalid");
      } else if (data.status === "PENDING") {
        setStatus("pending");
      } else if (data.valid || data.verified) {
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("invalid");
      setResult({
        valid: false,
        verified: false,
        status: "ERROR",
        trustScore: 0,
        message: "Failed to verify certificate. Please try again."
      });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-emerald-400" />
          Verify Certificate
        </h1>
        <p className="text-gray-400">
          Verify the authenticity of digital certificates using <span className="text-emerald-400 font-mono">TrueLedger AI</span> & Blockchain.
        </p>
      </div>

      {/* Search Input */}
      <Card className="bg-black/40 border-emerald-900/20 backdrop-blur-sm mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleVerify} className="flex gap-4">
            <Input
              placeholder="Enter Certificate ID or Verification Hash"
              className="bg-black/20 border-emerald-900/20 text-lg h-12"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
            />
            <Button
              type="submit"
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 h-12 px-8 min-w-[140px]"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" /> Verify
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results Area */}
      <AnimatePresence>
        {status !== 'idle' && status !== 'loading' && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Result Card */}
            <Card className={`border-l-4 ${status === 'valid'
              ? 'border-l-emerald-500 bg-emerald-950/10'
              : status === 'pending'
                ? 'border-l-yellow-500 bg-yellow-950/10'
                : 'border-l-red-500 bg-red-950/10'
              } border-y border-r border-emerald-900/20`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  {status === 'valid' ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span className="text-emerald-400">Certificate Valid</span>
                    </>
                  ) : status === 'pending' ? (
                    <>
                      <Clock className="w-8 h-8 text-yellow-500" />
                      <span className="text-yellow-400">Pending Approval</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-8 h-8 text-red-500" />
                      <span className="text-red-400">Invalid / Suspicious</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {result.message}
                </CardDescription>
              </CardHeader>
              {result.certificate && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded bg-black/20 border border-emerald-900/20">
                      <span className="text-gray-500 block mb-1">Issued By</span>
                      <span className="text-emerald-300 font-medium">{result.certificate.issuedBy}</span>
                    </div>
                    <div className="p-3 rounded bg-black/20 border border-emerald-900/20">
                      <span className="text-gray-500 block mb-1">Date</span>
                      <span className="text-emerald-300 font-medium">
                        {new Date(result.certificate.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-black/20 border border-emerald-900/20">
                    <span className="text-gray-500 block mb-1">Title</span>
                    <span className="text-white font-medium">{result.certificate.title}</span>
                  </div>
                  <div className="p-3 rounded bg-black/20 border border-emerald-900/20">
                    <span className="text-gray-500 block mb-1">Status</span>
                    <Badge className={
                      result.status === 'VERIFIED' || result.status === 'APPROVED'
                        ? "bg-emerald-900/20 text-emerald-300"
                        : result.status === 'PENDING'
                          ? "bg-yellow-900/20 text-yellow-300"
                          : "bg-red-900/20 text-red-300"
                    }>
                      {result.status}
                      {result.status === 'REJECTED' && <span className="ml-2 text-[10px] opacity-70 border-l border-red-400/30 pl-2">NOT ISSUED</span>}
                    </Badge>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* AI Analysis Card */}
            <Card className="bg-black/40 border-emerald-900/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" /> AI Fraud Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trust Score */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">Trust Score</span>
                    <span className={`font-mono font-bold ${result.trustScore > 90 ? 'text-emerald-400' :
                      result.trustScore > 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                      {result.trustScore}/100
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.trustScore}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full ${result.trustScore > 90 ? 'bg-emerald-500' :
                        result.trustScore > 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Analysis Points */}
                {result.analysis && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        {result.analysis.metadataIntegrity === 'Verified' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : result.analysis.metadataIntegrity === 'Pending' ? (
                          <Clock className="w-3 h-3 text-yellow-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        Metadata Integrity
                      </span>
                      <Badge variant="outline" className={
                        result.analysis.metadataIntegrity === 'Verified'
                          ? "text-emerald-400 border-emerald-900/50"
                          : result.analysis.metadataIntegrity === 'Pending'
                            ? "text-yellow-400 border-yellow-900/50"
                            : "text-red-400 border-red-900/50"
                      }>
                        {result.analysis.metadataIntegrity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        {result.analysis.contentAnalysis === 'Safe' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : result.analysis.contentAnalysis === 'Pending Review' ? (
                          <Clock className="w-3 h-3 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                        Content Analysis
                      </span>
                      <Badge variant="outline" className={
                        result.analysis.contentAnalysis === 'Safe'
                          ? "text-emerald-400 border-emerald-900/50"
                          : result.analysis.contentAnalysis === 'Pending Review'
                            ? "text-yellow-400 border-yellow-900/50"
                            : "text-red-400 border-red-900/50"
                      }>
                        {result.analysis.contentAnalysis}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        {result.analysis.blockchainAnchor === 'Confirmed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        ) : result.analysis.blockchainAnchor === 'Pending' ? (
                          <Clock className="w-3 h-3 text-yellow-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        Blockchain Anchor
                      </span>
                      <Badge variant="outline" className={
                        result.analysis.blockchainAnchor === 'Confirmed'
                          ? "text-emerald-400 border-emerald-900/50"
                          : result.analysis.blockchainAnchor === 'Pending'
                            ? "text-yellow-400 border-yellow-900/50"
                            : "text-red-400 border-red-900/50"
                      }>
                        {result.analysis.blockchainAnchor}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
