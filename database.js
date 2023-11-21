const { MongoClient } = require("mongodb");

const uri = process.env.uri;
const client = new MongoClient(uri);
require('dotenv').config()


function connectDatabase() {
 
  client.connect((err) => {
    if (err) {
      console.error("Erro ao conectar ao MongoDB:", err);
    } else {
      console.log("Conectado ao MongoDB");
    }
  });
}

module.exports = { connectDatabase };
