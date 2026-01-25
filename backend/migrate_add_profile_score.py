"""
Migration script to add profile_score column to users table.
Run this once: python migrate_add_profile_score.py
"""
from sqlalchemy import text
from db import engine, SessionLocal
from models import User

def profile_completeness_score(user) -> int:
    """Calculate profile completeness score"""
    score = 0
    if user.full_name:
        score += 25
    if user.college:
        score += 25
    if user.department:
        score += 25
    if user.graduation_year:
        score += 25
    return score

def migrate():
    with engine.connect() as conn:
        try:
            # Add profile_score column
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS profile_score INTEGER DEFAULT 0;
            """))
            
            conn.commit()
            print("✅ Column added! Now updating existing users...")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            conn.rollback()
            return
    
    # Update all existing users with their calculated scores
    db = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            user.profile_score = profile_completeness_score(user)
        db.commit()
        print(f"✅ Updated {len(users)} user(s) with profile scores!")
        
    except Exception as e:
        print(f"❌ Failed to update user scores: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
