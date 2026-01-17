from db import engine

try:
    conn = engine.connect()
    print("DB connected successfully")
    conn.close()
except Exception as e:
    print("DB connection failed:", e)
