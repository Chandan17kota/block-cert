import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CertificateStatus } from "@/app/generated/prisma";
import { generateCertificateHash } from "@/app/lib/hash";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const user = authResult.user;

    // ✅ IMPORTANT FIX
    const { id: certificateId } = await context.params;

    if (!certificateId) {
      return NextResponse.json(
        { message: "Certificate ID missing" },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { owner: true },
    });

    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    // 🔐 Access Check
    const isOwner = certificate.ownerId === user.id;
    const isAdmin = user.usertype === "INSTITUTION" &&
      user.admin === true &&
      user.institutionname === certificate.owner.institutionname;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    // 🪣 Generate Signed URL for viewing
    // This fixes broken/wrong-region URLs stored in the DB by dynamically generating a valid link
    let signedUrl = certificate.fileUrl;
    try {
      if (certificate.s3Key) {
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
        const { GetObjectCommand } = await import("@aws-sdk/client-s3");
        const { s3 } = await import("@/app/lib/s3");

        const command = new GetObjectCommand({
          Bucket: process.env.S3_BUCKET || process.env.AWS_S3_BUCKET!,
          Key: certificate.s3Key,
        });

        signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
      }
    } catch (e) {
      console.error("Failed to sign URL:", e);
      // Fallback to stored URL
    }

    return NextResponse.json({ ...certificate, fileUrl: signedUrl });
  } catch (error) {
    console.error("Get certificate error:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}

const ALLOWED_STATUS: CertificateStatus[] = [
  "PENDING",
  "VERIFIED",
  "APPROVED",
  "REJECTED",
];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const user = authResult.user;
    const { id: certificateId } = await context.params;

    if (!certificateId) {
      return NextResponse.json(
        { message: "Certificate ID missing" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value" },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      return NextResponse.json(
        { message: "Certificate not found" },
        { status: 404 }
      );
    }

    // 🔐 Access Check: Either the Owner or an Institution Admin of the same institution
    const isOwner = certificate.ownerId === user.id;

    // Fetch owner to check institution
    const certificateOwner = await prisma.user.findUnique({
      where: { id: certificate.ownerId },
      select: { institutionname: true }
    });

    const isInstitutionAdmin = (user.usertype === "INSTITUTION" || user.usertype === "ADMIN") &&
      user.institutionname === certificateOwner?.institutionname;

    if (!isOwner && !isInstitutionAdmin) {
      return NextResponse.json(
        { message: "Access denied: You don't have permission to update this certificate" },
        { status: 403 }
      );
    }

    let verificationHash = certificate.verificationHash;

    // ✅ Generate hash only when certificate becomes VERIFIED / APPROVED
    if (
      (status === "VERIFIED" || status === "APPROVED") &&
      !verificationHash
    ) {
      const hashInput = `${certificate.id}:${certificate.s3Key}:${certificate.ownerId}`;
      verificationHash = generateCertificateHash(hashInput);
    }

    const updatedCertificate = await prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status,
        verificationHash,
      },
    });

    // ✅ Add Activity Log
    await prisma.certificateLog.create({
      data: {
        certificateId: certificate.id,
        action: status === "APPROVED" || status === "VERIFIED" ? "CERTIFICATE_VERIFIED" : "CERTIFICATE_REJECTED",
        performedById: user.id,
        metadata: {
          newStatus: status,
          previousStatus: certificate.status
        }
      }
    });

    return NextResponse.json({
      message: "Certificate updated successfully",
      certificate: updatedCertificate,
    });
  } catch (error) {
    console.error("Update certificate error:", error);
    return NextResponse.json(
      { message: "Failed to update certificate" },
      { status: 500 }
    );
  }
}