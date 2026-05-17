# 🗄️ Supabase Setup Guide for AIRA

This guide walks you through setting up Supabase as your PostgreSQL database for AIRA deployment on Render.

## 📋 Why Supabase?

- ✅ **Free Tier**: 500MB database, 2GB bandwidth
- ✅ **Managed Service**: Automatic backups, scaling, and maintenance
- ✅ **Connection Pooling**: Built-in pooling for serverless environments
- ✅ **Global CDN**: Fast access from anywhere
- ✅ **Easy Setup**: 2-minute project creation

## 🚀 Step-by-Step Setup

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### Step 2: Create New Project

1. Click "New Project" in your dashboard
2. Fill in project details:
   - **Name**: `aira-production` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
     - `us-east-1` (US East)
     - `eu-west-1` (Europe)
     - `ap-southeast-1` (Asia Pacific)
   - **Pricing Plan**: Free (or Pro if needed)
3. Click "Create new project"
4. Wait ~2 minutes for project to be ready

### Step 3: Get Connection String

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Database** in the left menu
3. Scroll to **Connection string** section
4. Select **Connection pooling** tab (recommended for Render)
5. Copy the URI format connection string:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your actual database password

### Step 4: Configure for AIRA

#### Option A: Using with Render Blueprint

1. When deploying to Render, you'll be prompted for environment variables
2. Set `DATABASE_URL` to your Supabase connection string
3. Render will automatically use it for all services

#### Option B: Manual Configuration

1. In Render Dashboard, go to your backend service
2. Navigate to **Environment** tab
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Supabase connection string
4. Click "Save Changes"
5. Service will automatically redeploy

### Step 5: Verify Connection (Optional)

Before deploying, you can verify your connection locally:

```bash
# Set DATABASE_URL in your .env file
echo "DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:5432/postgres" >> .env

# Run verification script
python verify_supabase_connection.py
```

Expected output:
```
🔍 Verifying Supabase Connection...
📡 Connecting to database...
✅ Connection successful!
   PostgreSQL Version: PostgreSQL 15.x
📊 No tables found (will be created on first run)
🔐 Testing write permissions...
✅ Write permissions verified
✅ All checks passed!
```

## 🔐 Security Best Practices

### 1. Use Connection Pooling

Always use the **Connection pooling** URI (port 5432), not the direct connection:
- ✅ Good: `aws-0-region.pooler.supabase.com:5432`
- ❌ Avoid: `aws-0-region.pooler.supabase.com:6543` (direct)

### 2. Rotate Database Password

Regularly rotate your database password:
1. Go to Project Settings → Database
2. Click "Reset database password"
3. Update `DATABASE_URL` in Render

### 3. Enable Row Level Security (Optional)

For additional security:
1. Go to **Authentication** → **Policies**
2. Enable RLS on tables
3. Create policies for your use case

### 4. Monitor Usage

Keep track of your database usage:
1. Go to **Project Settings** → **Usage**
2. Monitor:
   - Database size
   - Bandwidth
   - API requests

## 📊 Database Management

### View Tables

1. Go to **Table Editor** in Supabase dashboard
2. View all tables created by AIRA:
   - `incidents`
   - `users`
   - `api_keys`

### Run SQL Queries

1. Go to **SQL Editor**
2. Run custom queries:
   ```sql
   -- View all incidents
   SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10;
   
   -- Count incidents by severity
   SELECT severity, COUNT(*) FROM incidents GROUP BY severity;
   
   -- View active users
   SELECT username, email, created_at FROM users WHERE is_active = true;
   ```

### Backup Database

Supabase automatically backs up your database daily. To create manual backup:

1. Go to **Project Settings** → **Database**
2. Scroll to **Backups** section
3. Click "Create backup"

### Restore from Backup

1. Go to **Project Settings** → **Database** → **Backups**
2. Find the backup you want to restore
3. Click "Restore"

## 🔄 Migration from SQLite

If you're migrating from local SQLite to Supabase:

### Option 1: Fresh Start (Recommended)

1. Deploy with Supabase DATABASE_URL
2. AIRA will automatically create tables
3. Start fresh with new data

### Option 2: Migrate Existing Data

```bash
# Export SQLite data
sqlite3 aira.db .dump > aira_dump.sql

# Convert to PostgreSQL format (manual editing needed)
# Then import to Supabase using SQL Editor
```

## 💰 Pricing

### Free Tier
- **Database**: 500MB
- **Bandwidth**: 2GB
- **API Requests**: 50,000/month
- **Storage**: 1GB
- **Perfect for**: Development, small projects

### Pro Tier ($25/month)
- **Database**: 8GB (+ $0.125/GB)
- **Bandwidth**: 50GB (+ $0.09/GB)
- **API Requests**: 500,000/month
- **Storage**: 100GB
- **Perfect for**: Production, growing projects

### Upgrade When Needed

Monitor your usage and upgrade when you approach limits:
1. Go to **Project Settings** → **Billing**
2. Click "Upgrade to Pro"

## 🆘 Troubleshooting

### Connection Timeout

**Problem**: Connection times out
**Solution**:
- Use connection pooling URI (port 5432)
- Check if your Render region is supported
- Verify database password is correct

### Too Many Connections

**Problem**: "too many connections" error
**Solution**:
- Use connection pooling (already configured in AIRA)
- Reduce `pool_size` in `backend/models.py` if needed
- Upgrade to Pro tier for more connections

### Slow Queries

**Problem**: Database queries are slow
**Solution**:
1. Add indexes to frequently queried columns
2. Use SQL Editor to analyze query performance
3. Consider upgrading to Pro tier

### Cannot Create Tables

**Problem**: Permission denied when creating tables
**Solution**:
- Verify you're using the correct connection string
- Check if RLS is blocking table creation
- Ensure you're using the `postgres` database

## 📞 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **AIRA Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/aira/issues)

## ✅ Checklist

Before deploying to Render with Supabase:

- [ ] Supabase project created
- [ ] Database password saved securely
- [ ] Connection pooling URI copied
- [ ] DATABASE_URL set in Render environment variables
- [ ] Connection verified (optional)
- [ ] Backup strategy planned
- [ ] Usage monitoring enabled

---

**Ready to deploy!** Your Supabase database is now configured for AIRA on Render. 🚀