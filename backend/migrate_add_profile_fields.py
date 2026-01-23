"""
Migration script to add profile fields to users table.
Run this once: python migrate_add_profile_fields.py
"""
from sqlalchemy import text
from db import engine

def migrate():
    with engine.connect() as conn:
        # Check if columns exist before adding them
        try:
            # Add full_name column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS full_name VARCHAR;
            """))
            
            # Add college column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS college VARCHAR;
            """))
            
            # Add department column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS department VARCHAR;
            """))
            
            # Add graduation_year column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
            """))
            
            conn.commit()
            print("✅ Migration complete! Profile fields added to users table.")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
