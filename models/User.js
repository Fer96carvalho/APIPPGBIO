const mongoose = require('mongoose');
mongoose.connect(process.env.uri);
require('dotenv').config()


const User = mongoose.model('User', {
    nome: String,
    email: String,
    senha: String,
    passport: String
})

module.exports = User;