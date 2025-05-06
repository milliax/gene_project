import { prisma } from '@/lib/prisma'

import { getPlaces } from './src/fetcher'

// this is fetcher codes

async function main() {
    // ... you will write your Prisma Client queries here
    getPlaces()
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        // process.exit(1)
    })