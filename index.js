const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const app = express();
app.use(express.json());
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const passport = require("./auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config()



// Configuração do MongoDB

client.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao MongoDB:", err);
  } else {
    console.log("Conectado ao MongoDB");
  }
});

// TESTE ADMIN

// Dados do usuário admin
const adminUser = {
  nome: "Admin PPGB",
  email: "admin@ppgb.ufopa.edu",
  senha: "admin1234",
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

// ROTA DE LOGIN

app.post("/login", async (req, res) => {
  const userLogin = req.body;
  try {
    const user_collection = client.db("PPG_Teste").collection("Users");
    const user_match = await user_collection.findOne({
      email: userLogin.email,
    });
    const check_password = await bcrypt.compare(
      userLogin.senha,
      user_match.senha
    );

    if (!check_password || !user_match) {
      return res.status(401).json({ mensage: "Usuario ou senha incorreto!" });
    }
    const token = jwt.sign({ userId: user_match._id }, process.env.SecretKey, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error("Erro ao se autenticar:", err);
    return res.status(401).json({ mensage: "Erro ao autenticar!" });
  }
});

// ROTAS DA API

// Post Nova Noticia
app.post(
  "/noticia/new",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      const noticia = req.body;
      const collection = client.db("PPG_Teste").collection("Noticias");
      const newNotice = await collection.insertOne(noticia);
      res.status(201).json({
        mensagem: "Noticia criada com sucesso!",
        id: newNotice.insertedId,
      });
    } catch (err) {
      console.error("Erro ao criar uma nova noticia", err);
      res.status(500).send("Erro ao criar notícia: " + err);
    }
  }
);

// get all noticias
app.get("/noticias", async (req, res) => {
  try {
    const collection = client.db("PPG_Teste").collection("Noticias");
    const noticias = await collection.find({}).toArray();
    res.json(noticias);
  } catch (err) {
    console.error("Erro ao buscar notícias:", err);
    res.status(500).json({ error: "Erro ao buscar notícias." });
  }
});

// get all noticias by categoria
app.get("/noticias/categoria/:cat", async (req, res) => {
  try {
    const cat = req.params.cat;
    if (!cat) {
      return res.status(400).json({ error: "Parâmetro cat ausente na url." });
    }

    const collection = client.db("PPG_Teste").collection("Noticias");
    const noticias = await collection
      .find({ categorias: { $regex: cat, $options: "i" } })
      .toArray();
    res.json(noticias);
  } catch (err) {
    console.error("Erro ao buscar noticias", err);
    res.status(500).json({ error: "Erro ao buscar noticias." });
  }
});

// get noticia by id
app.get("/noticia/id/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const collection = client.db("PPG_Teste").collection("Noticias");
    const noticia = await collection.findOne({ _id: new ObjectId(id) });

    if (!noticia) {
      return res.status(404).json({ error: "Notícia não encontrada." });
    }

    res.json(noticia);
  } catch (err) {
    console.error("Erro ao buscar noticias", err);
    res.status(500).json({ error: "Erro ao buscar noticias." });
  }
});

// Get last 3 noticias
app.get("/noticias-recentes", async (req, res) => {
  try {
    const collection = client.db("PPG_Teste").collection("Noticias");
    const noticias = await collection
      .find()
      .sort({ data: -1, hora: -1 })
      .limit(5)
      .toArray();

    if (noticias.length === 0) {
      return res.status(404).json({ error: "Nenhuma notícia encontrada." });
    }

    res.json(noticias);
  } catch (err) {
    console.error("Erro ao buscar notícias:", err);
    res.status(500).json({ error: "Erro ao buscar notícias." });
  }
});

// get noticias by Titulo
app.get("/noticias/titulo/:titulo", async (req, res) => {
  try {
    const titulo = req.params.titulo;
    if (!titulo) {
      return res
        .status(400)
        .json({ error: "Parâmetro titulo ausente na url." });
    }

    const collection = client.db("PPG_Teste").collection("Noticias");
    const noticias = await collection
      .find({ titulo: { $regex: titulo, $options: "i" } })
      .toArray();
    res.json(noticias);
  } catch (err) {
    console.error("Erro ao buscar notícias", err);
    res.status(500).json({ error: "Erro ao buscar notícias." });
  }
});

// Get img carrosel
app.get("/carrousel-img", async (req, res) => {
  try {
    const collection = client.db("PPG_Teste").collection("Img_carrosel");
    const carrousel = await collection.find({}).toArray();
    res.json(carrousel);
  } catch (err) {
    console.error("Erro ao buscar imagens:", err);
    res.status(500).json({ error: "Erro ao buscar imagens." });
  }
});

// get all corpo academico
app.get("/corpo-academico", async (req, res) => {
  try {
    const collection = client.db("PPG_Teste").collection("Corpo_docente");
    const docentes = await collection.find({}).toArray();
    res.json(docentes);
  } catch (err) {
    console.error("Erro ao buscar Corpo Docente:", err);
    res.status(500).json({ error: "Erro ao buscar corpo docente." });
  }
});

// get corpo academico by id
app.get("/corpo-academico/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido." });
    }
    const collection = client.db("PPG_Teste").collection("Corpo_docente");
    const docente = await collection.findOne({ _id: new ObjectId(id) });

    if (!docente) {
      return res.status(404).json({ error: "Docente não encontrado." });
    }

    res.json(docente);
  } catch (err) {
    console.error("Erro ao buscar Docente.", err);
    res.status(500).json({ error: "Erro ao buscar corpo docente." });
  }
});



app.use(express.json());
app.listen(3000, () => {
  console.log("Servidor Express rodando na porta 3000");
  criarUsuarioAdmin();
});
