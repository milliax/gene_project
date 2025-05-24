import { NextResponse, NextRequest } from 'next/server';
import { runPython } from '@/lib/run';

import { z } from 'zod';

const bodySchema = z.object({
    action: z.enum(['next', 'reset']),
})

export const POST = async (req: NextRequest) => {
    const body = await req.json();

    const parsedBody = bodySchema.safeParse(body);

    if (!parsedBody.success) {
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 })
    }

    const { action } = parsedBody.data;


    try {
        if (action === 'next') {
            const query = req.nextUrl.searchParams;

            const budget = query.get('budget');

            console.log('Resetting lastSelectedAt for budget:', budget);

            const budgetMap = {
                '0': 0,
                '1': 500,
                '2': 1000,
                '3': 1500,
                '4': 2000,
                '5': 2500,
                '6': 3000,
                '7': 3500,
                '8': 4000,
                '9': 4500,
                '10': 10000000000,
            }

            // @ts-ignore'
            let budgetValue = Object.keys(budgetMap).includes(budget || '') ? budgetMap[budget || '0'] : "";

            console.log('Budget value:', budgetValue);

            await runPython(`./src/main.py ${budget === "0" ? "" : budgetValue}`);
        } else if (action === 'reset') {
            // get query parameters
            await runPython(`./src/clear_lastSelectedAt.py`);
        }

        return NextResponse.json({ message: 'OK' }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ message: 'Error running python script' }, { status: 500 })
    }
}

