"use client"

import { useEffect, useState } from "react";

export default function Home() {
    const [stores,setStores] = useState<any[]>([]);

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

    useEffect(()=>{
        fetchStores()
    },[])

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

                <div className="bg-red-100 w-full h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-3 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                        <PlacesCard key={index} />
                    ))}
                </div>
            </div>
            <div>

            </div>
        </div>
    );
}

function PlacesCard() {
    return (
        <div className="w-full h-28 bg-white shadow-md border-b border-gray-200 flex flex-row items-center px-5 gap-3">
            <div className="w-24 h-24 bg-red-100 rounded-md"></div>
            <div className="flex flex-col w-full h-full justify-center">
                <div className="text-lg font-bold">Place Name</div>
                <div className="text-sm text-gray-500">Place Address</div>
            </div>
        </div>
    )
}