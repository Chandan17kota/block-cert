import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { CertificateStatus } from "@/app/generated/prisma";

/**
 * GET /api/student/dashboard
 * Returns dashboard summary for the logged-in student including:
 * - Today's summary stats
 * - Recent certificates
 */
export async function GET() {
    try {
        const authResult = await requireAuth();
        if ("error" in authResult) return authResult.error;

        const user = authResult.user;

        // Only students can access this endpoint
        if (user.usertype !== "STUDENT") {
            return NextResponse.json(
                { message: "This endpoint is for students only" },
                { status: 403 }
            );
        }

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        // Fetch summary stats and historical data in parallel
        const [
            totalCertificates,
            processedToday,
            verifiedCount,
            pendingCount,
            recentCertificates,
            historicalCertificates
        ] = await Promise.all([
            // Total certificates owned by student
            prisma.certificate.count({
                where: { ownerId: user.id }
            }),

            // Certificates created today
            prisma.certificate.count({
                where: {
                    ownerId: user.id,
                    createdAt: { gte: today }
                }
            }),

            // Verified/Approved certificates
            prisma.certificate.count({
                where: {
                    ownerId: user.id,
                    status: {
                        in: [CertificateStatus.VERIFIED, CertificateStatus.APPROVED]
                    }
                }
            }),

            // Pending certificates
            prisma.certificate.count({
                where: {
                    ownerId: user.id,
                    status: CertificateStatus.PENDING
                }
            }),

            // Recent 3 certificates
            prisma.certificate.findMany({
                where: { ownerId: user.id },
                orderBy: { createdAt: "desc" },
                take: 3,
                select: {
                    id: true,
                    title: true,
                    status: true,
                    createdAt: true,
                    fileType: true
                }
            }),

            // Fetch certificates from last 6 months for charts
            prisma.certificate.findMany({
                where: {
                    ownerId: user.id,
                    createdAt: { gte: sixMonthsAgo }
                },
                select: {
                    createdAt: true,
                    status: true
                },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        // Process data for charts
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyStats = new Map<string, { total: number; success: number }>();

        // Initialize last 6 months with 0
        for (let i = 0; i < 6; i++) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthName = months[d.getMonth()];
            monthlyStats.set(monthName, { total: 0, success: 0 });
        }

        // Aggregate actual data
        historicalCertificates.forEach(cert => {
            const monthName = months[cert.createdAt.getMonth()];
            if (monthlyStats.has(monthName)) {
                const stat = monthlyStats.get(monthName)!;
                stat.total += 1;
                if (cert.status === CertificateStatus.VERIFIED || cert.status === CertificateStatus.APPROVED) {
                    stat.success += 1;
                }
            }
        });

        // Convert map to array and reverse to show oldest to newest if needed
        // (Map iteration order is insertion order, so we need to sort or build carefully)
        // Let's rebuild purely based on the generated 6 months keys to ensure order
        const trendData: any[] = [];
        const successData: any[] = [];

        // Generate keys in chronological order
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(now.getMonth() - i);
            const monthName = months[d.getMonth()];
            const stats = monthlyStats.get(monthName) || { total: 0, success: 0 };

            trendData.push({ name: monthName, value: stats.total });
            successData.push({
                name: monthName,
                rate: stats.total === 0 ? 0 : Math.round((stats.success / stats.total) * 100)
            });
        }

        // Calculate success rate
        const successRate = totalCertificates === 0
            ? 0
            : Math.round((verifiedCount / totalCertificates) * 100 * 10) / 10;

        // Calculate processing queue percentage (pending/total)
        const processingQueuePercent = totalCertificates === 0
            ? 0
            : Math.round((pendingCount / totalCertificates) * 100);

        return NextResponse.json({
            summary: {
                certificatesProcessed: processedToday,
                successRate: successRate,
                pendingReviews: pendingCount,
                processingQueue: processingQueuePercent,
                totalCertificates: totalCertificates
            },
            charts: {
                trends: trendData,
                success: successData
            },
            recentCertificates: recentCertificates.map(cert => ({
                id: cert.id,
                title: cert.title,
                status: cert.status.toLowerCase(),
                createdAt: cert.createdAt,
                timeAgo: getTimeAgo(cert.createdAt)
            }))
        });
    } catch (error) {
        console.error("Student dashboard error:", error);
        return NextResponse.json(
            { message: "Failed to load dashboard data" },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get human-readable time ago
 */
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    return `${diffDays}d ago`;
}
