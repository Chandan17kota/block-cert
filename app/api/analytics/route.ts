
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { riskModel } from '@/lib/ai/riskModel';
import { neuralModel } from '@/lib/ai/neuralModel';

export async function GET() {
    try {
        const user = await getAuthUser();

        let whereCondition = {};
        if (user && user.usertype === 'INSTITUTION') {
            whereCondition = {
                owner: {
                    institutionname: user.institutionname
                }
            };
        } else if (user && user.usertype === 'STUDENT') {
            whereCondition = { ownerId: user.id };
        }

        // Fetch certificates for AI Analysis
        const allCerts = await prisma.certificate.findMany({
            where: whereCondition,
            select: {
                id: true,
                title: true,
                createdAt: true,
                status: true,
                owner: { select: { fullName: true, email: true } },
                logs: {
                    where: { action: "AI_RISK_ANALYSIS" },
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: { metadata: true }
                }
            }
        });

        // 1. Core Counts
        const totalIssued = allCerts.length;
        const verifiedCount = allCerts.filter(c => c.status === 'VERIFIED' || c.status === 'APPROVED').length;
        const rejectedCount = allCerts.filter(c => c.status === 'REJECTED').length;

        // 2. AI Risk Monitoring (REAL ANALYTICS)
        const riskyCerts: any[] = [];
        let suspiciousCount = 0;
        let fraudFlagCount = 0;

        const processedRiskData = allCerts.map(cert => {
            let riskScore = 0;
            let riskStatus = "SAFE";

            // Check for stored AI Forensic Log first
            const aiLog = cert.logs && cert.logs[0];
            if (aiLog && aiLog.metadata) {
                const meta = aiLog.metadata as any;
                // Use the score from the image analysis (0-100)
                riskScore = meta.confidenceScore || 0;

                // Map forensic levels to dashboard statuses
                const level = meta.suspicionLevel || "SAFE";
                if (level === 'DEFINITE_FAKE' || level === 'LIKELY_FAKE') {
                    riskStatus = "CRITICAL";
                } else if (level === 'SUSPICIOUS') {
                    riskStatus = "WARNING";
                } else {
                    riskStatus = "SAFE";
                }

                // If explicitly rejected in DB, force CRITICAL/HIGH SCORE
                if (cert.status === 'REJECTED' && riskScore < 90) riskScore = 95;

            } else {
                // Fallback: Text-based analysis only
                const report = riskModel.getReport(cert.title || "");
                riskScore = report.score;
                riskStatus = report.status;
            }

            if (riskStatus === "CRITICAL") fraudFlagCount++;
            else if (riskStatus === "WARNING") suspiciousCount++;

            const certDataWithRisk = {
                ...cert,
                riskScore: Math.round(riskScore), // Ensure integer
                riskStatus: riskStatus
            };

            // push ALL certs to be considered for the log table
            riskyCerts.push(certDataWithRisk);

            return certDataWithRisk;
        });

        // Sort by Time (Newest First) to show "Real Time" monitoring logs
        // Alternatively sort by Risk Score if priority is needed, but "Monitoring" usually implies recency.
        // Let's do: Prioritize Critical/Warning, then Newest.
        const highRiskCerts = riskyCerts.sort((a, b) => {
            // If one is critical/warning and other is safe, prioritize the risky one
            if (b.riskScore !== a.riskScore) {
                return b.riskScore - a.riskScore;
            }
            // Otherwise sort by recency
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }).slice(0, 5);

        // 3. Monthly Trends
        // 3. Monthly Trends (Last 6 Months)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const trendMap = new Map();
        const today = new Date();

        // Initialize last 6 months buckets
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${months[d.getMonth()]}-${d.getFullYear()}`; // Key: "Jan-2024"
            trendMap.set(key, {
                name: months[d.getMonth()], // Display name: "Jan"
                fullName: key,
                sortDate: d.getTime(),
                certificates: 0,
                verifications: 0,
                risky: 0
            });
        }

        allCerts.forEach(cert => {
            const d = new Date(cert.createdAt);
            const key = `${months[d.getMonth()]}-${d.getFullYear()}`;

            if (trendMap.has(key)) {
                const entry = trendMap.get(key);
                entry.certificates++;
                if (cert.status === 'VERIFIED' || cert.status === 'APPROVED') {
                    entry.verifications++;
                }
                const score = riskModel.predict(cert.title || "");
                if (score > 0.5) entry.risky++;
            }
        });

        const issueData = Array.from(trendMap.values()).sort((a, b) => a.sortDate - b.sortDate);

        // 4. Fraud Distribution
        const fraudData = [
            { name: 'Authentic', value: totalIssued - suspiciousCount - fraudFlagCount },
            { name: 'Suspicious', value: suspiciousCount },
            { name: 'Critical Fraud', value: fraudFlagCount },
        ];

        return NextResponse.json({
            success: true,
            stats: {
                totalIssued,
                verified: verifiedCount,
                rejected: rejectedCount,
                issueData,
                fraudData,
                highRiskCerts,
                aiAccuracy: riskModel.getAccuracy().toFixed(1) + "%",
                modelStatus: "OPTIMAL",
                neuralStats: neuralModel.getStats()
            }
        });

    } catch (error: any) {
        console.error("Analytics error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
