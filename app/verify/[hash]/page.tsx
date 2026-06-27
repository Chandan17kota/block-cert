"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  User,
  Building,
  FileText,
  ShieldCheck,
  Share2
} from "lucide-react";
import Link from "next/link";

interface CertificateData {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  fileUrl: string;
  issuedBy: string;
  issuedTo: string;
}

export default function VerificationResultPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/verify/${hash}`);
        const result = await res.json();

        if (!res.ok) {
          setError(result.message || "Verification failed");
          return;
        }

        if (result.verified) {
          setData(result.certificate);
        } else {
          setError(result.message || "Certificate invalid");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (hash) verify();
  }, [hash]);

  const handleViewDocument = async () => {
    if (!data) return;

    try {
      const res = await fetch(`/api/public/certificates/${data.id}/view`);
      if (!res.ok) {
        alert("Failed to load document. Please try again.");
        return;
      }

      const result = await res.json();
      if (result.success && result.signedUrl) {
        window.open(result.signedUrl, '_blank');
      }
    } catch (error) {
      console.error("View document error:", error);
      alert("Failed to load document. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 animate-pulse">Verifying credentials on blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 relative pb-20">
      {/* Background */}
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-20" />
      <div className="fixed inset-0 noise-overlay pointer-events-none opacity-10" />

      {/* Navbar */}
      <nav className="border-b border-gray-800/60 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="font-mono text-xl">TrueLedger</span>
          </Link>
          <Link href="/verify">
            <Button variant="ghost" size="sm">Verify Another</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 flex flex-col items-center">

        {error ? (
          /* -------- ERROR STATE -------- */
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mx-auto ring-1 ring-red-500/30">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-red-400">{error}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-400">
              <p className="font-mono">ID: {hash}</p>
            </div>
            <Link href="/verify">
              <Button variant="secondary" className="mt-4">Try Another ID</Button>
            </Link>
          </div>
        ) : (
          /* -------- SUCCESS STATE -------- */
          <div className="max-w-3xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Status */}
            <div className="text-center space-y-4">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1.5 text-base rounded-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verified & Authentic
              </Badge>
              <h1 className="text-4xl font-bold text-white">{data?.title}</h1>
              <p className="text-gray-400">Issued to {data?.issuedTo}</p>
            </div>

            {/* Main Certificate Card */}
            <Card className="glass border-emerald-500/20 bg-gray-900/40 shadow-2xl overflow-hidden relative group">
              {/* Decorative border gradient */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

              <CardContent className="p-8 space-y-8">

                {/* Meta Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <User className="w-4 h-4 mr-2" /> Recipient
                    </div>
                    <p className="text-lg font-medium text-white">{data?.issuedTo}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Building className="w-4 h-4 mr-2" /> Institution
                    </div>
                    <p className="text-lg font-medium text-white">{data?.issuedBy || "TrueLedger Academy"}</p>
                    <Badge variant="outline" className="border-emerald-800 text-emerald-500 text-xs">Verified Issuer</Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4 mr-2" /> Issue Date
                    </div>
                    <p className="text-lg font-medium text-white">
                      {data?.createdAt ? new Date(data.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      }) : "Unknown"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <FileText className="w-4 h-4 mr-2" /> Credential ID
                    </div>
                    <p className="text-sm font-mono text-gray-400 break-all">{hash}</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800" />

                {/* File Preview / Description */}
                <div className="bg-black/30 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {data?.description || "No description provided."}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-12 text-lg" onClick={handleViewDocument}>
                    <Download className="w-5 h-5 mr-2" /> View Original Document
                  </Button>
                  <Button variant="outline" className="flex-1 border-gray-700 h-12 text-lg hover:bg-gray-800">
                    <Share2 className="w-5 h-5 mr-2" /> Share Result
                  </Button>
                </div>

              </CardContent>
            </Card>

            {/* Trust Footer */}
            <div className="text-center pt-8 border-t border-gray-800/50">
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Secured by TrueLedger Blockchain Technology
              </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
