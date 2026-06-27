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
            }
        });

        // Generate CSV content
        const csvHeaders = ['Date', 'Action', 'Performer', 'Role', 'Certificate', 'Certificate ID'];
        const csvRows = logs.map(log => [
            new Date(log.createdAt).toLocaleString(),
            log.action.replace(/_/g, ' '),
            log.performedBy.fullName || log.performedBy.username,
            log.performedBy.usertype,
            log.certificate.title || 'Untitled Certificate',
            log.certificate.id
        ]);

        // Construct CSV string
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="activity-report-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: any) {
        console.error("Export CSV error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
