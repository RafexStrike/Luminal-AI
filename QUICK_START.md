# Demo Mode & Admin Dashboard - Quick Start Guide

## 🚀 Quick Setup (< 5 minutes)

### 1. Run the Seed Script
```bash
# This creates admin and demo users in MongoDB
node scripts/seed_admin.mjs
```

**Expected Output:**
```
✓ Connected to MongoDB
✓ Admin user created: admin@luminal.com
  └─ Password: admin@123
✓ Demo user created: rafi@rafi.com
  └─ Password: rafi123
✅ Seeding complete!
```

### 2. Start the Dev Server
```bash
npm run dev
# or
pnpm dev
```

### 3. Test the Implementation

#### Test Demo Login Buttons
1. Navigate to `http://localhost:3000/auth/login`
2. Scroll to "Quick Access" section (below Google login)
3. Click one of the demo buttons:
   - 🛡️ **Demo Admin Login**: Logs in as `admin@luminal.com`
   - 👤 **Demo Account Login**: Logs in as `rafi@rafi.com`

#### Test Admin Dashboard
1. Log in as admin (either via login page or navbar)
2. Open the user profile dropdown (top right)
3. Click "🛡️ Admin Dashboard" (pulsing button)
4. View system stats, health, and management options

#### Test Admin Protection
1. Try accessing `/admin` or `/admin/dashboard` while logged out → Redirects to login
2. Log in as regular user → Dashboard shows "access denied" redirect
3. Log in as admin → Full dashboard access

---

## 📋 Demo Account Credentials

### Admin Account
- **Email**: `admin@luminal.com`
- **Password**: `admin@123`
- **Role**: `admin`
- **Access**: Full Admin Dashboard

### Demo User Account
- **Email**: `rafi@rafi.com`
- **Password**: `rafi123`
- **Role**: `user`
- **Access**: Standard platform features

---

## 📊 What's Included

### Login Page Enhancements
- Quick Access buttons for instant demo login
- Visual distinction with pulsing animation
- Responsive design

### Admin Dashboard Features
- **System Overview**: Embeddings, chunks, vector store size
- **System Health**: LLM, Database, and Vector Store status
- **Study Sessions**: User activity and flashcard metrics
- **Management Actions**: Backfill embeddings, clear RAG stubs

### Middleware Protection
- `/admin` routes require authentication
- Role-based access control
- Automatic redirects for unauthorized access

---

## 🛠️ Customization

### Change Admin Password
Edit `scripts/seed_admin.mjs`:
```javascript
const adminPassword = "your-new-password"; // Line 5
```
Then re-run: `node scripts/seed_admin.mjs`

### Change Demo User Credentials
Edit `scripts/seed_admin.mjs`:
```javascript
const demoEmail = "your-email@example.com";
const demoPassword = "your-password";
```
Then re-run: `node scripts/seed_admin.mjs`

### Customize Dashboard Appearance
Edit `src/app/admin/dashboard/page.jsx`:
- Modify color schemes in the component classes
- Update stat card data sources
- Customize health indicators
- Add/remove management actions

### Add Admin-Only Actions
```jsx
// In any page component
const { data: session } = useAuth();

if (session?.user?.role === "admin") {
  // Show admin features
}
```

---

## 🔗 File Structure

```
luminal/
├── scripts/
│   └── seed_admin.mjs                    # Creates admin & demo users
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── page.jsx                  # Admin root (redirects to dashboard)
│   │   │   └── dashboard/
│   │   │       └── page.jsx              # Admin dashboard
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── page.jsx              # Login page with demo buttons
│   │   └── navbar/
│   │       └── page.jsx                  # Navbar with admin button
│   └── middleware.js                    # Route protection
└── DEMO_MODE_GUIDE.md                   # Comprehensive documentation
```

---

## 🧪 Testing Checklist

- [ ] Run seed script successfully
- [ ] Demo Admin button logs in without error
- [ ] Demo Account button logs in without error
- [ ] Admin Dashboard button appears only for admin users
- [ ] Admin Dashboard loads with stats and health info
- [ ] Management action buttons work (show feedback)
- [ ] Non-admin users can't access `/admin` routes
- [ ] Unauthenticated users redirected to login from protected routes

---

## ⚠️ Troubleshooting

### "MONGODB_URI not set" Error
```bash
# Add to .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=luminalDB
BETTER_AUTH_SECRET=your-secret-key
```

### "Users table doesn't exist"
- The seed script auto-creates it
- Re-run: `node scripts/seed_admin.mjs`

### Demo buttons not authenticating
- Verify users exist: check MongoDB `luminalDB.user` collection
- Check password is `admin@123` and `rafi123`
- Clear browser cookies and retry

### Admin Dashboard shows "Access Denied"
- Verify user has `role: "admin"` in database
- Update manually in MongoDB if needed:
  ```javascript
  db.user.updateOne(
    { email: "admin@luminal.com" },
    { $set: { role: "admin" } }
  )
  ```

### Styling looks broken
- Ensure Tailwind CSS is properly configured
- Check `tailwind.config.mjs` includes all app directories
- Rebuild: `npm run build`

---

## 📞 Support

For issues or questions:
1. Check `DEMO_MODE_GUIDE.md` for detailed documentation
2. Verify environment variables are set
3. Check MongoDB connection
4. Ensure Better Auth is properly configured

---

## 📦 Dependencies Used

- **bcrypt**: Password hashing
- **uuid**: User ID generation
- **mongodb**: Database connection
- **better-auth**: Authentication framework
- **lucide-react**: Admin dashboard icons

All dependencies already in `package.json` ✅

---

**Last Updated**: April 12, 2026
**Status**: Production Ready ✅
