
import 'dotenv/config'
import { PrismaClient, Role } from './app/generated/prisma'
import bcrypt from 'bcrypt'

console.log("Seed script starting...");

if (process.env.DIRECT_URL) {
    console.log("Overriding DATABASE_URL with DIRECT_URL for seeding...");
    process.env.DATABASE_URL = process.env.DIRECT_URL;
}

const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash("password123", 10)

    // 1. Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@trueledger.com' },
        update: {},
        create: {
            email: 'admin@trueledger.com',
            username: 'admin',
            password,
            fullName: 'System Admin',
            usertype: Role.INSTITUTION, // Using INSTITUTION as admin base
            admin: true,
            institutionname: 'TrueLedger Core',
            securityId: 'SEC_ADMIN_001'
        },
    })
    console.log('Admin user ready:', admin.email)

    // 2. Student User
    const student = await prisma.user.upsert({
        where: { email: 'student@university.edu' },
        update: {},
        create: {
            email: 'student@university.edu',
            username: 'alicestudent',
            password,
            fullName: 'Alice Johnson',
            usertype: Role.STUDENT,
            admin: false,
            institutionname: 'MIT',
            securityId: 'SEC_STU_001'
        },
    })
    console.log('Student user ready:', student.email)

    // 3. Company User
    const company = await prisma.user.upsert({
        where: { email: 'verifier@company.com' },
        update: {},
        create: {
            email: 'verifier@company.com',
            username: 'acmecorp',
            password,
            fullName: 'Acme Verifications',
            usertype: Role.COMPANY,
            admin: false,
            institutionname: 'Acme Corp',
            securityId: 'SEC_COMP_001'
        },
    })
    console.log('Company user ready:', company.email)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
