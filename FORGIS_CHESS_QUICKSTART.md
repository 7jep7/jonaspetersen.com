# Forgis Chess - Quick Start

## ⚡ Immediate Next Steps

### 1. Get Your Supabase Anon Key (2 minutes)
1. Go to https://tgwbhshomdyflcnnryho.supabase.co
2. Settings → API
3. Copy the `anon` `public` key
4. Update `.env` file:
   ```
   SUPABASE_ANON_KEY=your_actual_key_here
   ```

### 2. Create Database Tables (5 minutes)
1. In Supabase, go to SQL Editor
2. Open `docs/FORGIS_CHESS_DATABASE_SCHEMA.md`
3. Copy and run the SQL for:
   - Queue table
   - Newsletter table
   - Indexes and policies

### 3. Test Locally (2 minutes)
```bash
npm run dev
```

Visit http://localhost:5173/projects/forgis-chess

Test:
- Registration flow
- Chess clock
- About page
- Admin panel (password: `shiftwork`)

### 4. Deploy (10 minutes)
Follow `docs/FORGIS_CHESS_DEPLOYMENT.md` for complete guide.

Quick version:
1. Push to GitHub
2. Deploy on Vercel
3. Add environment variables
4. Configure Supabase webhook

---

## 🎯 What Was Built

✅ **5 Routes Created:**
- Landing page with 3 options
- Queue registration & status
- Chess clock (5+0 default, customizable)
- About Forgis with newsletter
- Admin panel

✅ **Email Automation:**
- Position 3, 2, 1 notifications
- Webhook-triggered
- Beautiful HTML templates

✅ **Features:**
- Queue management
- LinkedIn CTAs
- Newsletter signup
- Match result tracking
- Mobile-optimized

---

## 📖 Documentation

- **Full Summary**: `docs/FORGIS_CHESS_SUMMARY.md`
- **Database Schema**: `docs/FORGIS_CHESS_DATABASE_SCHEMA.md`
- **Deployment Guide**: `docs/FORGIS_CHESS_DEPLOYMENT.md`

---

## 🎨 Color Palette (Already Configured)

Using Forgis brand colors throughout:
- Fire: #FF4D00
- Tiger: #FF762B  
- Gunmetal: #122128 (dark background)

---

## 🔧 Environment Variables

Current `.env` file:
```
SUPABASE_URL=https://tgwbhshomdyflcnnryho.supabase.co
SUPABASE_ANON_KEY=<NEED THIS FROM SUPABASE>
RESEND_API_KEY=re_SqAsHGuA_5a6dCTaKBdbxKZDmvWHrguUW
ADMIN_PASSWORD=shiftwork
BASE_URL=http://localhost:5173
```

**Action Required**: Get SUPABASE_ANON_KEY

---

## 🚨 Important Notes

1. **Email Domain**: For production, verify `forgis.com` in Resend dashboard
2. **Admin Password**: Change `shiftwork` to something secure before event
3. **Webhook**: Must configure after Vercel deployment
4. **Testing**: Test full flow before event day

---

**Ready to test locally! Just need the Supabase anon key.** 🚀
