#!/usr/bin/env python3
"""
Supabase Connection Verification Script
Run this script to verify your Supabase database connection before deployment
"""
import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def verify_connection():
    """Verify Supabase database connection"""
    print("🔍 Verifying Supabase Connection...\n")
    
    # Get DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set")
        print("   Please set it in your .env file")
        return False
    
    # Check if it's a Supabase URL
    if "supabase" not in database_url:
        print("⚠️  WARNING: DATABASE_URL doesn't appear to be a Supabase URL")
        print(f"   Current URL: {database_url[:50]}...")
    
    # Handle postgres:// vs postgresql://
    if database_url.startswith("postgres://"):
        print("ℹ️  Converting postgres:// to postgresql:// for SQLAlchemy compatibility")
        database_url = database_url.replace("postgres://", "postgresql://", 1)
    
    try:
        # Create engine
        print("📡 Connecting to database...")
        engine = create_engine(
            database_url,
            pool_size=2,
            max_overflow=0,
            pool_pre_ping=True,
            echo=False
        )
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ Connection successful!")
            print(f"   PostgreSQL Version: {version.split(',')[0]}\n")
            
            # Check if tables exist
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"📊 Existing tables found: {', '.join(tables)}")
            else:
                print("📊 No tables found (will be created on first run)")
            
            # Test write permission
            print("\n🔐 Testing write permissions...")
            try:
                conn.execute(text("CREATE TABLE IF NOT EXISTS _test_table (id INTEGER)"))
                conn.execute(text("DROP TABLE IF EXISTS _test_table"))
                conn.commit()
                print("✅ Write permissions verified")
            except Exception as e:
                print(f"❌ Write permission test failed: {e}")
                return False
        
        print("\n✅ All checks passed! Your Supabase connection is ready for deployment.")
        return True
        
    except Exception as e:
        print(f"\n❌ Connection failed: {e}")
        print("\n🔧 Troubleshooting tips:")
        print("   1. Verify your DATABASE_URL is correct")
        print("   2. Check if your Supabase project is active")
        print("   3. Ensure your IP is allowed (or use connection pooling)")
        print("   4. Verify your database password is correct")
        return False

if __name__ == "__main__":
    success = verify_connection()
    sys.exit(0 if success else 1)

# Made with Bob
