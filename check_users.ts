
import { PrismaClient } from './app/generated/prisma/index.js'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                usertype: true,
                institutionname: true,
                fullName: true,
                id: true
            }
        })
        console.log('--- DATABASE USERS ---')
        users.forEach(u => {
            console.log(`[${u.usertype}] ${u.email} | Name: ${u.fullName} | Inst: ${u.institutionname} | ID: ${u.id}`)
        })
        console.log('----------------------')
    } catch (e: any) {
        console.error('Error querying database:', e.message)
    } finally {
        await prisma.$disconnect()
    }
}

main()
