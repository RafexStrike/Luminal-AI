# Demo Mode & Admin Dashboard Implementation Guide

## Overview
This implementation adds a complete demo mode system and admin dashboard to the Luminal AI study platform. It includes user seeding, quick-access login buttons, admin dashboard, and middleware protection.

## Components Implemented

### 1. Data Seeding Script (`scripts/seed_admin.mjs`)
- **Purpose**: Creates default admin and demo users in MongoDB
- **Users Created**:
  - Admin: `admin@luminal.com` (role: `admin`) - Special access account
  - Demo User: `rafi@rafi.com` with password `rafi123` (role: `user`)
  
**How to Run**:
```bash
node scripts/seed_admin.mjs
```

**What It Does**:
- Connects to MongoDB using `MONGODB_URI` environment variable
- Creates the `user` collection if it doesn't exist
- Checks if users already exist (idempotent)
- Sets appropriate roles for both users
- Hashes the demo user password using bcrypt

### 2. Login Page Enhancement (`src/app/auth/login/page.jsx`)
- **New Section**: "Quick Access" below the main login form
- **Two Demo Buttons**:
  1. **🛡️ Demo Admin Login**: Special demo admin authentication
  2. **👤 Demo Account Login**: Uses rafi@rafi.com / rafi123
  
**Features**:
- Demo Admin button has a subtle pulse animation to attract attention
- Both buttons integrated with the existing authentication system
- Error handling and loading states included
- Responsive design matching existing UI

### 3. Navbar Update (`src/app/navbar/page.jsx`)
- **New Feature**: Admin-only "Go to Admin Dashboard" button
- **Location**: User dropdown menu
- **Visibility**: Only shows for users with `role: "admin"`
- **Styling**: Includes pulse animation and shield icon (🛡️)
- **Navigation**: Direct link to `/admin/dashboard`

### 4. Middleware Protection (`src/middleware.js`)
- **Protected Routes**:
  - `/admin` and all sub-routes (`/admin/*`)
  - `/secondStage` (existing)
  
- **Authentication Check**: Verifies valid session cookie
- **Role Verification**: Happens at the page level for `/admin` routes
- **Redirect**: Unauthenticated users redirected to `/auth/login`

### 5. Admin Dashboard (`src/app/admin/dashboard/page.jsx`)
Beautiful, feature-rich admin interface with:

#### System Overview Cards
- **Total Embeddings**: Vector embeddings in the RAG store
- **Total Chunks**: Document chunks indexed
- **Vector Store Size**: Storage utilization
- **Active Users**: Currently logged-in users

#### System Health Section
- **LLM Service Status**: Ollama/Hugging Face connectivity
- **Vector Database Health**: Embedding accessibility
- **MongoDB Connection**: Primary database status
- Visual indicators (green/yellow/red) for each service

#### Recent Study Sessions Table
- User email
- Session start time
- Current activity
- Flashcards generated count

#### Management Actions
- **Run Backfill Embeddings**: Triggers the backfill script
- **Clear RAG Stubs**: Removes temporary RAG data
- Real-time action feedback with status messages

#### Security
- Admin role verification before displaying content
- Automatic redirect to home if non-admin user accesses
- Protected by middleware

### 6. Admin Root Route (`src/app/admin/page.jsx`)
- Redirects `/admin` to `/admin/dashboard`
- Ensures users don't land on empty routes

## User Roles & Access Control

### User Schema Extension
The system extends the default Better Auth user schema with:
```javascript
{
  id: string,              // UUID
  email: string,           // Unique email
  name: string,            // Display name
  emailVerified: boolean,  // Email verification status
  password: string,        // Hashed password (nullable for special accounts)
  role: "admin" | "user",  // User role
  createdAt: Date,         // Account creation timestamp
  updatedAt: Date          // Last update timestamp
}
```

### Role-Based Access
- **Admin Role**: Full access to Admin Dashboard
- **User Role**: Standard platform access
- **Unauthenticated**: Redirected to login page

## Demo Accounts

### Admin Account
- **Email**: `admin@luminal.com`
- **Access**: Full admin dashboard access
- **Use Case**: Test admin features and system monitoring

### Demo User Account
- **Email**: `rafi@rafi.com`
- **Password**: `rafi123`
- **Access**: Standard user features
- **Use Case**: Quick test account for platform features

## How to Use

### Initial Setup
1. Ensure environment variables are set:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   DB_NAME=luminalDB
   BETTER_AUTH_SECRET=your_secret_key
   ```

2. Run the seed script to create demo users:
   ```bash
   node scripts/seed_admin.mjs
   ```

### Quick Login Options

**Option 1: Using Quick Access Buttons**
1. Go to `/auth/login`
2. Scroll to "Quick Access" section
3. Click desired demo button
4. Automatically authenticated

**Option 2: Manual Login**
1. Enter email: `rafi@rafi.com`
2. Enter password: `rafi123`
3. Log in normally

### Accessing Admin Dashboard
1. Log in as admin or demo user
2. Navigate to any page
3. Click your profile dropdown (top right)
4. If admin: Click "🛡️ Admin Dashboard"
5. View system stats, health, and manage operations

## Styling & Design

### Color Scheme
- Primary gradient: Purple to Indigo
- Admin buttons: Amber/Orange gradient with pulse
- Demo buttons: Cyan/Blue gradient
- Status indicators: Green (online), Red (offline), Yellow (degraded)

### Animation
- Demo Admin button: `animate-pulse` (breathing effect)
- Dashboard elements: Smooth transitions
- Loading states: Spinner animations
- Status cards: Hover effects

## Technical Details

### Database Schema
Users are stored in MongoDB with Better Auth adapter:
- Collection: `user`
- Indexes: email (unique)
- Default fields: ID, email, name, image, createdAt, updatedAt
- Custom fields: role, emailVerified, password

### Authentication Flow
1. User submits credentials
2. Better Auth validates and hashes password
3. Session token created and stored in HTTP-only cookie
4. Middleware checks cookie on protected routes
5. Client-side code reads role from session user object

### API Endpoints Used
- `POST /api/auth/sign-in/email`: Email/password authentication
- `POST /api/auth/sign-out`: Logout
- `GET /api/auth/session`: Get current session info

## Security Considerations

✅ **Implemented**:
- HTTP-only session cookies
- Password hashing with bcrypt
- Middleware route protection
- Role-based access control
- Automatic redirect for unauthorized access

⚠️ **Future Enhancements**:
- Rate limiting on login attempts
- Audit logging for admin actions
- Two-factor authentication for admin accounts
- API key management for programmatic access
- Session activity tracking

## Troubleshooting

### Demo buttons not working
- Check MongoDB connection string
- Verify users exist: run `node scripts/seed_admin.mjs` again
- Clear browser cookies and retry

### Admin dashboard not showing
- Verify user has `role: "admin"` in database
- Check middleware configuration
- Clear session cache

### Password hashing errors
- Ensure `bcrypt` package is installed: `npm install bcrypt`
- Check Node.js version compatibility

## Files Modified/Created

**Created**:
- `scripts/seed_admin.mjs`
- `src/app/admin/page.jsx`
- `src/app/admin/dashboard/page.jsx`

**Modified**:
- `src/app/auth/login/page.jsx`
- `src/app/navbar/page.jsx`
- `src/middleware.js`

## Environment Variables Required
```
MONGODB_URI=mongodb+srv://...
DB_NAME=luminalDB
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
Google_Client_ID=... (if using Google OAuth)
Google_Client_Secret=... (if using Google OAuth)
```

## Next Steps

To further enhance the admin dashboard:
1. Connect real RAG statistics API
2. Implement live system health monitoring
3. Add user activity analytics
4. Create log viewer for system events
5. Add configuration management UI
6. Implement admin action audit trail
