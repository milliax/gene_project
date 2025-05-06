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

    // await prisma.store.create({
    //     data:{
    //         id: "1",
    //         name: "Store 1",
    //         lastSelectedAt: new Date('2023-10-01T00:00:00.000Z'),
    //         rating: 4.5,
    //         ratingCount: 100,
    //         price: 10,

    //         distance: 5,
    //         travelTime: 30,

    //         placeId: "1",
    //     }
    // })

    const stores = await prisma.store.findMany({
        where: {
            lastSelectedAt: {
                gte: startOfThisWeek,
                lt: endOfThisWeek,
            }
        },
    })

    if (stores.length === 0) {
        return NextResponse.json({ message: 'No stores found' }, { status: 500 })
    }

    if (stores.length > 7) {
        // stores grouping by the same lastSelectedAt

        const groupedStores = stores.reduce((acc: any, store: any) => {
            const date = store.lastSelectedAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(store);
            return acc;
        }, {});

        // sort groupedStores by lastSelectedAt
        const sortedGroupedStores = Object.entries(groupedStores).sort((a, b) => {
            const dateA = new Date(a[0]);
            const dateB = new Date(b[0]);
            return dateB.getTime() - dateA.getTime();
        });

        return NextResponse.json({ stores: sortedGroupedStores[-1] }, { status: 200 })
    }

    return NextResponse.json({ stores }, { status: 200 })
}