
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getAuthUser();
        // Strict check: Must be logged in and must be an Institution Admin
        if (!user || user.usertype !== 'INSTITUTION') {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }

        if (!user.institutionname) {
            return NextResponse.json({ error: 'Admin has no associated institution' }, { status: 400 });
        }

        // Fetch students belonging to the same institution
        // Note: In our User model, we have `institutionname` which links students to institutions.
        // We also want to know if they have any pending certificates.

        const students = await prisma.user.findMany({
            where: {
                usertype: 'STUDENT',
                institutionname: user.institutionname
            },
            select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                institutionname: true,
                createdAt: true,
                // We can also count pending certificates for this student
                _count: {
                    select: {
                        certificates: {
                            where: { status: 'PENDING' }
                        }
                    }
                }
            },
            orderBy: {
                fullName: 'asc'
            }
        });

        // Format data for frontend
        const formattedStudents = students.map(s => ({
            id: s.id,
            name: s.fullName || s.username,
            email: s.email,
            institution: s.institutionname,
            joinedAt: s.createdAt,
            pendingCerts: s._count.certificates
        }));

        return NextResponse.json({
            success: true,
            students: formattedStudents
        });

    } catch (error: any) {
        console.error("Error fetching students:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
