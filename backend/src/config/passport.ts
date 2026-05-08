// ─── Configuración de Passport con Google OAuth ─────────────────────────
// Permite registro / login con cuenta de Google.
// Si la usuaria ya existía (por email) se enlaza el googleId al usuario existente.

import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import User from "../models/user.model";

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } = process.env;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
        done
      ) => {
        try {
          // 1. Buscar por googleId (usuaria que ya entró antes con Google)
          let user = await User.findOne({ googleId: profile.id });
          if (user) return done(null, user);

          // 2. Buscar por email (usuaria que se había registrado con email/password)
          //    Si existe, le enlazamos el googleId.
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              user.googleId = profile.id;
              await user.save();
              return done(null, user);
            }
          }

          // 3. No existe: la creamos con los datos del perfil de Google.
          const newUser = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            // password vacío: la usuaria solo entrará con Google
          });
          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  // Passport requiere serializeUser/deserializeUser aunque usemos JWT;
  // nuestro flujo no mantiene sesión, pero la librería los pide.
  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
} else {
  console.warn("[passport] GOOGLE_CLIENT_ID/SECRET no configurados — Google OAuth desactivado");
}

export default passport;