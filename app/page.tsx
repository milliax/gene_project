"use client"

import MapEmbed from "@/components/map";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

import Loading from "@/components/loading";
import { FaRegStar } from "react-icons/fa";

import { Slider } from "@/components/ui/slider"
import Swal from "sweetalert2"

export default function Home() {
    const [stores, setStores] = useState<any[]>([]);
    const [placeId, setPlaceId] = useState<string>("");

    const [researchLoading, setResearchLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const budgetValue = useRef<number>(5);

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
        if (data.stores.length > 0) {
            setPlaceId(data.stores[0].placeId);
        }
    }

    useEffect(() => {
        fetchStores()
    }, [])

    return (
        <div className="bg-white h-screen flex flex-row text-black">
            <div className="w-[30rem] bg-white h-full shadow-md border-r border-gray-200">

                <div className="flex flex-row w-full px-5 py-6 gap-3 h-18 items-center justify-center">
                    <div className={clsx("rounded-md bg-amber-200 px-3 py-1 hover:bg-amber-300 hover:scale-110 duration-300 transition-all relative h-8"
                        , researchLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        , resetLoading && "opacity-50"
                    )} onClick={() => {
                        if (researchLoading) return;
                        if (budgetValue.current === 0) {
                            Swal.fire({
                                title: "預算為0",
                                text: "請設定預算上限，否則無法搜尋到任何店家",
                                icon: "warning",
                                confirmButtonText: "吃屎比較便宜",
                            })
                            return;
                        }
                        setResearchLoading(true);
                        fetch("/api/action?budget=" + budgetValue.current, {
                            method: "POST",
                            body: JSON.stringify({
                                action: "next"
                            })
                        }).then((res) => {
                            if (!res.ok) {
                                console.log('Error fetching stores');
                                const data = res.json();
                                console.log(data)
                                return;
                            }
                            fetchStores();
                            setResearchLoading(false);
                        })
                    }}>
                        重新搜尋一下
                        {researchLoading && <Loading className="aboslute z-50 left-0 right-0 top-0 bottom-0 m-auto" />}
                    </div>
                    <div className={clsx("rounded-md bg-amber-200 px-3 py-1 hover:bg-amber-300 hover:scale-110 duration-300 transition-all relative h-8"
                        , researchLoading && "opacity-50"
                        , resetLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )} onClick={() => {
                        if (resetLoading) return;
                        setResetLoading(true);
                        fetch("/api/action", {
                            method: "POST",
                            body: JSON.stringify({
                                action: "reset"
                            })
                        }).then((res) => {
                            if (!res.ok) {
                                console.log('Error fetching stores');
                                const data = res.json();
                                console.log(data)
                                return;
                            }
                            fetchStores();
                            setResetLoading(false);
                        })
                    }}>
                        清除所有搜尋紀錄
                        {resetLoading && <Loading className="absolute left-0 right-0 top-0 bottom-0 m-auto" />}
                    </div>
                </div>
                <div className="mb-3 px-3 text-center">
                    <label className="">每周預算上限</label>
                </div>
                <div className="w-full h-12 justify-center items-center flex flex-row gap-3 px-5 relative">
                    <Slider defaultValue={[budgetValue.current]}
                        max={5}
                        step={1}
                        onValueChange={(value) => {
                            budgetValue.current = value[0];
                        }}
                    />
                    <div className="absolute right-2 -top-3">
                        無上限
                    </div>
                    <div className="absolute right-1/5 -top-3">
                        4000
                    </div>
                    <div className="absolute right-2/5 -top-3 translate-x-1/2">
                        3000
                    </div>
                    <div className="absolute right-3/5 -top-3 translate-x-1/2">
                        2000
                    </div>
                    <div className="absolute right-4/5 -top-3 translate-x-full">
                        1000
                    </div>
                    <div className="absolute left-5 -top-3">
                        0
                    </div>
                </div>
                <div className="w-full h-[calc(100vh-10rem)] overflow-y-auto flex flex-col items-center justify-center px-3 gap-2">
                    {stores.length === 0 && <div className="text-gray-500 text-lg flex flex-col items-center justify-center">
                        <span>目前沒有任何推薦</span>
                        <span>點一下上面的搜尋一下</span>
                    </div>}
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
                {placeId.length > 0 && <MapEmbed
                    placeId={placeId}
                />}
            </div>
            {/* <Loading /> */}
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
        <div className="w-full h-20 bg-slate-50  shadow-md border-b border-gray-200 flex flex-row items-center px-5 gap-3 cursor-pointer select-none" onClick={() => {
            props.setPlaceId(props.placeId)
        }}>
            <div className="w-24 h-18 rounded-md flex flex-col items-center justify-center bg-slate-200 text-4xl font-bold text-gray-500">
                {WeekInChinese[props.index]}
            </div>
            <div className="flex flex-col w-full h-full justify-center">
                <div className="text-lg font-bold">{props.name.slice(0,30)}{props.name.length > 30 && "..."}</div>
                <div className="text-sm text-gray-500 flex flex-row gap-3">
                    <div className="flex flex-row gap-1 items-center"><FaRegStar />{props.rating}</div>
                    <div>{props.ratingCount}則評論</div>
                    <div>{props.price === -1 ? "無價格資訊" : `${props.price}元`}</div>
                    <div>{props.distance}公尺</div>
                    <div>{Math.ceil(props.travelTime / 60)}分鐘</div>
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