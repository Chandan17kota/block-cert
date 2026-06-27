"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 as CheckIcon, XCircle as XIcon, FileText as FileIcon, Calendar as CalendarIcon, User as UserIcon, Loader2 as LoaderIcon, AlertCircle as AlertIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface CertificateRequest {
    id: string;
    title: string | null;
    createdAt: string;
    fileUrl: string;
    riskScore?: number;
    riskStatus?: string;
    owner: {
        fullName: string | null;
        username: string;
        email: string;
    };
}

export default function AdminApprovalsPage() {
    const [approvals, setApprovals] = useState<CertificateRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                const res = await fetch("/api/approvals");
                if (!res.ok) {
                    throw new Error("Failed to fetch approvals");
                }
                const data = await res.json();
                if (data.success) {
                    setApprovals(data.certificates);
                } else {
                    setError(data.error || "Unknown error");
                }
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchApprovals();
    }, []);

    const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/certificates/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || `Failed to ${status.toLowerCase()} certificate`);
            }

            // Remove from list
            setApprovals(prev => prev.filter(item => item.id !== id));

        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewEvidence = async (id: string) => {
        try {
            const res = await fetch(`/api/certificates/${id}/view`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to load evidence");
            }
            const data = await res.json();
            if (data.success && data.signedUrl) {
                window.open(data.signedUrl, "_blank");
            }
        } catch (err: any) {
            alert(err.message || "Failed to view evidence");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <LoaderIcon className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                <Alert variant="destructive">
                    <AlertIcon className="h-4 w-4" />
                    <div>
                        <h5 className="font-medium mb-1">Error</h5>
                        <AlertDescription>{error}</AlertDescription>
                    </div>
                </Alert>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-mono text-white mb-2 flex items-center gap-3">
                    <CheckIcon className="w-8 h-8 text-emerald-400" /> Pending Approvals
                </h1>
                <p className="text-gray-400">
                    Review and verify student submitted certificates from your institution.
                </p>
            </div>

            <div className="grid gap-6">
                {approvals.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-black/20">
                        No pending approvals found from your students.
                    </div>
                ) : (
                    approvals.map((item) => (
                        <Card key={item.id} className={cn(
                            "bg-black/40 border-emerald-900/20 backdrop-blur-sm transition-all relative overflow-hidden",
                            item.riskStatus === "CRITICAL" ? "border-red-500/30 bg-red-950/5" : ""
                        )}>
                            {item.riskStatus === "CRITICAL" && (
                                <div className="absolute top-0 right-0 p-1 bg-red-600 text-[8px] font-bold text-white px-2 rounded-bl-lg animate-pulse z-10">
                                    AI_FRAUD_FLAG
                                </div>
                            )}
                            <CardHeader className="pb-3 border-b border-emerald-900/10">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-emerald-900/50">
                                            <AvatarFallback className="bg-emerald-950 text-emerald-200">
                                                {(item.owner.fullName || item.owner.username).charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle className="text-lg text-white">{item.title || "Untitled Certificate"}</CardTitle>
                                                {item.riskStatus && (
                                                    <Badge className={cn(
                                                        "text-[10px] font-mono",
                                                        item.riskStatus === "CRITICAL" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                                                            item.riskStatus === "WARNING" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                                                                "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                    )}>
                                                        {item.riskScore}% RISK
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardDescription className="flex items-center gap-2 mt-1 text-gray-400">
                                                <UserIcon className="w-3 h-3" /> {item.owner.fullName || item.owner.username} ({item.owner.email})
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                        Awaiting Verification
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 flex items-center justify-between">
                                <div className="flex items-center gap-6 text-sm text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon className="w-4 h-4 text-emerald-500" />
                                        Submitted: {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                    <button
                                        onClick={() => handleViewEvidence(item.id)}
                                        className="flex items-center gap-2 cursor-pointer hover:text-emerald-400 underline transition-colors"
                                    >
                                        <FileIcon className="w-4 h-4" />
                                        View Evidence
                                    </button>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                                        onClick={() => handleAction(item.id, "REJECTED")}
                                        disabled={processingId === item.id}
                                    >
                                        {processingId === item.id ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <XIcon className="w-4 h-4 mr-2" />}
                                        Reject
                                    </Button>
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                                        onClick={() => handleAction(item.id, "APPROVED")}
                                        disabled={processingId === item.id}
                                    >
                                        {processingId === item.id ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4 mr-2" />}
                                        Verify & Approve
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
