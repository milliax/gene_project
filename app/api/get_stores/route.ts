import { NextResponse, NextRequest } from 'next/server';
import munkres from 'munkres-js';

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
        }, include: {
            openingHours: true
        }, take: 7
    })

    // TODO: 依照有沒有開店顯示星期幾
    // retrun first 7 solution

    let costMatrix: number[][] = []

    const selected_time = process.env.EATING_TIME
    const hour = parseInt(selected_time?.slice(0, 2) || '0')
    const minute = parseInt(selected_time?.slice(3, 5) || '0')


    console.log("hour", hour)
    console.log("minute", minute)
    try {

        stores.forEach((store) => {
            const costRow: number[] = []
            console.log("store", store.name)

            for (let i = 0; i < 7; i++) {
                // iterate over the days of the week
                const openingHour = store.openingHours.find((oh) => oh.dayOfWeek === i)

                // console.log("day: ", i)

                if (openingHour) {
                    // console.log("openingHour", openingHour)

                    const openTime = new Date(0, 0, 0, openingHour.openHour, openingHour.openMinute)
                    const closeTime = new Date(0, 0, 0, openingHour.closeHour, openingHour.closeMinute)
                    const targetTime = new Date(0, 0, 0, hour, minute)

                    if (openTime.getTime() <= targetTime.getTime() && closeTime.getTime() >= targetTime.getTime()) {
                        // store is open on week [i]
                        costRow.push(0)
                        // console.log("feasible")
                        continue
                    }
                }

                // console.log("infeasible")
                costRow.push(1)
            }
            costMatrix.push(costRow)
        })

        const result = munkres(costMatrix)

        // console.log("costMatrix")
        // console.log(costMatrix)

        // console.log("result", result)

        const orderInday = result.map((pair) => (pair[0]))

        const totalExpense = result.map((pair, idx) => {
            return costMatrix[orderInday[idx]][idx]
        }).reduce((acc, curr) => (acc + curr), 0)

        const orderedStore = stores.map((_data, index) => (stores[orderInday[index]]))
        console.log(stores.length, " stores")
        console.log("orderedStore", orderedStore)

        return NextResponse.json({
            stores: orderedStore,
            feasible: totalExpense === 0,
        }, { status: 200 })

    } catch (error) {
        console.error("Error in cost matrix calculation", error)
        return NextResponse.json({
            error: "Error in cost matrix calculation",
        }, { status: 500 })
    }
}