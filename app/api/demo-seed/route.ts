
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from "bcrypt";
import crypto from "crypto";

export async function GET() {
    try {
        console.log("🚀 Starting Demo Seed via API...");

        const demoEmails = [
            "sarah@mit.edu",
            "alex@mit.edu",
            "james@mit.edu",
            "mira@mit.edu"
        ];

        // Clean up
        await prisma.certificateLog.deleteMany({
            where: { performedBy: { email: { in: demoEmails } } }
        });

        await prisma.certificate.deleteMany({
            where: { owner: { email: { in: demoEmails } } }
        });

        await prisma.user.deleteMany({
            where: { email: { in: demoEmails } }
        });

        const passwordHash = await bcrypt.hash("demo1234", 10);

        // Create Admin
        const sarah = await prisma.user.create({
            data: {
                email: "sarah@mit.edu",
                username: "sarah_admin",
                fullName: "Dr. Sarah Miller",
                password: passwordHash,
                usertype: "INSTITUTION",
                institutionname: "MIT",
                admin: true,
                securityId: crypto.randomUUID(),
            }
        });

        // Create Students
        const alex = await prisma.user.create({
            data: {
                email: "alex@mit.edu",
                username: "alex_student",
                fullName: "Alex Rivera",
                password: passwordHash,
                usertype: "STUDENT",
                institutionname: "MIT",
                admin: false,
                securityId: crypto.randomUUID(),
            }
        });

        const james = await prisma.user.create({
            data: {
                email: "james@mit.edu",
                username: "james_student",
                fullName: "James Cooper",
                password: passwordHash,
                usertype: "STUDENT",
                institutionname: "MIT",
                admin: false,
                securityId: crypto.randomUUID(),
            }
        });

        const mira = await prisma.user.create({
            data: {
                email: "mira@mit.edu",
                username: "mira_student",
                fullName: "Mira Zhang",
                password: passwordHash,
                usertype: "STUDENT",
                institutionname: "MIT",
                admin: false,
                securityId: crypto.randomUUID(),
            }
        });

        // Create Certificates
        await prisma.certificate.create({
            data: {
                title: "Master of Computer Science",
                description: "Academic Degree with Honors",
                status: "APPROVED",
                fileUrl: "https://placehold.co/800x600/064e3b/ffffff/png?text=MIT+MASTER+DEGREE+MIRA",
                fileType: "image/png",
                s3Key: "mira_mcs_123",
                ownerId: mira.id,
                verificationHash: "sha256:8f43ac8e564a8564f89ac87654ed321bc4567890abcdef1234567890abcdef",
            }
        });

        await prisma.certificate.create({
            data: {
                title: "AWS Certified Cloud Practitioner",
                description: "Professional IT Certification",
                status: "PENDING",
                fileUrl: "https://placehold.co/800x600/2563eb/ffffff/png?text=AWS+CERTIFICATE+ALEX",
                fileType: "image/png",
                s3Key: "alex_aws_456",
                ownerId: alex.id,
            }
        });

        await prisma.certificate.create({
            data: {
                title: "Official Fake University Degree",
                description: "High Quality Graduation Paper",
                status: "PENDING",
                fileUrl: "https://placehold.co/800x600/991b1b/ffffff/png?text=FAKE+FRAUD+DEGREE+JAMES",
                fileType: "image/png",
                s3Key: "james_fake_789",
                ownerId: james.id,
            }
        });

        return NextResponse.json({
            success: true,
            message: "Demo users and certificates seeded.",
            credentials: {
                admin: "sarah@mit.edu / demo1234",
                student1: "alex@mit.edu / demo1234",
                student2: "james@mit.edu / demo1234",
                student3: "mira@mit.edu / demo1234"
            }
        });

    } catch (error: any) {
        console.error("Seed API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
