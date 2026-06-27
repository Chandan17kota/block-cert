import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { signupSchema } from "@/lib/auth-types";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET ?? "fallback-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET ?? "fallback-refresh-secret";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1️⃣ Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validation.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      firstname,
      lastname,
      email,
      username,
      password,
      usertype,
      institutionname,
    } = validation.data;

    // 2️⃣ Check email
    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json(
        {
          message: "Email already registered",
          errors: [{ field: "email", message: "Email already registered" }],
        },
        { status: 409 }
      );
    }

    // 3️⃣ Check username
    const usernameExists = await prisma.user.findUnique({
      where: { username },
    });
    if (usernameExists) {
      return NextResponse.json(
        {
          message: "Username already taken",
          errors: [{ field: "username", message: "Username already taken" }],
        },
        { status: 409 }
      );
    }

    // 4️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const securityId = crypto.randomUUID();

    // 5️⃣ 🔐 CHECK IF ADMIN SHOULD BE CREATED
    let isAdmin = false;

    if (usertype === "INSTITUTION" && institutionname) {
      const existingAdmin = await prisma.user.findFirst({
        where: {
          usertype: "INSTITUTION",
          institutionname,
          admin: true,
        },
      });

      // First institution user becomes admin
      if (!existingAdmin) {
        isAdmin = true;
      }
    }

    // 6️⃣ Create user
    const newUser = await prisma.user.create({
      data: {
        fullName: `${firstname} ${lastname}`,
        email,
        username,
        password: hashedPassword,
        securityId,
        usertype: usertype as Role,
        institutionname: institutionname, // Save for both Students and Institutions
        admin: isAdmin,
      },
    });

    // 7️⃣ Tokens
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: newUser.id, securityId: crypto.randomUUID() },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // 8️⃣ Response
    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          admin: newUser.admin,
        },
      },
      { status: 201 }
    );

    // 9️⃣ Cookies
    response.headers.append(
      "Set-Cookie",
      serialize("accessToken", token, {
        httpOnly: true,
        path: "/",
        maxAge: 900,
        sameSite: "strict",
      })
    );

    response.headers.append(
      "Set-Cookie",
      serialize("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
        sameSite: "strict",
      })
    );

    return response;
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
