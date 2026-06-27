import { z } from "zod"

export enum Role {
  STUDENT = "STUDENT",
  INSTITUTION = "INSTITUTION",
  COMPANY = "COMPANY"
}

export interface User {
  id: string
  email: string
  username: string
  fullName?: string | null
  avatar?: string | null
  usertype?: Role | null
  institutionname?: string | null
  admin?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface AuthResponse {
  message: string
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    username: string
    usertype?: Role | null
    institutionname?: string | null
    admin?: boolean
  }
}

export interface AuthError {
  message: string
  errors?: Array<{
    field: string
    message: string
  }>
}

export const signinSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
})

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .refine((val) => {
      const parts = val.split("@");
      if (parts.length !== 2) return false;
      const domain = parts[1].toLowerCase();

      // Explicitly block common misspellings
      const blockedDomains = ["gmil.com", "gmal.com", "gamil.com", "gmial.com", "gmai.com", "gmail.co", "gmail.c"];
      if (blockedDomains.includes(domain)) return false;

      return true;
    }, "Did you mean 'gmail.com'? Please check for typos."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/,
      "Password must include uppercase, lowercase, number and special character"
    ),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .trim(),
  firstname: z
    .string()
    .min(1, "First name is required")
    .trim(),
  lastname: z
    .string()
    .min(1, "Last name is required")
    .trim(),
  usertype: z
    .enum(["STUDENT", "INSTITUTION", "COMPANY"]),
  institutionname: z
    .string()
    .optional()
})
  .refine((data) => {
    if (data.usertype === "INSTITUTION") {
      return data.institutionname && data.institutionname.trim().length > 0
    }
    return true
  }, {
    message: "Institution name is required for institution accounts",
    path: ["institutionname"]
  })

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required")
})

export type SigninFormData = z.infer<typeof signinSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type GoogleAuthData = z.infer<typeof googleAuthSchema>

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface ApiError {
  message: string
  status: number
  errors?: Array<{
    field: string
    message: string
  }>
}