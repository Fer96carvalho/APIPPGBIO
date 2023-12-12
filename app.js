const express = require("express");
const app = express();
const cors = require("cors");
require('dotenv').config()
const port = process.env.ServerPort;

const corsOptions = {
  origin: ['https://cassiasantos.github.io/PPG-Biociencias-UFOPA/blog.html', 'http://127.0.0.1:5500'],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
  credentials: true,
  preflightContinue: true,
  optionsSuccessStatus: 200,
  allowedHeaders: "Content-Type,Authorization,Origin,X-Requested-With,Accept",
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Origin,X-Requested-With,Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});


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
