import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { isInstitutionAdmin } from "@/app/lib/permissions";
import { CertificateStatus } from "@/app/generated/prisma";

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const admin = authResult.user;

    if (
      !isInstitutionAdmin({
        ...admin,
        institutionname: (admin as any).institutionname === null ? undefined : (admin as any).institutionname,
        admin: (admin as any).admin ?? false,
      })
    ) {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const institution = (admin as any).institutionname!;

    const [
      total,
      pending,
      approved,
      rejected,
      verified,
      todayUploads,
      studentCount,
    ] = await Promise.all([
      prisma.certificate.count({
        where: { owner: { institutionname: institution } },
      }),
      prisma.certificate.count({
        where: {
          status: CertificateStatus.PENDING,
          owner: { institutionname: institution },
        },
      }),
      prisma.certificate.count({
        where: {
          status: CertificateStatus.APPROVED,
          owner: { institutionname: institution },
        },
      }),
      prisma.certificate.count({
        where: {
          status: CertificateStatus.REJECTED,
          owner: { institutionname: institution },
        },
      }),
      prisma.certificate.count({
        where: {
          status: CertificateStatus.VERIFIED,
          owner: { institutionname: institution },
        },
      }),
      prisma.certificate.count({
        where: {
          owner: { institutionname: institution },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.user.count({
        where: {
          usertype: "STUDENT",
          institutionname: institution,
        }
      }),
    ]);

    const successRate =
      total === 0 ? 0 : Math.round((approved / total) * 100);

    return NextResponse.json({
      totalCertificates: total,
      pending,
      approved,
      rejected,
      verified,
      todayUploads,
      studentCount,
      successRate,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { message: "Failed to load dashboard stats" },
      { status: 500 }
    );
  }
}
