import sqlite3

def initialize_db():
    conn = sqlite3.connect("routesOptimizeApp.db")
    cursor = conn.cursor()

    #Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
    """)

    #Addresses table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL
    )
    """)

    #Routes table. Save user's routes record if user logged in
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS routes (
        route_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        start_id INTEGER,
        end_id INTEGER,
        address_ids TEXT,
        distance_route TEXT,
        time_route TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(start_id) REFERENCES addresses(id),
        FOREIGN KEY(end_id) REFERENCES addresses(id)
    )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == "__main__":
    initialize_db()
