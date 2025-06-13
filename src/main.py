from dotenv import load_dotenv
import os
import sqlite3
from datetime import datetime, timedelta

# from gene import main as gene_main
from gene import Gene
import sys
load_dotenv()

# read database connection string from environment variable\

def get_db_connection():
    url = os.getenv("DATABASE")
    # print("database url: ", url)
    if not url:
        raise ValueError("DATABASE environment variable is not set.")
    conn = sqlite3.connect(url)
    conn.row_factory = sqlite3.Row

    return conn


def get_places(conn):
    cursor = conn.cursor()

#     cursor.execute("""SELECT
#   Store.id AS store_id,
#   Store.name,
#   Store.rating,
#   Store.ratingCount,
#   Store.price,
#   Store.latitude,
#   Store.longitude,
#   Store.distance,
#   Store.travelTime,
#   Store.placeId,
#   Store.lastSelectedAt,

#   OpeningHour.id AS opening_hour_id,
#   OpeningHour.dayOfWeek,
#   OpeningHour.openHour,
#   OpeningHour.openMinute,
#   OpeningHour.closeHour,
#   OpeningHour.closeMinute

# FROM Store
# LEFT JOIN OpeningHour ON OpeningHour.storeId = Store.id
# ORDER BY Store.id, OpeningHour.dayOfWeek;""")
    cursor.execute("""SELECT
  Store.id AS store_id,
  Store.name,
  Store.rating,
  Store.ratingCount,
  Store.price,
  Store.latitude,
  Store.longitude,
  Store.distance,
  Store.travelTime,
  Store.placeId,
  Store.lastSelectedAt,
  
  OpeningHour.id AS opening_hour_id,
  OpeningHour.dayOfWeek,
  OpeningHour.openHour,
  OpeningHour.openMinute,
  OpeningHour.closeHour,
  OpeningHour.closeMinute

FROM Store
LEFT JOIN OpeningHour ON OpeningHour.storeId = Store.id
ORDER BY Store.id, OpeningHour.dayOfWeek;""")

    rows = cursor.fetchall()

    stores = {}

    for row in rows:
        sid = row["store_id"]
        if sid not in stores:
            # 初始化 Store 資料
            stores[sid] = {
                "id": sid,
                "name": row["name"],
                "rating": row["rating"],
                "ratingCount": row["ratingCount"],
                "price": row["price"],
                "latitude": row["latitude"],
                "longitude": row["longitude"],
                "distance": row["distance"],
                "travelTime": row["travelTime"],
                "placeId": row["placeId"],
                "lastSelectedAt": row["lastSelectedAt"],
                "openingHours": []
            }

    # 加入 OpeningHour（若有）
        if row["opening_hour_id"]:
            stores[sid]["openingHours"].append({
                "id": row["opening_hour_id"],
                "dayOfWeek": row["dayOfWeek"],
                "openHour": row["openHour"],
                "openMinute": row["openMinute"],
                "closeHour": row["closeHour"],
                "closeMinute": row["closeMinute"],
            })

    store_list = list(stores.values())

    # print(store_list[0])

    return store_list


if __name__ == "__main__":
    # where program starts
    print("Start")

    # fetch places
    # check if places stored in database

    db = get_db_connection()
    stores = get_places(db)
    db.close()

    # gene algorithm

    # pre set the stores
    # 留下這個時間點有開的店
    picked_stores = []

    eating_time = os.getenv("EATING_TIME")

    if eating_time is None:
        print("EATING_TIME environment variable is not set.")
        sys.exit(1)

    hour = int(eating_time[0:2])
    minute = int(eating_time[2:4])

    print("hour: ", hour)
    print("minute: ", minute)

    for store in stores:
        to_pick = False
        for oh in store["openingHours"]:
            if (oh["openHour"] < hour or (oh["openHour"] == hour and oh["openMinute"] <= minute)) and \
                    (oh["closeHour"] > hour or (oh["closeHour"] == hour and oh["closeMinute"] >= minute)):
                to_pick = True
                break
        if to_pick:
            picked_stores.append(store)

    print("running genetic algorithm from {} stores".format(len(picked_stores)))

    # weekly_budget = float(input("Enter your weekly budget : "))
    # weekly_movetime = float(input("Enter your weekly movetime (mins): "))
    
    print("weekly budget from argv: ", sys.argv)

    temp_budget = os.getenv("WEEKLY_BUDGET") 
    temp_movetime = os.getenv("WEEKLY_MOVETIME")

    weekly_budget = 0
    weekly_movetime = 0

    if temp_budget is None or temp_movetime is None:
        print("WEEKLY_BUDGET or WEEKLY_MOVETIME not set in environment variables.")
        sys.exit(1)
    else:
        weekly_budget = float(sys.argv[1]) if len(sys.argv) > 1 else float(temp_budget)
        weekly_movetime = float(sys.argv[2]) if len(sys.argv) > 2 else float(temp_movetime)
        

    print("weekly budget: ", weekly_budget)
    print("weekly movetime: ", weekly_movetime)

    ga = Gene(picked_stores, weekly_budget, weekly_movetime)
    selected_store, happiness = ga.main()

    selected_stores = [picked_stores[i]
                       for i in range(len(selected_store)) if selected_store[i] == 1]

    print("Selected stores:")
    for store in selected_stores:
        print(store["name"])
    print("Happiness score:", happiness)

    # write last selected store to database

    # add 8 hours to the last selected time
    now = datetime.now() + timedelta(hours=8)

    s = [store for store in selected_stores]
    s_ids = [f"\"{store['id']}\"" for store in s]

    db = get_db_connection()
    cursor = db.cursor()

    sql = f"UPDATE Store SET lastSelectedAt = {int(now.timestamp()*1000)} WHERE id IN ({", ".join(s_ids)})"

    print("sql: ", sql)

    cursor.execute(sql)

    db.commit()
    db.close()

    # display results
