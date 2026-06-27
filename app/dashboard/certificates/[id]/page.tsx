"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, XCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
    Download,
    Calendar,
    User,
    Building,
    FileText,
    ShieldCheck,
    Share2,
    ExternalLink,
    Award,
    Sparkles,
    CheckCircle2
} from "lucide-react";

// Interface matching the protected API response + flattened for UI
interface CertificateData {
    id: string;
    title: string;
    description: string;
    status: string;
    verificationHash: string;
    owner?: {
        fullName: string | null;
        institutionname: string | null;
    };
    createdAt: string;
    fileUrl: string;
    fileType: string;
}

// Log Interface
interface LogData {
    id: string;
    action: string;
    createdAt: string;
    performedBy: {
        username: string;
        usertype: string;
    };
}

// QR Interface
interface QRData {
    qr: string;
    verifyUrl: string;
}

// Timeline Interface
interface TimelineEvent {
    action: string;
    performedBy: string;
    at: string;
}

export default function CertificatePage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [data, setData] = useState<CertificateData | null>(null);
    const [logs, setLogs] = useState<LogData[]>([]);
    const [qrData, setQrData] = useState<QRData | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

    // Loading & Error States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [signedUrl, setSignedUrl] = useState<string | null>(null);

    // Admin Action States
    const [approveId, setApproveId] = useState<string | null>(null);
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const isInstitutionAdmin = user?.usertype === "INSTITUTION" && (data?.owner?.institutionname === user?.institutionname || user?.admin);

    const onApprove = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/certificates/${id}/approve`, { method: "POST" });
            if (res.ok) {
                window.location.reload();
            } else {
                alert("Failed to approve");
            }
        } catch (e) {
            console.error(e);
            alert("Error");
        } finally {
            setActionLoading(false);
            setApproveId(null);
        }
    };

    const onReject = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/certificates/${id}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: rejectReason })
            });
            if (res.ok) {
                window.location.reload();
            } else {
                alert("Failed to reject");
            }
        } catch (e) {
            console.error(e);
            alert("Error");
        } finally {
            setActionLoading(false);
            setRejectId(null);
        }
    };

    const handleDownload = async () => {
        if (!data) return;
        try {
            const res = await fetch(`/api/certificates/${id}/download`);
            if (!res.ok) throw new Error("Download failed");

            const downloadData = await res.json();
            const link = document.createElement('a');
            link.href = downloadData.downloadUrl;
            link.download = data.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to download file.");
        }
    };

    const handleShare = async () => {
        if (!data) return;

        const shareUrl = `${window.location.origin}/dashboard/verify?id=${data.id}`;
        const shareText = `Check out my certificate: ${data.title} - Issued by ${data.owner?.institutionname || 'TrueLedger'}`;

        // Try native share API first (works on mobile and some desktop browsers)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: shareText,
                    url: shareUrl,
                });
                return;
            } catch (err) {
                // User cancelled or share failed, fall through to clipboard
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        }

        // Fallback: Copy to clipboard
        try {
            await navigator.clipboard.writeText(shareUrl);

            // Show success feedback
            const message = `✓ Share link copied to clipboard!\n\n${shareUrl}\n\nAnyone with this link can verify your certificate.`;
            alert(message);
        } catch (err) {
            console.error('Clipboard failed:', err);
            // Final fallback: Show the URL in a prompt
            alert(`Share this link to verify your certificate:\n\n${shareUrl}`);
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                // 1. Fetch Certificate (Protected)
                const certRes = await fetch(`/api/certificates/${id}`);
                const certResult = await certRes.json();

                if (!certRes.ok) {
                    setError(certResult.message || "Certificate not found");
                    setLoading(false);
                    return;
                }
                setData(certResult);

                // 2. Fetch Signed URL for viewing
                const viewRes = await fetch(`/api/certificates/${id}/view`);
                if (viewRes.ok) {
                    const viewResult = await viewRes.json();
                    if (viewResult.success && viewResult.signedUrl) {
                        setSignedUrl(viewResult.signedUrl);
                    }
                }

                // 3. Fetch Logs (Protected)
                const logsRes = await fetch(`/api/certificates/${id}/logs`);
                if (logsRes.ok) {
                    const logsResult = await logsRes.json();
                    setLogs(logsResult.logs || []);
                }

                // 4. Fetch Timeline (Protected)
                const timelineRes = await fetch(`/api/certificates/${id}/timeline`);
                if (timelineRes.ok) {
                    const timelineResult = await timelineRes.json();
                    setTimeline(timelineResult.timeline || []);
                }

                // 5. Fetch QR Code
                if (certResult.status === 'VERIFIED' || certResult.status === 'APPROVED') {
                    const qrRes = await fetch(`/api/certificates/${id}/qr`);
                    if (qrRes.ok) {
                        const qrResult = await qrRes.json();
                        setQrData(qrResult);
                    }
                }
            } catch (err) {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        if (id) fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-emerald-950/20 text-gray-100 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>
                <div className="space-y-6 text-center relative z-10">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                        <div className="absolute inset-0 w-20 h-20 border-4 border-emerald-500/10 border-b-emerald-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-gray-300 animate-pulse text-lg font-medium">Loading certificate details</p>
                        <div className="flex gap-1 justify-center">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-24 h-24 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto ring-1 ring-gray-700/50">
                        <FileText className="w-10 h-10 text-gray-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Certificate Not Found</h1>
                        <p className="text-gray-400">{error || "The requested certificate could not be located."}</p>
                    </div>
                    <Link href="/">
                        <Button variant="outline" className="mt-4 border-gray-700 text-gray-300 hover:bg-gray-800">
                            Return Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-emerald-950/20 text-gray-100 relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[32rem] h-[32rem] bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Grid Pattern */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />
            </div>

            {/* Navbar */}
            <nav className="border-b border-gray-800/50 bg-black/30 backdrop-blur-2xl sticky top-0 z-50 transition-all duration-300">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-110">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-mono text-xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">TrueLedger</span>
                        </Link>
                        <div className="flex gap-3">
                            <Link href="/verify">
                                <Button variant="outline" size="sm" className="border-gray-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300">
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Verify Certificate
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-12 relative z-10">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header with floating animation */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-gray-800/50 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in duration-500 flex items-center gap-2">
                                    {data.status === 'REJECTED' ? <XCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    {data.status}
                                    {data.status === 'REJECTED' && <span className="text-[10px] opacity-70 ml-1 font-mono uppercase bg-red-900/30 px-1 rounded">Not Issued</span>}
                                </Badge>
                                <span className="text-xs text-gray-500 font-mono bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
                                    ID: {data.id.substring(0, 12)}...
                                </span>
                                <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent tracking-tight leading-tight">
                                {data.title}
                            </h1>
                            <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">{data.description}</p>
                        </div>
                        {data.fileUrl && (
                            <Button
                                className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-xl shadow-emerald-900/30 hover:shadow-emerald-900/50 transition-all duration-300 hover:scale-105 px-6 py-6 text-base"
                                onClick={handleDownload}
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Download Certificate
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
                        {/* Main Content */}
                        <div className="space-y-8">
                            {/* Certificate Preview with advanced effects */}
                            <Card className="bg-gray-900/40 border-gray-800/50 overflow-hidden backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="aspect-[4/3] bg-gradient-to-br from-gray-900 to-black relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {data.fileType?.startsWith('image') ? (
                                        <>
                                            {!imageLoaded && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                                </div>
                                            )}
                                            {signedUrl ? (
                                                <img
                                                    src={signedUrl}
                                                    alt="Certificate Preview"
                                                    className={`w-full h-full object-contain transition-all duration-700 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                                                    onLoad={() => setImageLoaded(true)}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center p-8 space-y-4">
                                            <FileText className="w-20 h-20 text-gray-600 mx-auto" />
                                            <p className="text-gray-400">Document Preview Available</p>
                                            {signedUrl && (
                                                <Button variant="outline" onClick={() => window.open(signedUrl, '_blank')}>
                                                    <ExternalLink className="w-4 h-4 mr-2" />
                                                    Open Document
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/5 pointer-events-none" />
                                </div>
                            </Card>

                            {/* Timeline with enhanced design */}
                            <Card className="bg-gray-900/40 border-gray-800/50 backdrop-blur-xl hover:border-emerald-500/20 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.1s' }}>
                                <CardContent className="p-8">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        Certificate Journey
                                    </h3>

                                    <div className="relative">
                                        <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />

                                        <div className="space-y-10">
                                            {timeline.length > 0 ? timeline.map((event, index) => (
                                                <div
                                                    key={index}
                                                    className="relative flex items-start gap-6 group animate-in fade-in slide-in-from-left-4 duration-500"
                                                    style={{ animationDelay: `${index * 0.1}s` }}
                                                >
                                                    <div className="relative">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-emerald-600/30 border-2 border-emerald-500/50 flex items-center justify-center z-10 shrink-0 group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-300 shadow-lg shadow-emerald-500/20">
                                                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                                        </div>
                                                        {index === 0 && (
                                                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 pt-1 flex-1">
                                                        <p className="text-lg text-white font-semibold group-hover:text-emerald-400 transition-colors duration-300">
                                                            {event.action}
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                                            <User className="w-3 h-3" />
                                                            {event.performedBy}
                                                            <span className="text-gray-600">•</span>
                                                            {new Date(event.at).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="text-gray-500 italic pl-16">No timeline events available.</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Details Card */}
                            <Card className="bg-gray-900/40 border-gray-800/50 backdrop-blur-xl hover:border-emerald-500/20 transition-all duration-500 animate-in fade-in slide-in-from-right-4 duration-700">
                                <CardContent className="p-6 space-y-6">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center">
                                            <Award className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        Certificate Details
                                    </h3>

                                    <div className="space-y-1">
                                        {[
                                            { icon: User, label: "Recipient", value: data.owner?.fullName || "Myself" },
                                            { icon: Building, label: "Issuing Authority", value: data.owner?.institutionname || "TrueLedger" },
                                            { icon: Calendar, label: "Issue Date", value: new Date(data.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="flex justify-between items-center py-4 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/20 px-3 -mx-3 rounded-lg transition-all duration-300 group"
                                            >
                                                <span className="text-gray-400 flex items-center gap-3 text-sm">
                                                    <item.icon className="w-4 h-4 text-emerald-500/70 group-hover:text-emerald-400 transition-colors" />
                                                    {item.label}
                                                </span>
                                                <span className="text-white font-semibold text-sm">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {data.verificationHash && (
                                        <div className="bg-gradient-to-br from-gray-950/50 to-gray-900/50 p-5 rounded-xl border border-emerald-500/20 space-y-3 hover:border-emerald-500/40 transition-all duration-300 group">
                                            <div className="flex items-center justify-between text-xs text-gray-400">
                                                <span className="font-semibold uppercase tracking-wider">Blockchain Hash</span>
                                                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <p className="text-xs font-mono text-emerald-400/80 break-all select-all hover:text-emerald-300 transition-colors cursor-pointer leading-relaxed">
                                                {data.verificationHash}
                                            </p>
                                        </div>
                                    )}

                                    <Button
                                        variant="outline"
                                        className="w-full border-gray-700 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-blue-500/10 hover:border-emerald-500/50 transition-all duration-300 py-6"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share Certificate
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* QR Code Card */}
                            {qrData && (
                                <Card className="bg-gradient-to-br from-white via-gray-50 to-white border-gray-300 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 animate-in fade-in zoom-in duration-700" style={{ animationDelay: '0.2s' }}>
                                    <div className="p-6 flex flex-col items-center space-y-4">
                                        <div className="relative group">
                                            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
                                            <div className="relative bg-white p-4 rounded-xl shadow-lg">
                                                <img src={qrData.qr} alt="Verification QR Code" className="w-40 h-40" />
                                            </div>
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm text-gray-900 font-bold">Scan to Verify</p>
                                            <p className="text-xs text-gray-600">Instant blockchain verification</p>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {/* Activity Log Card */}
                            <Card className="bg-gray-900/40 border-gray-800/50 backdrop-blur-xl hover:border-emerald-500/20 transition-all duration-500 animate-in fade-in slide-in-from-right-4 duration-700" style={{ animationDelay: '0.3s' }}>
                                <CardContent className="p-6 space-y-5">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-lg flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-400" />
                                        </div>
                                        Activity History
                                    </h3>
                                    <div className="space-y-5 relative border-l-2 border-gray-800/50 ml-2 pl-6">
                                        {logs.length > 0 ? logs.map((log, i) => (
                                            <div
                                                key={log.id}
                                                className="relative group animate-in fade-in slide-in-from-left-4 duration-500"
                                                style={{ animationDelay: `${i * 0.1}s` }}
                                            >
                                                <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500/50 to-blue-500/50 border-2 border-gray-900 group-hover:scale-125 transition-transform duration-300" />
                                                <div className="space-y-2 bg-gray-800/20 p-3 rounded-lg hover:bg-gray-800/40 transition-all duration-300">
                                                    <p className="text-sm text-gray-200 font-semibold">{log.action}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                                        <User className="w-3 h-3" />
                                                        {log.performedBy.username}
                                                        <span className="text-gray-600">•</span>
                                                        {new Date(log.createdAt).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-gray-500 italic">No activity recorded.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
            {/* Approve Modal */}
            <Modal
                isOpen={!!approveId}
                onClose={() => setApproveId(null)}
                title="Approve Certificate"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setApproveId(null)} disabled={actionLoading}>Cancel</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={onApprove} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Approve
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-300">
                        Are you sure you want to approve this certificate?
                    </p>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex gap-3 text-sm text-emerald-300">
                        <ShieldCheck className="w-5 h-5 shrink-0" />
                        <p>This action will generate a permanent verification hash on the blockchain simulation.</p>
                    </div>
                </div>
            </Modal>

            {/* Reject Modal */}
            <Modal
                isOpen={!!rejectId}
                onClose={() => setRejectId(null)}
                title="Reject Certificate"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setRejectId(null)} disabled={actionLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={onReject} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Reject
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <p className="text-gray-300">
                        Please provide a reason for rejecting this certificate.
                    </p>
                    <Input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="bg-black/40 border-gray-700"
                    />
                </div>
            </Modal>
        </div>
    );
}
