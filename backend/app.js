const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
// const passport = require('./config/passport');
const passport = require('./src/config/passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const config = require('./config/config');
const config = require('./src/config/config');


// Import Routes
const ticketsRoutes = require('./src/routes/ticketsRoutes');
const ordersRoutes = require('./src/routes/ordersRoutes');
// const eventsRoutes = require('./routes/eventsRoutes');
const eventRoutes = require('./src/pages/event/event.routes');
// const order_itemsRoutes = require('./src/routes/order_itemsRoutes');
// const paymentsRoutes = require('./src/routes/paymentsRoutes');
const usersRoutes = require('./src/routes/usersRoutes');
const waitingQueueRoutes = require('./src/routes/waitingQueueRoutes');
const authRoutes = require('./src/routes/authRoutes'); // Ini cukup sekali

const app = express();
const port = process.env.PORT || 3000;


// Konfigurasi CORS — biarkan akses dari frontend di port 5000
app.use(cors({
  origin: ['http://127.0.0.1:5000', 'http://localhost:5000'],  // Pastikan ini sesuai dengan frontend yang sedang kamu pakai
  methods: ['GET', 'POST'],
  credentials: true
}));

// Middleware lainnya
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(session({
  secret: config.sessionSecret, // pastikan ini ada di file config
  resave: false,
  saveUninitialized: true,
}));



// Routing API
app.use(ticketsRoutes);
app.use(ordersRoutes);
// app.use(eventsRoutes);
app.use('/api/events', eventRoutes);
// app.use(order_itemsRoutes);
// app.use(paymentsRoutes);
app.use(usersRoutes);
app.use(waitingQueueRoutes);
app.use('/api/auth', authRoutes); // Pastikan route login/register masuk ke sini

// Inisialisasi Passport
app.use(passport.initialize());
app.use(passport.session());

const User = require('./src/models/user'); // pastikan path-nya benar

passport.use(new GoogleStrategy({
  clientID: config.googleClientID,
  clientSecret: config.googleClientSecret,
  callbackURL: config.googleCallbackURL
}, (accessToken, refreshToken, profile, done) => {
  // Ambil data dari Google
  const googleId = profile.id;
  const username = profile.displayName;
  const email = profile.emails && profile.emails[0]?.value;

  // Cari user di database
  User.findByGoogleId(googleId, (err, existingUser) => {
    if (err) return done(err);

    if (existingUser) {
      // User sudah ada, lanjutkan
      return done(null, existingUser);
    } else {
      // User belum ada, simpan ke database
      User.createUserFromGoogle({ id: googleId, displayName: username, emails: [{ value: email }] }, (err, newUser) => {
        if (err) return done(err);
        return done(null, newUser);
      });
    }
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id); // simpan ID user di session
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

/* ----------- Google OAuth Routes ----------- */
// Mulai proses login dengan Google
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Callback dari Google setelah login
app.get('/auth/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/failed',
  }),
  (req, res) => {
    // Jika login berhasil, redirect ke frontend (dashboard misalnya)
    res.redirect('http://localhost:5000/');
  });

// Jika login gagal
app.get('/auth/failed', (req, res) => {
  res.send('<h2>Login gagal. Silakan coba lagi.</h2>');
});

/* ------------- Static File Serving ------------ */
app.use(express.static(path.join(__dirname, 'public')));

// Jalankan server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
