# Forgis Chess - Deployment Guide

Complete step-by-step guide to deploy the Forgis Chess project.

---

## 📋 Prerequisites Checklist

- [x] Supabase project created
- [ ] Supabase Anon Key obtained
- [ ] Resend account created
- [ ] Resend API Key obtained  
- [ ] Vercel account (for deployment)

---

## 🗄️ Step 1: Database Setup

### 1.1 Get Supabase Anon Key

1. Go to https://tgwbhshomdyflcnnryho.supabase.co
2. Navigate to **Settings → API**
3. Copy the **anon / public** key
4. Update your `.env` file:
   ```bash
   SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

### 1.2 Create Database Tables

1. In Supabase, go to **SQL Editor**
2. Open the file `docs/FORGIS_CHESS_DATABASE_SCHEMA.md`
3. Copy and run each SQL block in order:
   - Queue table creation
   - Newsletter table creation
   - Indexes and triggers
   - Row Level Security policies

### 1.3 Verify Tables

Run this query to verify:
```sql
SELECT * FROM queue LIMIT 1;
SELECT * FROM newsletter LIMIT 1;
```

---

## 📧 Step 2: Email Service Setup

### 2.1 Configure Resend

Your Resend API key is already in `.env`:
```bash
RESEND_API_KEY=re_SqAsHGuA_5a6dCTaKBdbxKZDmvWHrguUW
```

### 2.2 Verify Sender Domain (Important!)

⚠️ **Critical**: Resend requires domain verification for production

**Option A: Use Resend's Test Domain (Quick Start)**
- Emails will be sent from `onboarding@resend.dev`
- Good for testing, but may go to spam
- No configuration needed

**Option B: Verify Your Own Domain (Recommended for Production)**
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Add `forgis.com` or a subdomain like `mail.forgis.com`
4. Follow DNS verification steps
5. Update email templates in `app/lib/email.server.ts`:
   ```typescript
   from: 'Forgis Chess Robot <noreply@forgis.com>',
   ```

---

## 🚀 Step 3: Local Testing

### 3.1 Install Dependencies

Already installed, but verify:
```bash
npm install
```

### 3.2 Start Development Server

```bash
npm run dev
```

### 3.3 Test Routes

Open your browser and test:
- Landing Page: http://localhost:5173/projects/forgis-chess
- Play Robot: http://localhost:5173/projects/forgis-chess/play-robot
- Chess Clock: http://localhost:5173/projects/forgis-chess/play-human
- About: http://localhost:5173/projects/forgis-chess/about
- Admin: http://localhost:5173/projects/forgis-chess/admin
  - Password: `shiftwork`

### 3.4 Test Queue Registration

1. Go to Play Robot page
2. Fill in registration form
3. Check Supabase database:
   ```sql
   SELECT * FROM queue ORDER BY created_at DESC LIMIT 5;
   ```

---

## 🌐 Step 4: Deploy to Vercel

### 4.1 Prepare for Deployment

Make sure `.env` is in `.gitignore`:
```bash
echo ".env" >> .gitignore
```

Commit your code:
```bash
git add .
git commit -m "Add Forgis Chess project"
git push
```

### 4.2 Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your Git repository
4. In **Environment Variables**, add:
   ```
   SUPABASE_URL=https://tgwbhshomdyflcnnryho.supabase.co
   SUPABASE_ANON_KEY=<your_supabase_anon_key>
   RESEND_API_KEY=re_SqAsHGuA_5a6dCTaKBdbxKZDmvWHrguUW
   ADMIN_PASSWORD=shiftwork
   ```
5. Click **Deploy**

### 4.3 Get Your Deployment URL

After deployment completes, you'll get a URL like:
```
https://jonaspetersen-abc123.vercel.app
```

Save this URL!

---

## 🔔 Step 5: Setup Supabase Webhook

### 5.1 Configure Webhook in Supabase

1. In Supabase, go to **Database → Webhooks**
2. Click **Create a new hook**
3. Configure:
   - **Name**: Queue Position Notifier
   - **Table**: `queue`
   - **Events**: ☑️ INSERT, ☑️ UPDATE, ☑️ DELETE
   - **Type**: HTTP Request
   - **Method**: POST
   - **URL**: `https://your-vercel-url.vercel.app/api/queue-webhook`
     - Replace with your actual Vercel URL!
4. Click **Create webhook**

### 5.2 Test Webhook

Test the webhook manually:
1. In Supabase SQL Editor, run:
   ```sql
   INSERT INTO queue (first_name, last_name, email, queue_session)
   VALUES ('Test', 'User', 'test@example.com', 1);
   ```
2. Check your email (if using verified domain)
3. Or check Vercel logs for webhook execution

---

## 🎯 Step 6: Testing the Full Flow

### 6.1 Queue Registration Flow

1. Go to `https://your-vercel-url.vercel.app/projects/forgis-chess`
2. Click "Play the Robot"
3. Register with:
   - First Name: Your Name
   - Last Name: Test
   - Email: Your actual email
   - ☑️ Stay in the loop checkbox
4. Verify:
   - Redirected to queue position page
   - See position #1
   - Check email inbox for "IT'S YOUR TURN" email

### 6.2 Admin Panel Flow

1. Go to `https://your-vercel-url.vercel.app/projects/forgis-chess/admin`
2. Login with password: `shiftwork`
3. See active queue
4. Test "Tick Off" button
5. Test "Record Result" form

### 6.3 Chess Clock Flow

1. Go to chess clock page
2. Start a game
3. Finish the game (let one side run out of time)
4. LinkedIn button should appear automatically

---

## 🎨 Step 7: QR Code Generation

### 7.1 Create QR Code

Use a QR code generator (e.g., https://qr-code-generator.com):
- URL: `https://your-vercel-url.vercel.app/projects/forgis-chess`
- Download as high-resolution PNG
- Print and display at your booth

### 7.2 Recommended QR Code Settings

- Size: At least 300x300 pixels
- Format: PNG with transparent background
- Error Correction: High (30%)

---

## 📊 Step 8: Monitor & Analytics

### 8.1 Vercel Analytics

View deployment logs:
1. Go to Vercel Dashboard
2. Select your project
3. Go to "Logs" tab
4. Monitor API calls and errors

### 8.2 Supabase Analytics

View database activity:
```sql
-- Current queue status
SELECT COUNT(*) as total_waiting
FROM queue
WHERE waiting_to_play = TRUE;

-- Total registrations today
SELECT COUNT(*) as registrations_today
FROM queue
WHERE DATE(created_at) = CURRENT_DATE;

-- Newsletter signups
SELECT COUNT(*) as newsletter_count
FROM newsletter;

-- Top performers (after event)
SELECT 
  first_name || ' ' || last_name as name,
  robot_elo,
  result,
  CASE 
    WHEN result = 'win' THEN 3
    WHEN result = 'draw' THEN 1
    ELSE 0
  END as points
FROM queue
WHERE played = TRUE
ORDER BY robot_elo DESC, points DESC
LIMIT 3;
```

---

## 🛠️ Troubleshooting

### Issue: Emails not sending

**Check:**
1. Resend API key is correct in Vercel environment variables
2. Domain is verified in Resend (for production)
3. Check Resend dashboard for failed sends
4. Verify webhook is triggered (check Vercel logs)

**Solution:**
```bash
# Test email endpoint directly
curl -X POST https://your-vercel-url.vercel.app/api/queue-webhook
```

### Issue: Webhook not triggering

**Check:**
1. Webhook URL is correct in Supabase
2. Events (INSERT, UPDATE, DELETE) are all checked
3. Check Supabase webhook logs

**Solution:**
- Re-create the webhook with correct settings
- Test with manual database insert

### Issue: Admin panel not accessible

**Check:**
1. Password is correct: `shiftwork`
2. `ADMIN_PASSWORD` environment variable is set in Vercel

### Issue: Queue position not updating

**Check:**
1. `queue_session` is incrementing properly
2. Run this query:
   ```sql
   SELECT id, email, queue_session, waiting_to_play 
   FROM queue 
   ORDER BY queue_session ASC;
   ```

---

## 🔒 Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Supabase anon key is secure (read-only)
- [ ] Admin password is strong (change from default!)
- [ ] Row Level Security is enabled on both tables
- [ ] Webhook endpoint is HTTPS only
- [ ] Rate limiting considered for registration endpoint

---

## 📱 Mobile Optimization

The app is fully responsive and optimized for mobile:
- Touch-friendly buttons
- Large tap targets
- Responsive layouts
- Dark mode optimized (Forgis gunmetal background)

Test on various devices:
- iPhone (Safari)
- Android (Chrome)
- iPad
- Desktop browsers

---

## 🎉 Launch Day Checklist

**Before the event:**
- [ ] Deploy to production
- [ ] Test all flows end-to-end
- [ ] Print QR codes
- [ ] Test QR codes with phone
- [ ] Verify emails are working
- [ ] Set up admin panel access
- [ ] Brief team on admin panel usage

**During the event:**
- [ ] Monitor Vercel logs
- [ ] Check queue status regularly
- [ ] Update robot ELO and results after each game
- [ ] Respond to any issues quickly

**After the event:**
- [ ] Export all data from Supabase
- [ ] Announce winners on LinkedIn
- [ ] Send follow-up to newsletter subscribers
- [ ] Analyze participation metrics

---

## 📞 Support

If you encounter any issues during deployment:

1. Check Vercel deployment logs
2. Check Supabase database logs
3. Check Resend email logs
4. Review this guide step-by-step

---

**You're all set! Good luck with your event! 🚀**
