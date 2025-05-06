"use client"

import MapEmbed from "@/components/map";
import { useEffect, useState } from "react";

export default function Home() {
    const [stores, setStores] = useState<any[]>([]);
    const [placeId, setPlaceId] = useState<string>("");

    const fetchStores = async () => {
        const res = await fetch('/api/get_stores');

        if (!res.ok) {
            console.log('Error fetching stores');
            const data = await res.json();
            console.error(data)
            return;
        }
        const data = await res.json();
        console.log(data)
        setStores(data.stores);
    }

    useEffect(() => {
        fetchStores()
    }, [])

    return (
        <div className="bg-white h-screen flex flex-row text-black">
            <div className="w-[30rem] bg-white h-full shadow-md border-r border-gray-200">
                <div className="flex flex-row w-full px-5 py-6 gap-3 h-18 items-center justify-center">
                    <div className="rounded-md bg-amber-200 px-3 py-1 cursor-pointer hover:bg-amber-300 hover:scale-110 duration-300 transition-all">
                        重新搜尋一下
                    </div>
                    <div className="rounded-md bg-amber-200 px-3 py-1 cursor-pointer hover:bg-amber-300 hover:scale-110 duration-300 transition-all">
                        清除所有搜尋紀錄
                    </div>
                </div>

                <div className="w-full h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-3 gap-2">
                    {stores.map((s, index) => (
                        <PlacesCard key={s.id}
                            name={s.name}
                            placeId={s.placeId}
                            price={s.price}
                            rating={s.rating}
                            ratingCount={s.ratingCount}
                            travelTime={s.travelTime}
                            distance={s.distance}

                            index={index}
                            setPlaceId={setPlaceId}
                        />
                    ))}
                </div>
            </div>
            <div className="bg-slate-100 w-[calc(100vw-30rem)] h-full flex flex-col items-center justify-center">
                {placeId}
                <MapEmbed
                    placeId={placeId} />
            </div>
        </div>
    );
}

function PlacesCard({
    ...props
}: {
    distance: number,
    name: string,
    placeId: string,
    price: number,
    rating: number,
    ratingCount: number,
    travelTime: number,
    index: number,

    setPlaceId: (placeId: string) => void
}) {
    return (
        <div className="w-full h-28 bg-slate-50  shadow-md border-b border-gray-200 flex flex-row items-center px-5 gap-3 cursor-pointer select-none" onClick={() => {
            props.setPlaceId(props.placeId)
        }}>
            <div className="w-24 h-24 rounded-md flex flex-col items-center justify-center bg-slate-200 text-4xl font-bold text-gray-500">
                {WeekInChinese[props.index]}
            </div>
            <div className="flex flex-col w-full h-full justify-center">
                <div className="text-lg font-bold">{props.name}</div>
                <div className="text-sm text-gray-500 flex flex-row gap-3">
                    <div>{props.rating}</div>
                    <div>{props.ratingCount}則評論</div>
                    <div>{props.price}元</div>
                    <div>{props.distance}公里</div>
                    <div>{props.travelTime}分鐘</div>
                </div>
            </div>
        </div>
    )
}

const WeekInChinese = [
    '日',
    '一',
    '二',
    '三',
    '四',
    '五',
    '六',
]