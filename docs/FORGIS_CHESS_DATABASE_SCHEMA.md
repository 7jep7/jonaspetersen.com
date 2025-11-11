# Forgis Chess - Supabase Database Schema

## Setup Instructions

1. Go to your Supabase project: https://tgwbhshomdyflcnnryho.supabase.co
2. Navigate to the SQL Editor
3. Run the following SQL commands in order

---

## Table 1: Queue Management

```sql
-- Create the queue table with Option C implementation (multiple entries per email)
CREATE TABLE queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  waiting_to_play BOOLEAN DEFAULT TRUE,
  played BOOLEAN DEFAULT FALSE,
  queue_session INTEGER NOT NULL,
  robot_elo INTEGER,
  result TEXT CHECK (result IN ('win', 'draw', 'loss')),
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  position_notified_3 BOOLEAN DEFAULT FALSE,
  position_notified_2 BOOLEAN DEFAULT FALSE,
  position_notified_1 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_queue_email ON queue(email);
CREATE INDEX idx_queue_waiting ON queue(waiting_to_play) WHERE waiting_to_play = TRUE;
CREATE INDEX idx_queue_session ON queue(queue_session);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_queue_updated_at 
  BEFORE UPDATE ON queue 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) - Optional but recommended
ALTER TABLE queue ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous inserts (for registration)
CREATE POLICY "Allow anonymous registration" ON queue
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy to allow anonymous reads (for checking position)
CREATE POLICY "Allow anonymous reads" ON queue
  FOR SELECT
  TO anon
  USING (true);

-- Policy to allow anonymous updates (for unregistering)
CREATE POLICY "Allow anonymous unregister" ON queue
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
```

---

## Table 2: Newsletter Subscribers

```sql
-- Create the newsletter table
CREATE TABLE newsletter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  source TEXT CHECK (source IN ('play_robot', 'about', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX idx_newsletter_email ON newsletter(email);

-- Add Row Level Security
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;

-- Policy to allow anonymous inserts
CREATE POLICY "Allow anonymous newsletter signup" ON newsletter
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy to allow anonymous reads
CREATE POLICY "Allow anonymous newsletter reads" ON newsletter
  FOR SELECT
  TO anon
  USING (true);
```

---

## Database Webhook Setup

To automatically send emails when queue positions change:

1. In Supabase Dashboard, go to **Database → Webhooks**
2. Click **Create a new hook**
3. Configure:
   - **Name**: Queue Position Notifier
   - **Table**: queue
   - **Events**: INSERT, UPDATE, DELETE
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-vercel-domain.vercel.app/api/queue-webhook`
   - **HTTP Headers** (optional for security):
     ```
     Content-Type: application/json
     ```

4. Click **Create webhook**

**Note**: Replace `your-vercel-domain` with your actual Vercel deployment URL once you deploy.

---

## Testing the Database

After creating the tables, you can test with these SQL queries:

### Test Queue Registration
```sql
-- Insert a test player (queue_session should be 1 for first player)
INSERT INTO queue (first_name, last_name, email, queue_session)
VALUES ('John', 'Doe', 'john@example.com', 1);

-- Check the queue
SELECT * FROM queue WHERE waiting_to_play = TRUE ORDER BY queue_session ASC;
```

### Test Newsletter Signup
```sql
-- Insert a test subscriber
INSERT INTO newsletter (first_name, last_name, email, source)
VALUES ('Jane', 'Smith', 'jane@example.com', 'about');

-- Check subscribers
SELECT * FROM newsletter ORDER BY created_at DESC;
```

### Test Queue Position Calculation
```sql
-- Get position for a specific email
WITH active_queue AS (
  SELECT *, ROW_NUMBER() OVER (ORDER BY queue_session ASC) as position
  FROM queue
  WHERE waiting_to_play = TRUE
)
SELECT position, first_name, last_name, email
FROM active_queue
WHERE email = 'john@example.com';
```

---

## Important Notes

1. **Queue Session Numbers**: The `queue_session` field auto-increments. When a new player registers, the app finds the highest `queue_session` and adds 1.

2. **Email Uniqueness**: Emails are NOT unique in the queue table (Option C), allowing players to re-register after playing. They ARE unique in the newsletter table.

3. **Notification Tracking**: The `position_notified_1/2/3` fields prevent sending duplicate emails when a player stays at the same position.

4. **Data Retention**: Players are never deleted, just marked with `waiting_to_play = FALSE`. This preserves historical data for analytics.

---

## Data Export for Analytics

```sql
-- Get all players who played, sorted by best performance
SELECT 
  first_name, 
  last_name, 
  email, 
  robot_elo, 
  result,
  CASE 
    WHEN result = 'win' THEN 3
    WHEN result = 'draw' THEN 1
    ELSE 0
  END as points,
  created_at
FROM queue
WHERE played = TRUE
ORDER BY robot_elo DESC, points DESC;

-- Get queue statistics
SELECT 
  COUNT(*) as total_registered,
  COUNT(*) FILTER (WHERE played = TRUE) as total_played,
  COUNT(*) FILTER (WHERE waiting_to_play = TRUE) as currently_waiting,
  AVG(robot_elo) FILTER (WHERE played = TRUE) as avg_robot_elo
FROM queue;
```

---

## Security Recommendations

1. **Enable RLS**: All policies above allow anonymous access for the public-facing app
2. **API Keys**: Keep your Supabase anon key safe in `.env` file
3. **Webhook Authentication**: Consider adding a secret header to webhook requests
4. **Rate Limiting**: Monitor for abuse and implement rate limiting if needed

---

Your database is now ready! 🎉
