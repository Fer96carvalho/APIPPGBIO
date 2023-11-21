const bcrypt = require("bcrypt");
const { MongoClient } = require("mongodb");
const uri = process.env.uri;
const client = new MongoClient(uri);
require('dotenv').config()



// Dados do usuário admin
const adminUser = {
    nome: process.env.NameAdmin ,
    email: process.env.EmailAdmin ,
    senha: process.env.PasswordAdmin ,
    passport: "Admin",
  };
  
  // Função para criar e salvar o usuário admin
  async function criarUsuarioAdmin() {
    const hashedPassword = await bcrypt.hash(adminUser.senha, 10);
    adminUser.senha = hashedPassword;
  
    const usuariosCollection = client.db("PPG_Teste").collection("Users");
    // Verifica se o usuário já existe
    try {
      const user = await usuariosCollection.findOne({ email: adminUser.email });
  
      if (!user) {
        try {
          const admin = await usuariosCollection.insertOne(adminUser);
          console.log("Usuario Admin criado com sucesso!", admin.insertedId);
        } catch (err) {
          console.error(err);
          return;
        }
      }
    } catch (err) {
      console.error("Operação falhou", err);
    }
  }

  module.exports = criarUsuarioAdmin;
  