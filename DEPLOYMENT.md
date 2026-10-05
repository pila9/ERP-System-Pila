# ERP System Deployment Guide

This guide shows how to deploy the ERP System to production using Vercel (frontend) + hosted backend (Laravel API).

## Architecture Overview

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────┐
│   Vercel (CDN)      │         │  Backend Host        │         │  Database   │
│  React SPA          │◄────────│  Laravel API         │◄────────│  MySQL      │
│  (frontend/)        │  HTTPS  │  (backend/)          │  TCP    │  Managed    │
└─────────────────────┘         └──────────────────────┘         └─────────────┘
   your-app.vercel.app         api.your-domain.com              aws/railway/etc
```

---

## Part 1: Deploy Frontend to Vercel

### Step 1: Create a Vercel Account
1. Go to https://vercel.com
2. Sign up or log in with GitHub
3. Grant access to your GitHub repositories

### Step 2: Import the Repository
1. Click **"Add New Project"**
2. Select **pila9/ERP-System-Pila**
3. Click **"Import"**

### Step 3: Configure Build Settings
In the "Configure Project" screen:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 4: Add Environment Variables
Before deploying, add these environment variables in Vercel:

```
VITE_API_TARGET=https://your-backend-url.com
```

Replace `your-backend-url.com` with your actual Laravel API URL (you'll set this up in Part 2).

### Step 5: Deploy
Click **"Deploy"** and wait for the build to complete.

Your frontend will be live at: **https://your-app.vercel.app**

---

## Part 2: Deploy Backend to a Hosting Platform

Choose one of these options:

### Option A: Render (Easiest)

1. **Create a Render account**: https://render.com
2. **Connect GitHub**: Click "New +" → "Web Service"
3. **Select repository**: pila9/ERP-System-Pila
4. **Configure**:
   - Name: `erp-api` (or similar)
   - Environment: `Docker`
   - Build Command: (leave empty, uses Dockerfile)
   - Start Command: (leave empty, uses Dockerfile)
   - Instance Type: Starter (free tier)

5. **Add Environment Variables** (in Render dashboard):
   ```
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=base64:YOUR_APP_KEY_HERE
   DB_CONNECTION=mysql
   DB_HOST=your-mysql-host.com
   DB_PORT=3306
   DB_DATABASE=erp
   DB_USERNAME=erp_user
   DB_PASSWORD=your_secure_password
   SANCTUM_STATEFUL_DOMAINS=your-app.vercel.app
   SESSION_DOMAIN=.your-app.vercel.app
   FRONTEND_URL=https://your-app.vercel.app
   ```

6. **Add MySQL Database**:
   - In Render, create a "MySQL" database
   - Copy the connection string to your environment variables

7. **Deploy**: Render will automatically build and deploy

Your backend will be at: **https://erp-api.onrender.com**

---

### Option B: Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add a MySQL plugin from Railway
5. Set environment variables (same as above)
6. Deploy

---

### Option C: DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com
2. Create a new App
3. Select GitHub repository
4. Choose "Dockerfile" as the source
5. Provision a MySQL database
6. Set environment variables
7. Deploy

---

## Part 3: Generate Laravel App Key

Before your backend runs, you need an APP_KEY:

```bash
php artisan key:generate
```

If running in Docker, you can do:
```bash
docker exec backend php artisan key:generate
```

Copy the generated key (format: `base64:xxxxx...`) and add it to your hosting platform's environment variables as `APP_KEY`.

---

## Part 4: Run Database Migrations

After deployment, run migrations on the hosted database:

```bash
# On Render/Railway/etc, use their terminal or SSH
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder
```

Or if using Docker deployment, the migrations may run automatically on first boot (check `backend/.env.example` for `AUTO_MIGRATE=true`).

---

## Part 5: Update Frontend to Use Backend URL

In Vercel, update the environment variable:

```
VITE_API_TARGET=https://erp-api.onrender.com
```

(Replace with your actual backend URL)

Then redeploy the frontend:
- Push a new commit to main, OR
- Go to Vercel dashboard → "Redeploy"

---

## Part 6: Test the Deployment

1. Open **https://your-app.vercel.app**
2. You should see the login page
3. Try logging in with demo credentials:
   - Email: `admin@erp.test`
   - Password: `password`

If login fails, check:
- Vercel logs: `Settings` → `Environment` → Confirm `VITE_API_TARGET` is correct
- Backend logs: Check Render/Railway/etc. for errors
- Database: Confirm migrations ran successfully

---

## Environment Variables Checklist

### Vercel (Frontend)
- [ ] `VITE_API_TARGET` = your backend URL

### Backend Host (Render/Railway/etc.)
- [ ] `APP_ENV` = `production`
- [ ] `APP_KEY` = `base64:xxxxx...`
- [ ] `APP_DEBUG` = `false`
- [ ] `DB_HOST` = database hostname
- [ ] `DB_DATABASE` = `erp`
- [ ] `DB_USERNAME` = database user
- [ ] `DB_PASSWORD` = database password
- [ ] `SANCTUM_STATEFUL_DOMAINS` = your Vercel domain
- [ ] `SESSION_DOMAIN` = `.your-vercel-domain`
- [ ] `FRONTEND_URL` = your Vercel URL

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Blank page after login** | Check Vercel env var `VITE_API_TARGET` is correct and redeploy |
| **"API unreachable" error** | Verify backend is running. Check backend logs on Render/Railway |
| **"Access denied" on database** | Confirm `DB_USERNAME`, `DB_PASSWORD`, `DB_HOST` are correct |
| **Migrations didn't run** | SSH into backend and run: `php artisan migrate --force` |
| **Port already in use** | Vercel/Render manage ports automatically; check their logs |
| **CORS errors** | Ensure `SANCTUM_STATEFUL_DOMAINS` includes your Vercel domain |

---

## Next Steps

After successful deployment:

1. **Change default credentials**: Update the demo user passwords in production
2. **Set up domain**: Add your custom domain in Vercel settings
3. **Enable SSL**: Automatic with Vercel and Render
4. **Backup database**: Set up automated backups on your database host
5. **Monitor logs**: Check Vercel and Render dashboards regularly

---

## Support

- Vercel Docs: https://vercel.com/docs
- Render Docs: https://render.com/docs
- Laravel Deployment: https://laravel.com/docs/deployment
- Sanctum Auth: https://laravel.com/docs/sanctum
