import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":

    # 連接到 SQLite 資料庫
    db = os.getenv("DATABASE")

    if not db:
        raise ValueError("DATABASE environment variable is not set.")

    conn = sqlite3.connect(db)
    cursor = conn.cursor()

    # 更新 lastSelectedAt 欄位為 NULL
    cursor.execute("UPDATE Store SET lastSelectedAt = NULL")

    # 提交變更並關閉連接
    conn.commit()
    conn.close()