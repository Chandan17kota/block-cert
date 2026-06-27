
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let whereCondition = {};

        // If Institution Admin, filter logs for certs belonging to that institution
        if (user.usertype === 'INSTITUTION') {
            if (!user.institutionname) {
                return NextResponse.json({ error: 'Institution not found' }, { status: 400 });
            }
            whereCondition = {
                certificate: {
                    owner: {
                        institutionname: user.institutionname
                    }
                }
            };
        }
        // If Student, filter for logs related to their own certificates
        else if (user.usertype === 'STUDENT') {
            whereCondition = {
                certificate: {
                    ownerId: user.id
                }
            };
        }

        const logs = await prisma.certificateLog.findMany({
            where: whereCondition,
            include: {
                performedBy: {
                    select: {
                        username: true,
                        fullName: true,
                        usertype: true
                    }
                },
                certificate: {
                    select: {
                        title: true,
                        id: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50 // Limit to last 50 actions
        });

        // Format for frontend
        const formattedLogs = logs.map(log => ({
            id: log.id,
            action: log.action,
            date: log.createdAt,
            performer: log.performedBy.fullName || log.performedBy.username,
            role: log.performedBy.usertype,
            targetCert: log.certificate.title || "Untitled Certificate",
            details: log.metadata
        }));

        return NextResponse.json({
            success: true,
            logs: formattedLogs
        });

    } catch (error: any) {
        console.error("Reports error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
