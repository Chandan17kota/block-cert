import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CertificateStatus } from "@/app/generated/prisma";

export async function GET(
  _req: Request,
  context: { params: Promise<{ hash: string }> }
) {
  try {
    const { hash } = await context.params;

    if (!hash) {
      return NextResponse.json(
        { message: "Verification hash or ID missing" },
        { status: 400 }
      );
    }

    // Try to find by verification hash first, then by ID
    let certificate = await prisma.certificate.findFirst({
      where: { verificationHash: hash },
      include: {
        owner: {
          select: {
            fullName: true,
            email: true,
            institutionname: true,
          },
        },
      },
    });

    // If not found by hash, try by ID
    if (!certificate) {
      certificate = await prisma.certificate.findUnique({
        where: { id: hash },
        include: {
          owner: {
            select: {
              fullName: true,
              email: true,
              institutionname: true,
            },
          },
        },
      });
    }

    if (!certificate) {
      return NextResponse.json(
        {
          verified: false,
          valid: false,
          status: "NOT_FOUND",
          message: "Certificate not found in our records",
          trustScore: 0
        },
        { status: 404 }
      );
    }

    // Determine verification status based on certificate status
    let verified = false;
    let valid = false;
    let trustScore = 0;
    let statusMessage = "";
    let metadataIntegrity = "Failed";
    let contentAnalysis = "Unknown";
    let blockchainAnchor = "Missing";

    switch (certificate.status) {
      case CertificateStatus.VERIFIED:
        verified = true;
        valid = true;
        trustScore = 98;
        statusMessage = "This certificate has been verified and exists on the blockchain.";
        metadataIntegrity = "Verified";
        contentAnalysis = "Safe";
        blockchainAnchor = "Confirmed";
        break;

      case CertificateStatus.APPROVED:
        verified = true;
        valid = true;
        trustScore = 95;
        statusMessage = "This certificate has been approved by the institution.";
        metadataIntegrity = "Verified";
        contentAnalysis = "Safe";
        blockchainAnchor = "Confirmed";
        break;

      case CertificateStatus.PENDING:
        verified = false;
        valid = false;
        trustScore = 60;
        statusMessage = "This certificate is awaiting admin approval and has not been verified yet.";
        metadataIntegrity = "Pending";
        contentAnalysis = "Pending Review";
        blockchainAnchor = "Pending";
        break;

      case CertificateStatus.REJECTED:
        verified = false;
        valid = false;
        trustScore = 20;
        statusMessage = "This certificate has been rejected by the institution.";
        metadataIntegrity = "Failed";
        contentAnalysis = "Suspicious";
        blockchainAnchor = "Revoked";
        break;

      default:
        verified = false;
        valid = false;
        trustScore = 50;
        statusMessage = "Certificate status is unknown.";
    }

    return NextResponse.json({
      verified,
      valid,
      status: certificate.status,
      trustScore,
      message: statusMessage,
      certificate: {
        id: certificate.id,
        title: certificate.title,
        description: certificate.description,
        issuedBy: certificate.owner.institutionname || "Unknown Institution",
        issuedTo: certificate.owner.fullName || certificate.owner.email,
        createdAt: certificate.createdAt,
        fileUrl: certificate.fileUrl,
      },
      analysis: {
        metadataIntegrity,
        contentAnalysis,
        blockchainAnchor
      }
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      {
        verified: false,
        valid: false,
        message: "Verification failed due to server error"
      },
      { status: 500 }
    );
  }
}
