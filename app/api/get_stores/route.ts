import { NextResponse, NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';

export const GET = async (req: NextRequest) => {
    const now = new Date();

    const startOfThisWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - now.getDay())

    const endOfThisWeek = new Date(
        startOfThisWeek.getFullYear(),
        startOfThisWeek.getMonth(),
        startOfThisWeek.getDate() + 8);

    console.log('startOfThisWeek', startOfThisWeek)
    console.log('endOfThisWeek', endOfThisWeek)

    const stores = await prisma.store.findMany({
        where: {
            lastSelectedAt: {
                gte: startOfThisWeek,
                lt: endOfThisWeek,
            }
        }, orderBy: {
            lastSelectedAt: 'desc'
        }
    })

    // TODO: Assign for the days
    // retrun first 7 solution

    return NextResponse.json({ stores: stores.slice(0, 7) }, { status: 200 })
}