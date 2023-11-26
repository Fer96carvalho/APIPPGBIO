const express = require("express");
const app = express();
const cors = require("cors");
const handleOptions = require("./handleOptions");
require('dotenv').config()
const port = process.env.ServerPort;

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: "Content-Type,Authorization,Origin,X-Requested-With,Accept",
};

app.use(cors(corsOptions));
app.use(handleOptions);

const { connectDatabase } = require("./database");
const { configureRoutes } = require("./routes");
const criarUsuarioAdmin = require('./admin-credentials');
const handleOptions = require("./handleOptions");

app.use(express.json());

connectDatabase(); // Conecta ao banco de dados
configureRoutes(app); // Configura as rotas
criarUsuarioAdmin(); // Cria o usuario Admin no Banco de Dados

app.use(express.json());
app.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});
