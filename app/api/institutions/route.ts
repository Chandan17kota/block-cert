import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET all unique institution names from the database
 * Used for Student signup dropdown
 */
export async function GET() {
    try {
        // Get unique institution names from users who are INSTITUTION admins
        const institutions = await prisma.user.findMany({
            where: {
                OR: [
                    { usertype: 'INSTITUTION' },
                    { usertype: 'ADMIN' }
                ],
                institutionname: {
                    not: null
                }
            },
            select: {
                institutionname: true
            },
            distinct: ['institutionname']
        });

        // Extract just the names and filter out nulls
        const names = institutions
            .map(i => i.institutionname)
            .filter((name): name is string => name !== null)
            .sort();

        return NextResponse.json({
            success: true,
            institutions: names
        });

    } catch (error: any) {
        console.error('[Institutions API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
