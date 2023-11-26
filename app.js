const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config()
const port = process.env.ServerPort;

const corsOptions = {
  origin: ['https://cassiasantos.github.io/PPG-Biociencias-UFOPA/blog.html, http://127.0.0.1:5500'],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  preflightContinue: true,
  optionsSuccessStatus: 200,
  allowedHeaders: "Content-Type,Authorization,Origin,X-Requested-With,Accept",
};

app.use(cors(corsOptions));

const { connectDatabase } = require("./database");
const { configureRoutes } = require("./routes");
const criarUsuarioAdmin = require('./admin-credentials');

app.use(express.json());

connectDatabase(); // Conecta ao banco de dados
configureRoutes(app); // Configura as rotas
criarUsuarioAdmin(); // Cria o usuario Admin no Banco de Dados

app.use(express.json());
app.listen(port, () => {
  console.log(`Servidor Express rodando na porta ${port}`);
});
