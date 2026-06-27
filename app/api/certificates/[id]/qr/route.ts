import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import QRCode from "qrcode";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const user = authResult.user;
    const { id } = await context.params;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
    });

    if (!certificate) {
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 });
    }

    if (certificate.ownerId !== user.id) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    if (!certificate.verificationHash) {
      return NextResponse.json(
        { message: "Certificate not verifiable yet" },
        { status: 400 }
      );
    }

    // Generate verify URL with fallback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const verifyUrl = `${baseUrl}/verify/${certificate.verificationHash}`;

    const qr = await QRCode.toDataURL(verifyUrl, {
      width: 300,
      margin: 2,
    });

    return NextResponse.json({
      qr,
      verifyUrl,
    });
  } catch (error) {
    console.error("QR error:", error);
    return NextResponse.json(
      { message: "Failed to generate QR" },
      { status: 500 }
    );
  }
}
