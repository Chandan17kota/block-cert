
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { riskModel } from '@/lib/ai/riskModel';

export async function GET() {
    try {
        const user = await getAuthUser();

        // Strict check: Must be logged in and must be an Institution Admin
        if (!user || (user.usertype !== 'INSTITUTION' && user.usertype !== 'ADMIN')) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }

        if (!user.institutionname) {
            return NextResponse.json({ error: 'Admin has no associated institution' }, { status: 400 });
        }

        // Fetch pending certificates where the student belongs to the SAME institution
        const pendingCerts = await prisma.certificate.findMany({
            where: {
                status: 'PENDING',
                owner: {
                    institutionname: user.institutionname
                }
            },
            include: {
                owner: {
                    select: {
                        fullName: true,
                        username: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Add AI Forensic Scores
        const certsWithRisk = pendingCerts.map(cert => {
            const report = riskModel.getReport(cert.title || "");
            return {
                ...cert,
                riskScore: report.score,
                riskStatus: report.status
            };
        });

        return NextResponse.json({
            success: true,
            certificates: certsWithRisk
        });

    } catch (error: any) {
        console.error("Error fetching approvals:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
