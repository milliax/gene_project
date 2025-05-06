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
            await runPython('./src/main.py');
        } else if (action === 'reset') {
            await runPython('./src/clear_lastSelectedAt.py');
        }

        return NextResponse.json({ message: 'OK' }, { status: 200 })
    } catch (e) {
        console.error(e)
        return NextResponse.json({ message: 'Error running python script' }, { status: 500 })
    }
}

