
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { riskModel } from '@/lib/ai/riskModel';
import { brain } from '@/lib/ai/brain';

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message } = await req.json();

        // 1. Gather Rich Context
        let whereCondition = {};
        if (user.usertype === 'INSTITUTION') {
            whereCondition = { owner: { institutionname: user.institutionname } };
        } else if (user.usertype === 'STUDENT') {
            whereCondition = { ownerId: user.id };
        }

        const statsRaw = await prisma.certificate.groupBy({
            by: ['status'],
            where: whereCondition,
            _count: true
        });

        const statusCounts: any = statsRaw.reduce((acc: any, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {});

        const total = Object.values(statusCounts).reduce((a: any, b: any) => a + b, 0) as number;
        statusCounts.total = total;

        const recentRaw = await prisma.certificate.findMany({
            where: whereCondition,
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: { title: true, status: true, id: true, createdAt: true }
        });

        const recent = recentRaw.map(c => ({
            ...c,
            riskScore: Math.round(riskModel.predict(c.title || "") * 100)
        }));

        // 2. Execute Cognitive Intelligence
        const aiResult = await brain.reason(message, {
            stats: statusCounts,
            recent,
            user
        });

        return NextResponse.json({
            success: true,
            response: aiResult.content,
            metadata: aiResult.metadata
        });

    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Failed to process AI query" }, { status: 500 });
    }
}
