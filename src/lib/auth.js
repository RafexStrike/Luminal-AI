// FILE: src/lib/auth.js
// DESCRIPTION: Better Auth configuration with email/password and Google OAuth

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// MongoDB connection URI
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI environment variable is required");
}

// Create MongoDB client
const mongoClient = new MongoClient(mongoUri);

// Initialize Better Auth
const betterAuthInstance = betterAuth({
  database: mongodbAdapter(mongoClient.db("luminalDB")),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
  basePath: "/api/auth",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Email and password signin
  emailAndPassword: {
    enabled: true,
    autoSignUpEmail: false, // Temporarily enabled to create users via API
    minPasswordLength: 6,
  },

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.Google_Client_ID,
      clientSecret: process.env.Google_Client_Secret,
    },
  },

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache for 5 minutes
    },
  },

  // User configuration to include custom fields in session
  user: {
    additionalFields: {
      role: {
        type: "string",
        default: "user",
      },
    },
  },

  // Hooks to capture user data and include role in session
  hooks: {
    after: async ({ user, session }) => {
      // Ensure role is included in the session user object
      if (session && user) {
        session.user = {
          ...session.user,
          role: user.role || "user",
        };
      }
      return { user, session };
    },
    onSuccess({ user, session }) {
      // User is automatically saved to MongoDB with all fields:
      // - id, email, name, image, role, createdAt, updatedAt
      // Additional logging for debugging
      console.log("✓ User created/logged in:", {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      return { user, session };
    },
  },

  // Plugins (if needed in future)
  plugins: [],
});

// Export better-auth instance
export const auth = betterAuthInstance;

// Export handler for Next.js
export const POST = async (req, res) => betterAuthInstance.handler(req);
export const GET = async (req, res) => betterAuthInstance.handler(req);

export async function getAuthSession(req) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return session;
  } catch (error) {
    console.error("Error getting auth session:", error);
    return null;
  }
}

export async function getUserFromRequest(req) {
  const session = await getAuthSession(req);
  return session?.user || null;
}
