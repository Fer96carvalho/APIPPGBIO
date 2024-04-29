require('dotenv').config()
const User = require('./models/User');
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;


let cookieExtractor = function(req) {
  let token = null;
  if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
  }
  return token;
};

const jwtOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.SecretKey,
};

passport.use(new JwtStrategy(jwtOptions, (jwtPayload, done) => {
  try {
    const user =  User.findById(jwtPayload.userId);
    
    if (user) {
      console.log("Autorizado");
      return done(null, user);
    } else {
      console.log(user);
      console.log("Não autorizado");
      return done(null, false);
    }
  } catch (err) {
    console.log("Erro:", err);
    return done(err, false);
  }
}));

module.exports = passport;
