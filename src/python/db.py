def connect():
    import sqlite3
    from sqlite3 import Error

    try:
        conn = sqlite3.connect('database.db')
        return conn
    except Error as e:
        print(e)
        return None


def create_table(conn):
    try:
        sql_create_places_table = """ CREATE TABLE IF NOT EXISTS places (
                                        id integer PRIMARY KEY,
                                        name text NOT NULL,
                                        address text,
                                        rating real,
                                        price_range text,
                                        regular_opening_hours text
                                    ); """
        conn.execute(sql_create_places_table)
    except Error as e:
        print(e)
        return None
    return conn

