import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { s3 } from "@/app/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        const certificate = await prisma.certificate.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        institutionname: true,
                    },
                },
            },
        });

        if (!certificate) {
            return NextResponse.json(
                { error: "Certificate not found" },
                { status: 404 }
            );
        }

        // Authorization check: Allow owner, institution admin, or system admin
        const isOwner = certificate.ownerId === user.id;
        const isInstitutionAdmin =
            user.usertype === "INSTITUTION" &&
            user.institutionname === certificate.owner.institutionname;
        const isSystemAdmin = user.usertype === "ADMIN";

        if (!isOwner && !isInstitutionAdmin && !isSystemAdmin) {
            return NextResponse.json(
                { error: "You don't have permission to view this certificate" },
                { status: 403 }
            );
        }

        // Generate signed URL for viewing
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: certificate.s3Key,
        });

        const signedUrl = await getSignedUrl(s3, command, {
            expiresIn: 3600, // 1 hour
        });

        return NextResponse.json({
            success: true,
            signedUrl,
            fileType: certificate.fileType,
        });
    } catch (error: any) {
        console.error("Error generating view URL:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate view URL" },
            { status: 500 }
        );
    }
}
