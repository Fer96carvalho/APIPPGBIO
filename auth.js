require('dotenv').config()
const User = require('./models/User');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;


const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.SecretKey,
};

passport.use(new JwtStrategy(jwtOptions, async(jwtPayload, done) => {
  try {
    const user = await User.findById(jwtPayload.userId);
    
    if (user) {
      console.log("Autorizado");
      return done(null, user);
    } else {
      console.log("Não autorizado");
      return done(null, false);
    }
  } catch (err) {
    console.log("Erro:", err);
    return done(err, false);
  }
}));

module.exports = passport;
