import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { s3 } from "@/app/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const certificate = await prisma.certificate.findUnique({
            where: { id },
            select: {
                s3Key: true,
                fileType: true,
                status: true,
            },
        });

        if (!certificate) {
            return NextResponse.json(
                { error: "Certificate not found" },
                { status: 404 }
            );
        }

        // Only allow viewing of VERIFIED or APPROVED certificates publicly
        if (certificate.status !== "VERIFIED" && certificate.status !== "APPROVED") {
            return NextResponse.json(
                { error: "Certificate not publicly available" },
                { status: 403 }
            );
        }

        // Generate signed URL for public viewing
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
        console.error("Error generating public view URL:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate view URL" },
            { status: 500 }
        );
    }
}
