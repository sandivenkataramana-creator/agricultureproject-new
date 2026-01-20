# Environment Configuration Guide

## Overview
This project uses environment variables to manage different configurations for development and production environments. This eliminates the need to manually change URLs before deployment.

## How It Works

### Frontend Configuration

The frontend uses React environment variables that are automatically loaded based on the build mode:

- **Development**: Uses `.env.development`
- **Production**: Uses `.env.production`

All API calls reference `API_BASE_URL` from [frontend/src/config/config.js](frontend/src/config/config.js), which reads from `process.env.REACT_APP_API_URL`.

### Backend Configuration

The backend uses `.env` file loaded by `dotenv` package. The [backend/config/database.js](backend/config/database.js) reads these variables.

## Setup Instructions

### 1. Frontend Setup

Create `.env.development` in the `frontend/` directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Create `.env.production` in the `frontend/` directory:
```env
REACT_APP_API_URL=https://your-production-domain.com/api
```

### 2. Backend Setup

Update `backend/.env` with your database credentials:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hod_management2
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:3000
```

For production, update these values to your production settings.

## Development Workflow

### Run Development Server

```bash
# Frontend (automatically uses .env.development)
cd frontend
npm start

# Backend (uses .env)
cd backend
npm start
```

The frontend will use `http://localhost:5000/api` automatically.

## Production Deployment

### Step 1: Update Production Environment File

Edit `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-actual-domain.com/api
```

### Step 2: Build Frontend

```bash
cd frontend
npm run build
```

The build process automatically uses `.env.production`, so all API calls will point to your production domain.

### Step 3: Update Backend Environment

On your production server, update `backend/.env`:
```env
NODE_ENV=production
PORT=5000
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASSWORD=your-production-db-password
DB_NAME=your-production-db-name
FRONTEND_URL=https://your-actual-domain.com
```

### Step 4: Deploy

Deploy the `frontend/build` folder and backend files to your server.

## Important Files

### Frontend
- `frontend/.env.development` - Development settings
- `frontend/.env.production` - Production settings (UPDATE THIS BEFORE BUILD)
- `frontend/.env.example` - Template file
- `frontend/src/config/config.js` - Central configuration file

### Backend
- `backend/.env` - Environment variables
- `backend/.env.example` - Template file
- `backend/config/database.js` - Database configuration

## Security Notes

1. ✅ `.env` files are in `.gitignore` (except `.env.example`)
2. ✅ Never commit actual `.env` files to git
3. ✅ Use `.env.example` as a template for team members
4. ✅ Keep production credentials secure

## Testing

### Test Development Build
```bash
cd frontend
npm start
# Should connect to http://localhost:5000/api
```

### Test Production Build Locally
```bash
cd frontend
npm run build
npx serve -s build
# Check browser network tab - should show production domain URLs
```

## Troubleshooting

### Issue: Frontend still showing localhost in production
**Solution**: 
1. Check `frontend/.env.production` has correct URL
2. Delete `frontend/build` folder
3. Run `npm run build` again
4. Verify by checking the built files or browser network tab

### Issue: CORS errors in production
**Solution**: Update backend CORS settings to allow your production domain

### Issue: 404 errors on API calls
**Solution**: 
1. Verify production domain is correct in `.env.production`
2. Ensure backend is running and accessible
3. Check backend `.env` for correct settings

## Migration Checklist

- [x] Created centralized config files
- [x] Updated all hardcoded URLs to use `API_BASE_URL`
- [x] Created `.env.development` and `.env.production`
- [x] Updated `.gitignore` to exclude environment files
- [ ] Update `.env.production` with your actual domain
- [ ] Test production build locally
- [ ] Deploy to production server
- [ ] Verify all API calls work in production

## Summary

**You only need to change the domain in ONE place**: `frontend/.env.production`

All other files automatically use the correct URL based on the environment!
