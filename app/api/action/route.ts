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
            console.log('query', query);
            const budget = query.get(`budget`);

            console.log('budget', budget);

            await runPython(`src/main.py`, `budget=${budget || 0}`);
        } else if (action === 'reset') {
            // get query parameters
            await runPython(`src/clear_lastSelectedAt.py`);
        }

        return NextResponse.json({ message: 'OK' }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ message: 'Error running python script' }, { status: 500 })
    }
}

