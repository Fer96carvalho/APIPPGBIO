const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

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
