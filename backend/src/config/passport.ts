import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../index';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.warn('⚠️  Google OAuth credentials not configured');
}

// Configure Passport to use Google OAuth
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName || profile.name?.givenName || 'Unknown';
          const picture = profile.photos?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
          }

          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { googleId },
          });

          if (user) {
            // Update last login
            user = await prisma.user.update({
              where: { id: user.id },
              data: { lastLoginAt: new Date() },
            });
          } else {
            // Create new user - check if admin email
            const isAdmin = email === ADMIN_EMAIL;
            const isApproved = isAdmin; // Auto-approve admin

            user = await prisma.user.create({
              data: {
                googleId,
                email,
                name,
                picture,
                role: isAdmin ? 'admin' : 'employee',
                isApproved,
                isActive: true,
                lastLoginAt: new Date(),
              },
            });
          }

          return done(null, user);
        } catch (error) {
          console.error('Error in Google OAuth strategy:', error);
          return done(error, undefined);
        }
      }
    )
  );
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { branch: true },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;

