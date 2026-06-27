import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { CertificateStatus } from "@/app/generated/prisma";

/* ---------------- CREATE CERTIFICATE ---------------- */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const user = auth.user;
    const body = await req.json();

    const {
      title,
      description,
      fileUrl,
      fileType,
      s3Key,
      studentEmail, // Optional: if provided, issue to this student
      studentName
    } = body;

    if (!title || !fileUrl || !fileType || !s3Key) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    let ownerId = user.id;

    // If studentEmail is provided, we are issuing TO a student
    if (studentEmail) {
      // 1. Verify Issuer is an Admin
      if (user.usertype !== "INSTITUTION") {
        return NextResponse.json(
          { message: "Only Institution Admins can issue certificates to others." },
          { status: 403 }
        );
      }

      // 2. Find Student by Email or Create if not found
      let student = await prisma.user.findUnique({
        where: { email: studentEmail }
      });

      if (!student) {
        // Auto-create student if they don't exist
        if (!studentName) {
          return NextResponse.json(
            { message: `Student with email '${studentEmail}' not found. Please provide a Name to auto-register them.` },
            { status: 404 }
          );
        }

        student = await prisma.user.create({
          data: {
            email: studentEmail,
            username: studentEmail.split('@')[0].toLowerCase() + Math.floor(Math.random() * 1000),
            fullName: studentName,
            usertype: "STUDENT",
            institutionname: user.institutionname,
            securityId: `AUTO_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          }
        });
      }

      // 3. Verify Student belongs to Institution
      if (user.institutionname && student.institutionname && student.institutionname !== user.institutionname) {
        return NextResponse.json(
          { message: `Student already registered with a different institution (${student.institutionname}).` },
          { status: 403 }
        );
      }

      ownerId = student.id;
    }

    const certificate = await prisma.certificate.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        fileUrl,
        fileType,
        s3Key,
        ownerId: ownerId,
        // If issued by Admin, should it be auto-approved? 
        // The prompt says "issue new ... add corresponding certificate".
        // Usually, if an Admin issues it, it is implicitly verified/approved.
        // However, user said "submit certificate ... for verification". 
        // BUT if Admin issues it, who verifies? The Admin? 
        // Let's set it to APPROVED or VERIFIED if issued by Admin to a Student.
        // If a Student uploads it (ownerId == user.id), it remains PENDING.
        status: (studentEmail && user.usertype === "INSTITUTION") ? CertificateStatus.APPROVED : CertificateStatus.PENDING

      },
    });

    // ✅ Activity log


    // ✅ Activity log (General Creation)
    await prisma.certificateLog.create({
      data: {
        certificateId: certificate.id,
        action: (studentEmail && user.usertype === "INSTITUTION") ? "CERTIFICATE_ISSUED_BY_ADMIN" : "CERTIFICATE_CREATED",
        performedById: user.id,
        metadata: {
          fileType,
          issuedTo: studentEmail || "Self"
        },
      },
    });

    // 🧠 AI Forensic Log (If data exists)
    if (body.forensicData) {
      await prisma.certificateLog.create({
        data: {
          certificateId: certificate.id,
          action: "AI_RISK_ANALYSIS",
          performedById: user.id,
          metadata: body.forensicData, // Stores: { isTampered, confidenceScore, suspicionLevel, findings... }
        },
      });

      // OPTIONAL: Auto-reject if critical
      if (body.forensicData.suspicionLevel === 'DEFINITE_FAKE' || body.forensicData.confidenceScore > 90) {
        await prisma.certificate.update({
          where: { id: certificate.id },
          data: { status: 'REJECTED' }
        });
      }
    }

    return NextResponse.json(
      {
        message: "Certificate created successfully",
        certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create certificate error:", error);
    return NextResponse.json(
      { message: "Failed to create certificate" },
      { status: 500 }
    );
  }
}

/* ---------------- LIST USER CERTIFICATES ---------------- */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) return auth.error;

    const user = auth.user;
    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Number(searchParams.get("limit") || 10), 50);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    //  **FIX: Admins should see ALL certificates from their institution**
    // Students see only their own certificates
    const where: any = {};

    if (user.usertype === 'INSTITUTION' || user.usertype === 'ADMIN') {
      // ADMIN: Show all certificates from students of this institution
      if (!user.institutionname) {
        return NextResponse.json(
          { message: "Admin has no associated institution" },
          { status: 400 }
        );
      }

      where.owner = {
        institutionname: user.institutionname
      };
    } else {
      // STUDENT: Show only own certificates
      where.ownerId = user.id;
    }

    if (
      status &&
      Object.values(CertificateStatus).includes(
        status as CertificateStatus
      )
    ) {
      where.status = status;
    }

    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [certificates, total] = await Promise.all([
      prisma.certificate.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              username: true,
              email: true,
              institutionname: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.certificate.count({ where }),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: certificates,
    });
  } catch (error) {
    console.error("Get certificates error:", error);
    return NextResponse.json(
      { message: "Failed to fetch certificates" },
      { status: 500 }
    );
  }
}
