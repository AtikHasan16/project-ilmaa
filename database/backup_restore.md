# Supabase Database Backup & Restore Standard Operating Procedure (SOP)

This guide documents the procedures for capturing, verifying, and restoring backups of the Imlaa production and staging databases.

---

## 1. Automated Supabase Cloud Backups

If using the Supabase Pro tier:
1. Navigate to **Project Settings -> Database -> Backups**.
2. Automated daily physical snapshots and 7-day Point-in-Time Recovery (PITR) are maintained automatically by Supabase.
3. To trigger an on-demand snapshot prior to any major schema migration:
   - Click **Backup Now**.
   - Note the timestamp in the deployment log.

---

## 2. CLI Logical Backups (`pg_dump` & Supabase CLI)

For local, staging, or offsite archival:

### 2.1 Full Logical Backup (Schema + Data)
```bash
# Set your Supabase connection string (obtain from Dashboard -> Database -> Connection String -> URI)
export DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Execute pg_dump with safe flags
pg_dump "$DATABASE_URL" \
  --format=custom \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exclude-schema='graphql,graphql_public,realtime,vault,pgsodium' \
  --file="imlaa_backup_$(date +%Y%m%d_%H%M%S).dump"
```

### 2.2 Schema-Only Snapshot
```bash
pg_dump "$DATABASE_URL" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --exclude-schema='graphql,graphql_public,realtime,vault,pgsodium' \
  --file="schema_snapshot_$(date +%Y%m%d).sql"
```

### 2.3 Data-Only Snapshot (Application Tables)
```bash
pg_dump "$DATABASE_URL" \
  --data-only \
  --table="public.profiles" \
  --table="public.vocabularies" \
  --table="public.grammar_questions" \
  --table="public.spelling_progress" \
  --table="public.flashcard_progress" \
  --table="public.grammar_progress" \
  --table="public.user_activity_logs" \
  --table="public.audit_logs" \
  --file="data_snapshot_$(date +%Y%m%d).sql"
```

---

## 3. Restore & Verification Procedure

> [!CAUTION]
> Always verify restores in a local or **staging project** first before executing against production! Never run a restore blind.

### Step 1: Pre-Restore Dry Run (Staging Environment)
1. Provision a staging database or spin up local Supabase:
   ```bash
   npx supabase start
   ```
2. Test restore using `pg_restore`:
   ```bash
   pg_restore \
     --clean \
     --if-exists \
     --no-owner \
     --no-privileges \
     --dbname="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
     "imlaa_backup_YYYYMMDD_HHMMSS.dump"
   ```

### Step 2: Post-Restore Verification Queries
Verify row counts and integrity invariants immediately after restoration:

```sql
-- 1. Check profile count and role distribution
SELECT role, COUNT(*) FROM public.profiles GROUP BY role;

-- 2. Verify total vocabulary lexemes
SELECT target_tab, COUNT(*) FROM public.vocabularies GROUP BY target_tab;

-- 3. Verify no duplicate (word, topic) violations exist
SELECT word, topic, COUNT(*)
FROM public.vocabularies
GROUP BY word, topic
HAVING COUNT(*) > 1;

-- 4. Verify RLS remains active
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 5. Test RPC functionality
SELECT * FROM public.get_vocabulary_topic_counts();
```

---

## 4. Staging vs Production Promotion Pipeline

1. **Local Development**: Test against local Supabase CLI or dev project.
2. **Staging Project**: Apply migration and forward scripts via Supabase CLI:
   ```bash
   npx supabase db push --db-url "$STAGING_DATABASE_URL"
   ```
3. **Smoke Test**: Run unit tests and load tests against staging.
4. **Production Promotion**:
   - Run manual backup snapshot.
   - Apply versioned migration script from `database/migrations/`.
   - Run post-restore verification queries.
   - If unexpected regression occurs, execute matching `*_rollback.sql` script within the same maintenance window.
