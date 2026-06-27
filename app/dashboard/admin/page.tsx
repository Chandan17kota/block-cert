"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    Shield,
    Download,
    LogOut
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

interface AdminStats {
    totalCertificates: number;
    pending: number;
    approved: number;
    rejected: number;
    verified: number;
    todayUploads: number;
    successRate: number;
}

export default function AdminDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExportingReport, setIsExportingReport] = useState(false);

    useEffect(() => {
        // Strict local storage check as requested
        const checkAccess = () => {
            if (typeof window !== "undefined") {
                const storedType = localStorage.getItem("usertype");
                const storedAdmin = localStorage.getItem("isAdmin");

                if (storedType !== "INSTITUTION" || storedAdmin !== "true") {
                    router.push("/dashboard");
                }
            }
        };

        checkAccess();
    }, [router]);



    const [pendingCerts, setPendingCerts] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch Stats
                const statsRes = await fetch("/api/admin/dashboard/stats");
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                }

                // Fetch Pending Certificates
                const pendingRes = await fetch("/api/admin/certificates/pending?limit=5");
                if (pendingRes.ok) {
                    const pendingData = await pendingRes.json();
                    setPendingCerts(pendingData.data);
                }

            } catch (err) {
                setError("Network error. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        // Check access before fetching
        const storedType = typeof window !== "undefined" ? localStorage.getItem("usertype") : null;

        if (user && user.usertype === "INSTITUTION" || storedType === "INSTITUTION") {
            fetchData();
        } else if (!authLoading && !user) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const handleExportReport = async () => {
        try {
            setIsExportingReport(true);
            const res = await fetch("/api/admin/export-report");
            if (!res.ok) throw new Error("Failed to export report");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `admin-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err: any) {
            alert("Failed to export report: " + err.message);
        } finally {
            setIsExportingReport(false);
        }
    };

    if (authLoading || loading) {
        return (
            <>
                <DashboardHeader title="Admin Dashboard" description="Institution overview and management">
                    <div className="flex gap-2">
                        <Skeleton className="w-[140px] h-10 bg-gray-800/50" />
                        <Skeleton className="w-[100px] h-10 bg-gray-800/50" />
                    </div>
                </DashboardHeader>
                <div className="space-y-8 p-6">
                    {/* Stats Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="w-9 h-9 rounded-lg bg-gray-800/50" />
                                    <Skeleton className="w-16 h-5 rounded-full bg-gray-800/50" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="w-12 h-9 bg-gray-800/50" />
                                    <Skeleton className="w-24 h-4 bg-gray-800/50" />
                                </div>
                                <Skeleton className="w-full h-4 bg-gray-800/30" />
                            </div>
                        ))}
                    </div>

                    {/* Pending Approvals Skeleton */}
                    <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="w-48 h-6 bg-gray-800/50" />
                                <Skeleton className="w-64 h-4 bg-gray-800/50" />
                            </div>
                            <Skeleton className="w-24 h-9 bg-gray-800/50" />
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gray-800/50">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="w-10 h-10 rounded-full bg-gray-800/50" />
                                        <div className="space-y-2">
                                            <Skeleton className="w-32 h-4 bg-gray-800/50" />
                                            <Skeleton className="w-48 h-3 bg-gray-800/50" />
                                        </div>
                                    </div>
                                    <Skeleton className="w-20 h-9 bg-gray-800/50" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Breakdown Grid Skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 space-y-6">
                            <Skeleton className="w-40 h-6 bg-gray-800/50" />
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex justify-between p-3">
                                        <div className="flex gap-3">
                                            <Skeleton className="w-5 h-5 bg-gray-800/50" />
                                            <Skeleton className="w-24 h-5 bg-gray-800/50" />
                                        </div>
                                        <Skeleton className="w-8 h-6 bg-gray-800/50" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6 space-y-6">
                            <Skeleton className="w-32 h-6 bg-gray-800/50" />
                            <div className="grid grid-cols-2 gap-4">
                                <Skeleton className="h-24 rounded-lg bg-gray-800/50" />
                                <Skeleton className="h-24 rounded-lg bg-gray-800/50" />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card className="bg-red-900/10 border-red-900/20">
                    <CardContent className="p-6 flex items-center justify-center text-red-400">
                        {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!stats) return null;



    return (
        <>
            <DashboardHeader
                title="Admin Dashboard"
                description="Institution overview and management"
            >
                <Button
                    variant="outline"
                    className="border-emerald-900/30 text-emerald-400 hover:bg-emerald-900/20"
                    onClick={handleExportReport}
                    disabled={isExportingReport || !stats}
                >
                    {isExportingReport ? (
                        <>
                            <Download className="w-4 h-4 mr-2 animate-spin" /> Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" /> Export Report
                        </>
                    )}
                </Button>
                {/* <Button
                    variant="destructive"
                    onClick={() => {
                        // Clear local storage explicitly here as well just to be safe
                        if (typeof window !== "undefined") {
                            localStorage.removeItem("usertype");
                            localStorage.removeItem("isAdmin");
                        }
                        // Call context signout
                        useAuth().signout();
                        // Force redirect just in case
                        router.push("/signin");
                    }}
                    className="bg-red-900/20 text-red-400 border border-red-900/30 hover:bg-red-900/40"
                >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button> */}
            </DashboardHeader>

            <div className="space-y-8 p-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        title="Total Certificates"
                        value={stats.totalCertificates}
                        icon={FileText}
                        description="All time issuance"
                        trend="+12% this month"
                    />
                    <StatsCard
                        title="Pending Review"
                        value={stats.pending}
                        icon={Clock}
                        description="Requires action"
                        trend={`${stats.pending} items waiting`}
                        alert={stats.pending > 0}
                    />
                    <StatsCard
                        title="Verified Certificates"
                        value={stats.verified}
                        icon={Shield}
                        description="Successfully verified on-chain"
                        trend="High trust score"
                    />
                    <StatsCard
                        title="Success Rate"
                        value={`${stats.successRate}%`}
                        icon={TrendingUp}
                        description="Approval vs Rejection"
                        trend="Unchanged"
                    />
                </div>

                {/* Pending Approvals Section */}
                {pendingCerts.length > 0 && (
                    <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Recent Pending Approvals</CardTitle>
                                <CardDescription>Latest certificates awaiting verification</CardDescription>
                            </div>
                            <Link href="/dashboard/admin/certificates?status=PENDING">
                                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20">
                                    View All <TrendingUp className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingCerts.map((cert) => (
                                    <div key={cert.id} className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-gray-800/50 hover:border-emerald-500/20 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-500">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white">{cert.title}</h4>
                                                <p className="text-xs text-gray-400">Issued to {cert.owner.fullName} • {new Date(cert.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/dashboard/admin/certificates`}>
                                                <Button size="sm" variant="outline" className="border-gray-700 hover:bg-gray-800 text-gray-300">
                                                    Review
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Issuance Status</CardTitle>
                            <CardDescription>Breakdown of current certificate statuses</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <StatusRow label="Approved" value={stats.approved} icon={CheckCircle} color="text-emerald-400" />
                            <StatusRow label="Pending" value={stats.pending} icon={Clock} color="text-yellow-400" />
                            <StatusRow label="Rejected" value={stats.rejected} icon={XCircle} color="text-red-400" />
                            <StatusRow label="Uploaded Today" value={stats.todayUploads} icon={FileText} color="text-blue-400" />
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-900/30 border-gray-800 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <Link href="/dashboard/upload">
                                <Button variant="secondary" className="w-full h-24 flex flex-col gap-2">
                                    <FileText className="w-6 h-6" />
                                    Issue New
                                </Button>
                            </Link>
                            <Link href="/dashboard/admin/certificates?status=PENDING">
                                <Button variant="secondary" className="w-full h-24 flex flex-col gap-2">
                                    <Clock className="w-6 h-6" />
                                    Review Pending
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function StatsCard({ title, value, icon: Icon, description, trend, alert }: any) {
    return (
        <Card className={`bg-gray-900/30 border-gray-800 backdrop-blur-sm ${alert ? 'border-yellow-500/30 bg-yellow-900/5' : ''}`}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${alert ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    {alert && <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-[10px] uppercase">Action Required</Badge>}
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{description}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className={alert ? 'text-yellow-500' : 'text-emerald-500'}>{trend}</span>
                </div>
            </CardContent>
        </Card>
    );
}

function StatusRow({ label, value, icon: Icon, color }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-gray-800/50">
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-gray-300 font-medium">{label}</span>
            </div>
            <span className="text-xl font-bold text-white">{value}</span>
        </div>
    );
}

