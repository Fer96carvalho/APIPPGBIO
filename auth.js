require('dotenv').config()
const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.uri;
const client = new MongoClient(uri);

let cookieExtractor = function(req) {
  let token = null;
  if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
  }
  return token;
};

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken() || cookieExtractor,
  secretOrKey: process.env.SecretKey,
};

passport.use(new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {

    const user_db = client.db("PPG_Teste").collection("Users");
    const user = await user_db.findOne({ _id: new ObjectId(jwtPayload.userId)});


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
