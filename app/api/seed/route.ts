
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function GET() {
    try {
        const password = await bcrypt.hash("password123", 10);

        // 1. Admin User
        const admin = await prisma.user.upsert({
            where: { email: 'admin@trueledger.com' },
            update: {
                password, // Reset password to ensure known state
                usertype: 'INSTITUTION' as any,
                admin: true
            },
            create: {
                email: 'admin@trueledger.com',
                username: 'admin',
                password,
                fullName: 'System Admin',
                usertype: 'INSTITUTION' as any,
                admin: true,
                institutionname: 'TrueLedger Core',
                securityId: 'SEC_ADMIN_001'
            },
        });

        // 2. Student User
        const student = await prisma.user.upsert({
            where: { email: 'student@university.edu' },
            update: {
                password,
                usertype: 'STUDENT' as any
            },
            create: {
                email: 'student@university.edu',
                username: 'alicestudent',
                password,
                fullName: 'Alice Johnson',
                usertype: 'STUDENT' as any,
                admin: false,
                institutionname: 'MIT',
                securityId: 'SEC_STU_001'
            },
        });

        // 3. Company User
        const company = await prisma.user.upsert({
            where: { email: 'verifier@company.com' },
            update: {
                password,
                usertype: 'COMPANY' as any
            },
            create: {
                email: 'verifier@company.com',
                username: 'acmecorp',
                password,
                fullName: 'Acme Verifications',
                usertype: 'COMPANY' as any,
                admin: false,
                institutionname: 'Acme Corp',
                securityId: 'SEC_COMP_001'
            },
        });

        return NextResponse.json({
            success: true,
            message: "Users seeded/updated successfully",
            users: [admin.email, student.email, company.email]
        });

    } catch (error: any) {
        console.error("Seeding error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
