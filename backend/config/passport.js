const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./database');

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1 AND auth_provider = $2', [email, 'local']);

      if (result.rows.length === 0) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const user = result.rows[0];

      if (!user.password) {
        return done(null, false, { message: 'Please use social login for this account' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Remove password from user object
      delete user.password;
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const result = await db.query(
          'SELECT * FROM users WHERE provider_id = $1 AND auth_provider = $2',
          [profile.id, 'google']
        );

        if (result.rows.length > 0) {
          const user = result.rows[0];
          delete user.password;
          return done(null, user);
        }

        // Create new user
        const username = profile.displayName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now();
        const insertResult = await db.query(
          `INSERT INTO users (username, email, full_name, profile_image, auth_provider, provider_id)
           VALUES ($1, $2, $3, $4, 'google', $5)
           RETURNING id`,
          [username, profile.emails[0].value, profile.displayName, profile.photos[0]?.value || null, profile.id]
        );

        const newUser = {
          id: insertResult.rows[0].id,
          username,
          email: profile.emails[0].value,
          full_name: profile.displayName,
          profile_image: profile.photos[0]?.value || null,
          auth_provider: 'google'
        };

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

// Facebook Strategy (only if credentials are configured)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const result = await db.query(
          'SELECT * FROM users WHERE provider_id = $1 AND auth_provider = $2',
          [profile.id, 'facebook']
        );

        if (result.rows.length > 0) {
          const user = result.rows[0];
          delete user.password;
          return done(null, user);
        }

        // Create new user
        const username = profile.displayName.toLowerCase().replace(/\s/g, '_') + '_' + Date.now();
        const insertResult = await db.query(
          `INSERT INTO users (username, email, full_name, profile_image, auth_provider, provider_id)
           VALUES ($1, $2, $3, $4, 'facebook', $5)
           RETURNING id`,
          [username, profile.emails?.[0]?.value || null, profile.displayName, profile.photos?.[0]?.value || null, profile.id]
        );

        const newUser = {
          id: insertResult.rows[0].id,
          username,
          email: profile.emails?.[0]?.value || null,
          full_name: profile.displayName,
          profile_image: profile.photos?.[0]?.value || null,
          auth_provider: 'facebook'
        };

        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query('SELECT id, username, email, full_name, profile_image, auth_provider, role, is_active FROM users WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
