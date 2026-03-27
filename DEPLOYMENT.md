# Deployment Guide — TALBI'FLUID

After the security audit fixes, follow these steps to deploy to Vercel with proper configuration.

## Pre-Deployment Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

This installs the new security packages:
- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT token generation
- `dotenv` — Environment variable loading

### 2. Create `.env` Configuration File

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

### 3. Generate Secure Credentials

#### A. Generate bcrypt Password Hash

Choose your admin password, then run:

```bash
node -e "require('bcrypt').hash('YourSecurePassword123!', 10, (err, hash) => console.log(hash))"
```

Copy the output hash and paste into `.env`:

```
ADMIN_PASS_HASH=$2b$10$[rest of hash]
```

Example (DO NOT USE):
```
ADMIN_PASS_HASH=$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86./VXcvxem
```

#### B. Generate JWT Secret

Generate a 64-character random secret:

```bash
openssl rand -hex 32
```

Copy the output and paste into `.env`:

```
JWT_SECRET=a1b2c3d4e5f6... (64 hex characters)
```

Or for development (change for production):

```
JWT_SECRET=your-very-secure-secret-key-change-in-production
```

### 4. Configure Email (SMTP)

Add your email provider credentials to `.env`:

#### For Gmail (Recommended)

1. Enable 2-Step Verification on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an "App Password" (not your regular password)
4. Copy the 16-character password

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx (the 16-char app password)
ADMIN_EMAIL=admin@talbifluid.fr
```

#### For Other Providers

| Provider | SMTP Host | Port | TLS |
|----------|-----------|------|-----|
| SendinBlue | smtp-relay.sendinblue.com | 587 | Yes |
| Mailgun | smtp.mailgun.org | 587 | Yes |
| Amazon SES | email-smtp.us-east-1.amazonaws.com | 587 | Yes |
| Outlook | smtp-mail.outlook.com | 587 | Yes |

### 5. Verify `.env` Contents

Your `.env` file should look like:

```
# Admin credentials
ADMIN_USER=admin
ADMIN_PASS_HASH=$2b$10$...

# JWT
JWT_SECRET=a1b2c3d4e5...

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
ADMIN_EMAIL=admin@talbifluid.fr

# Optional
PORT=3000
NODE_ENV=production
```

## Local Testing

### 1. Start Backend Server

```bash
cd backend
npm start
```

Output should show:
```
🚀 TALBI'FLUID Backend démarré !
   Site  : http://localhost:3000
   Admin : http://localhost:3000/admin
   API   : http://localhost:3000/api
```

### 2. Test Login

Visit: http://localhost:3000/admin

Login with:
- Username: `admin`
- Password: `YourSecurePassword123!` (whatever you set in bcrypt step)

You should see:
- Dashboard loads with "Tableau de bord"
- Statistics are fetched from `/api/admin/stats`
- No console errors

### 3. Test API Endpoints

#### Contact Form
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "+33612345678",
    "email": "test@example.com",
    "service": "Plomberie",
    "message": "Test contact"
  }'
```

Expected response: `{"success": true}`

#### Get Services
```bash
curl http://localhost:3000/api/services
```

Expected: Array of 3 services (Plomberie, Chauffage, Climatisation)

#### Get Reviews (Public)
```bash
curl http://localhost:3000/api/reviews
```

Expected: Array of 6 approved reviews

#### Get Admin Stats (Requires JWT)

First, login and get the token from browser console:
```javascript
// In browser console after login
sessionStorage.getItem('talbi-admin-token')
```

Then:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/admin/stats
```

### 4. Test Email (Optional)

Submit a contact form and check if email is sent to `ADMIN_EMAIL`.

Note: If SMTP is not configured, the form still returns success but no email is sent.

## Deploying to Vercel

### 1. Prepare Repository

Ensure `.env` is in `.gitignore` (CRITICAL):

```bash
# .gitignore should contain:
backend/.env
.env
.env.local
.env.*.local
```

### 2. Push to Git

```bash
git add .
git commit -m "Security audit fixes: JWT auth, bcrypt hashing, serverless conversion"
git push origin main
```

### 3. Set Environment Variables on Vercel

In Vercel Dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable from `.env`:
   - `ADMIN_USER`
   - `ADMIN_PASS_HASH`
   - `JWT_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `ADMIN_EMAIL`
   - `NODE_ENV=production`

**CRITICAL:** Do NOT paste the entire `.env` file content in one variable. Add each as a separate variable.

### 4. Verify Deployment

After deployment, test:

1. **Check Legal Pages**
   - https://your-domain.com/mentions-legales.html
   - https://your-domain.com/politique-confidentialite.html

2. **Test Admin Login**
   - https://your-domain.com/admin
   - Login with credentials

3. **Test API Endpoints**
   - https://your-domain.com/api/services
   - https://your-domain.com/api/reviews

4. **Monitor Logs**
   - In Vercel Dashboard → Deployments → Logs
   - Check for JWT errors or SMTP issues

## Troubleshooting

### Login Fails with "Identifiants incorrects"

1. Check bcrypt hash is correct
2. Verify password matches the hash (regenerate if needed)
3. Check browser console for errors
4. Ensure `ADMIN_PASS_HASH` is set in `.env` or Vercel env vars

### Email Not Sending

1. Check SMTP credentials are correct
2. For Gmail, ensure App Password is used (not regular password)
3. Check email address format is correct
4. View Vercel logs for nodemailer errors
5. SMTP can be omitted — contact form will still work

### JWT Token Invalid

1. Ensure `JWT_SECRET` is set in environment
2. Check token expiration (7 days by default)
3. Browser sessionStorage clears on logout
4. Try clearing browser cache and logging in again

### Admin Panel Shows "Non autorisé"

1. Verify you're logged in (check sessionStorage)
2. Ensure Authorization header is sent with requests
3. Check JWT token validity
4. Try logging out and back in

### Static Files Return 404

1. Ensure `vercel.json` is in root directory
2. Check that HTML files are in correct locations
3. Verify `.gitignore` doesn't exclude static files
4. Check rewrite rules in `vercel.json`

## Security Checklist

Before going live:

- [ ] `.env` file NOT committed to git
- [ ] `.env` file NOT visible in GitHub
- [ ] `ADMIN_PASS_HASH` uses strong bcrypt hash
- [ ] `JWT_SECRET` is 32+ random characters
- [ ] SMTP credentials are from app-specific passwords
- [ ] All env vars set in Vercel dashboard
- [ ] Admin panel login works with new credentials
- [ ] Contact form submission works
- [ ] Legal pages accessible and complete
- [ ] HTTPS/SSL enabled (automatic on Vercel)
- [ ] Review old hardcoded credentials in code (removed)
- [ ] Test with invalid passwords (should fail)
- [ ] Test with expired JWT (should re-prompt login)

## Production Best Practices

1. **Rotate Secrets Regularly**
   - Every 90 days, generate new `JWT_SECRET`
   - Consider rotating `ADMIN_PASS_HASH` monthly

2. **Monitor Logs**
   - Set up Vercel email alerts for errors
   - Monitor failed login attempts

3. **Backup Data**
   - Daily backup of `/backend/data/` JSON files
   - Store backups in secure location

4. **Update Dependencies**
   - Run `npm update` quarterly
   - Test updates in staging before production

5. **Rate Limiting**
   - Consider adding rate limiting on contact form
   - Prevent brute force login attempts

## Support

See `SECURITY_FIXES.md` for detailed technical documentation of all changes.

Contact Hassan TALBI for deployment assistance.

---

**Last Updated:** March 27, 2026
**Status:** Production Ready
**Next Review:** June 27, 2026
