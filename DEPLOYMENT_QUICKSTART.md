# 🚀 Quick Deployment Guide

## Before Production Deployment

### Single File to Update
Edit **`frontend/.env.production`** and change:
```env
REACT_APP_API_URL=https://YOUR-ACTUAL-DOMAIN.com/api
```

That's it! 🎉

## Build & Deploy

```bash
# 1. Build frontend with production settings
cd frontend
npm run build

# 2. Deploy the 'build' folder to your web server

# 3. Deploy backend to your server and update backend/.env with production credentials
```

## How It Works

✅ **Development** (npm start):
- Automatically uses `frontend/.env.development`
- Connects to `http://localhost:5000/api`

✅ **Production** (npm run build):
- Automatically uses `frontend/.env.production`  
- Connects to your production domain

## Files Modified

### Created:
- ✅ `frontend/src/config/config.js` - Central configuration
- ✅ `frontend/.env.development` - Dev settings
- ✅ `frontend/.env.production` - Prod settings (UPDATE THIS!)
- ✅ `frontend/.env.example` - Template

### Updated:
- ✅ `frontend/src/pages/DAO.js` - Now uses `API_BASE_URL`
- ✅ `frontend/src/pages/NodalOfficers.js` - Now uses `API_BASE_URL`
- ✅ `.gitignore` - Protects .env files

### Already Using Config:
- ✅ `frontend/src/services/api.js` - Already configured

## Verify Production Build

```bash
cd frontend/build
# Open index.html or check Network tab in browser
# All API calls should point to your production domain
```

## Need Help?
See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed instructions.
