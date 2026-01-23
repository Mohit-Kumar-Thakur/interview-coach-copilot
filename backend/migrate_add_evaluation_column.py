"""
Migration script to add evaluation column to sessions table.
Run this once: python migrate_add_evaluation_column.py
"""
from sqlalchemy import text
from db import engine

def migrate():
    with engine.connect() as conn:
        try:
            # Add evaluation column (JSON type for PostgreSQL)
            conn.execute(text("""
                ALTER TABLE sessions 
                ADD COLUMN IF NOT EXISTS evaluation JSON;
            """))
            
            conn.commit()
            print("✅ Migration complete! Evaluation column added to sessions table.")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
