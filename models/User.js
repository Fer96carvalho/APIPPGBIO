const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017');

const User = mongoose.model('User', {
    nome: String,
    email: String,
    senha: String,
    passport: String
})

module.exports = User;