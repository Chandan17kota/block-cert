import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * ADMIN UTILITY: Fix student-institution mappings
 * Updates all students WITHOUT an institution to match a specific admin's institution
 */
export async function POST(req: Request) {
    try {
        const { adminEmail, newInstitution } = await req.json();

        if (!adminEmail || !newInstitution) {
            return NextResponse.json({
                error: 'Missing adminEmail or newInstitution'
            }, { status: 400 });
        }

        // Find the admin
        const admin = await prisma.user.findUnique({
            where: { email: adminEmail }
        });

        if (!admin || (admin.usertype !== 'INSTITUTION' && admin.usertype !== 'ADMIN')) {
            return NextResponse.json({
                error: 'Admin not found or invalid usertype'
            }, { status: 404 });
        }

        // Update all students with @university.edu emails to the new institution
        const result = await prisma.user.updateMany({
            where: {
                usertype: 'STUDENT',
                email: {
                    contains: '@university.edu'
                }
            },
            data: {
                institutionname: newInstitution
            }
        });

        return NextResponse.json({
            success: true,
            message: `Updated ${result.count} students to "${newInstitution}"`,
            count: result.count
        });

    } catch (error: any) {
        console.error('[Fix Students] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
