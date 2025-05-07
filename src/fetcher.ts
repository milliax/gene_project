import { prisma } from "@/lib/prisma"

export const getPlacesReviewNumber = async (place_id: string) => {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=user_ratings_total,geometry&key=${process.env.API_KEY}`)

    const data = await res.json()

    return data
}

export const getPlacesRoutingExpenses = async (place_id: string) => {
    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.API_KEY ?? "",
            // "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline"
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
        },
        body: JSON.stringify({
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": process.env.LOCATION_LAT,
                        "longitude": process.env.LOCATION_LNG
                    }
                }
            },
            "destination": {
                "placeId": place_id
            },
            "travelMode": "TWO_WHEELER",
            "routingPreference": "TRAFFIC_AWARE",
            "computeAlternativeRoutes": false,
            "routeModifiers": {
                "avoidTolls": false,
                "avoidHighways": false,
                "avoidFerries": false
            },
            "languageCode": "en-US",
            "units": "IMPERIAL"
        })
    })

    const data = await res.json()

    return data
}

export const getPlaces = async (lat: number = 24.784144, lng: number = 120.996336) => {
    // 1度經度 ≈ 111.32 × 0.9205 ≈ 102.47 公里, 23°N
    // 1度緯度 ≈ 111.13 公里

    // target 1000 stores

    // initial lat lng
    // const lat = 24.784144
    // const lng = 120.996336

    let x = 0, y = 0;
    let steps = 1;          // 初始每方向走1步
    let directionIndex = 0; // 從「右」開始
    let currentStep = 0;

    const directions = [
        [1, 0],   // 右
        [0, 1],   // 上
        [-1, 0],  // 左
        [0, -1],  // 下
    ];

    try {
        const start_idx = 0
        const end_idx = 1600
        // const start_idx = 201
        // const end_idx = 1600

        const radius = 300 // in meters

        let continueFlag = true

        while(continueFlag) { // 最多走200步
            for (let i = 0; i < 2; i++) { // 每兩個方向一組（例如右→上）
                const [dx, dy] = directions[directionIndex % 4];
                for (let j = 0; j < steps; j++) {
                    x += dx;
                    y += dy;
                    currentStep++;

                    if(currentStep < start_idx){
                        continue
                    }
                    if (currentStep > end_idx) {
                        continueFlag = false
                        break;
                    }

                    // console.log(`Step ${currentStep}: (${dx}, ${dy})`);
                    // fetch place
                    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Goog-Api-Key': process.env.API_KEY || "",
                            "X-Goog-FieldMask": "places.name,places.displayName,places.priceRange,places.rating,places.regularOpeningHours"
                        },
                        body: JSON.stringify({
                            "includedTypes": ["restaurant"],
                            "locationRestriction": {
                                "circle": {
                                    "center": {
                                        "latitude": lat + (y / 111.13) * Math.sqrt(2) * radius / 2000,
                                        "longitude": lng + (x / 102.47) * Math.sqrt(2) * radius / 2000,
                                    },
                                    "radius": radius // in meters
                                }
                            },
                            "maxResultCount": 20,
                        })
                    })
                    const data = await res.json();

                    if (res.ok) {
                        if (!data || !data.places || data.places.length === 0) {
                            continue;
                        }

                        for (const store of data.places) {
                            const { name, displayName, priceRange, rating, regularOpeningHours } = store;

                            const routeData = await getPlacesRoutingExpenses(name.split("/")[1])
                            const getPlacesReviewNumberData = await getPlacesReviewNumber(name.split("/")[1])

                            let days = []

                            if (regularOpeningHours && regularOpeningHours.periods) {
                                days = regularOpeningHours.periods.map((period: any) => ({
                                    open: {
                                        day: period?.open?.day ?? -1,
                                        hour: period?.open?.hour ?? -1,
                                        minute: period?.open?.minute ?? -1
                                    },
                                    close: {
                                        day: period?.close?.day ?? -1,
                                        hour: period?.close?.hour ?? -1,
                                        minute: period?.close?.minute ?? -1
                                    }
                                }))
                            }

                            const averagePrice = priceRange ? (parseInt(priceRange.startPrice.units) + parseInt(priceRange?.endPrice?.units ?? "10000")) / 2 : -1

                            await prisma.store.upsert({
                                where: {
                                    placeId: name.split("/")[1]
                                },
                                update: {},
                                create: {
                                    name: displayName.text,
                                    rating: rating ?? -1,
                                    ratingCount: getPlacesReviewNumberData?.result.user_ratings_total ?? -1,
                                    price: averagePrice,

                                    distance: routeData.routes[0].distanceMeters,
                                    travelTime: parseInt(routeData.routes[0].duration.split("s")[0]),

                                    placeId: name.split("/")[1],

                                    openingHours: {
                                        createMany: {
                                            data: days.map((day: any) => ({
                                                dayOfWeek: day.open.day,

                                                openHour: day.open.hour,
                                                openMinute: day.open.minute,
                                                closeHour: day.close.hour,
                                                closeMinute: day.close.minute
                                            }))
                                        }
                                    }
                                }
                            })
                        }

                    }

                }
                directionIndex++; // 換下一個方向
            }
            steps++; // 兩個方向後，步數加1
            console.log(`Step ${steps}, currentStep: ${currentStep}, x: ${x}, y: ${y}, directionIndex: ${directionIndex}`);
        }
    } catch (error) {
        console.log("Error: ", error)
    }



}