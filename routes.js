const { MongoClient, ObjectId } = require("mongodb");
const uri = process.env.uri;
const client = new MongoClient(uri);
const express = require("express");
const passport = require("./auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const uploadImageMiddleware = require("./uploadImageMiddleware");
require('dotenv').config()



function configureRoutes(app) {
  // ROTAS DA API

  // Rota de login
  app.post("/login", async (req, res) => {
    const userLogin = req.body;
    if (!userLogin.email) {
      return res.status(422).json({ menssage: "Campo email necessário!" });
    }
    if (!userLogin.senha) {
      return res.status(422).json({ menssage: "Campo senha necessário!" });
    }

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
      const token = jwt.sign(
        { userId: user_match._id },
        process.env.SecretKey,
        {
          expiresIn: "1h",
        }
      );
      res.json({ Token: token, id: user_match._id });
    } catch (err) {
      console.error("Erro ao se autenticar:", err);
      return res.status(401).json({ mensage: "Erro ao autenticar!" });
    }
  });

  //Create Usuario
  app.post("/create-user/:id", passport.authenticate("jwt", { session: false }),
    async (req, res) => {
      const usuario = req.params.id;
      try {
        const verifyUsuario = await await client.db("PPG_Teste").collection("Users").findOne({ _id: new ObjectId(usuario) });
        if (verifyUsuario.passport != "Admin") {
          return res.status(401).json({ messsage: "Acesso negado! Voce não tem permissão para criar novos usuarios." });
        }
      } catch (err) {
        res.status(500).json({ message: "Erro no servidor!" + err });
      }
      const nome = req.body.nome;
      const email = req.body.email;
      const senha = req.body.senha;

      const hashedPassword = await bcrypt.hash(senha, 10);
      const newUser = {
        nome,
        email,
        senha: hashedPassword,
        passport: 'Editor'
      }
      try {
        const confirmUser = await client.db("PPG_Teste").collection("Users").findOne({ email: email });
        if (confirmUser) {
          return res.status(409).json({ message: "Email invalido" });
        }

        const collection = client.db("PPG_Teste").collection("Users");
        const addUser = await collection.insertOne(newUser);
        res.status(201).json({ message: "Usuario criado com sucesso! ", id: addUser.insertedId })
      } catch (err) {
        console.error('Erro ao cria o usuario' + err);
        res.staus(500).json({ message: " Erro ao criar usuario " + err })
      }
    });

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


  // Update noticia
  app.put("/noticias/id/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const noticiaId = req.params.id;
    const newNotice = req.body;

    try {
      const collection = client.db("PPG_Teste").collection("Noticias");

      // Atualize a notícia com base no ID
      const result = await collection.updateOne(
        { _id: new ObjectId(noticiaId) },
        { $set: newNotice }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Notícia atualizada com sucesso." });
      } else {
        res.status(404).json({ message: "Notícia não encontrada." });
      }
    } catch (err) {
      console.error("Erro ao atualizar notícia:", err);
      res.status(500).json({ error: "Erro ao atualizar notícia." });
    }
  });


  //Delete Noticias
  app.delete("/noticias/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const noticiaId = req.params.id;

    try {
      const collection = client.db("PPG_Teste").collection("Noticias");
      const result = await collection.deleteOne({ _id: new ObjectId(noticiaId) });

      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Notícia deletada com sucesso." });
      } else {
        res.status(404).json({ message: "Notícia não encontrada." });
      }
    } catch (err) {
      console.error("Erro ao deletar notícia:", err);
      res.status(500).json({ error: "Erro ao deletar notícia." });
    }
  });



  // get all noticias
  app.get("/noticias", async (req, res) => {
    try {
      const collection = client.db("PPG_Teste").collection("Noticias");
      const noticias = (await collection.find({}).sort({ data: -1, hora: -1 }).toArray());
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
        return res.status(400).json({ error: "Parâmetro cat ausente na URL." });
      }

      const collection = client.db("PPG_Teste").collection("Noticias");
      const noticias = await collection
        .find({ categorias: { $regex: cat, $options: "i" } })
        .sort({ data: -1, hora: -1 }).toArray();
      res.json(noticias);
    } catch (err) {
      console.error("Erro ao buscar notícias", err);
      res.status(500).json({ error: "Erro ao buscar notícias." });
    }
  });



  // get categorias noticia
  app.get('/noticias/categorias', async (req, res) => {
    try {
      // Encontrar todos os documentos no banco de dados
      const collection = client.db("PPG_Teste").collection("Noticias");
      const noticias = await collection.find().toArray();

      const noticiasArray = Array.isArray(noticias) ? noticias : [noticias];

      // Contar o número de notícias em cada categoria
      const categorias = await noticiasArray.reduce((acc, noticia) => {
        noticia.categorias.forEach(categoria => {
          acc[categoria] = (acc[categoria] || 0) + 1;
        });
        return acc;
      }, {});

      res.json(categorias);
    } catch (error) {
      res.status(500).send(error.message);
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

  // Get last 6 noticias
  app.get("/noticias-recentes", async (req, res) => {
    try {
      const collection = client.db("PPG_Teste").collection("Noticias");
      const noticias = await collection
        .find()
        .sort({ data: -1, hora: -1 })
        .limit(6)
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
      if (noticias.length == 0) {
        return res.status(404).json({ message: "Nenhuma noticia encontrada!" });
      } else {
        res.json(noticias);
      }
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
  // Post img carrosel
  app.post("/carrousel-img",passport.authenticate("jwt", { session: false }), async (req, res) => {
    const newImage = {
      url: req.body.url
    }
    
    try {
      const collection = client.db("PPG_Teste").collection("Img_carrosel");
      const imagem = await collection.insertOne(newImage);
      res.status(201).json({ message: "Imagem adicionada com sucesso", id: imagem.insertedId, img: newImage });
    } catch (err) {
      console.error("Erro ao inserir imagem", err);
      res.status(500).json({ message: "Erro ao inserir a imagem", err });
    }
  });

  // Atualizando imagem existente
  app.put("/carrousel-img/",passport.authenticate("jwt", { session: false }), async (req, res) => {
    const id = req.body.id;
    const novaUrl = req.body.newUrl;
    const userAuth = req.user;
    console.log(userAuth);

    try {
      const collection = client.db("PPG_Teste").collection("Img_carrosel");
      const resultado = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { url: novaUrl } },
        { returnDocument: 'after' }
      );

      if (!resultado) {
        return res.status(404).json({ message: 'ID não encontrado' });
      }

      res.status(200).json({ message: 'URL atualizada com sucesso', id: id });
    } catch (err) {
      console.error("Erro ao atualizar a URL da imagem", err);
      res.status(500).json({ message: "Erro ao atualizar a URL da imagem", err });
    }
  });


  // Delete imagem carrosel
  app.delete("/carrousel-img/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const imagemId = req.params.id;

    try {
      const collection = client.db("PPG_Teste").collection("Img_carrosel");
      const result = await collection.deleteOne({ _id: new ObjectId(imagemId) });

      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Imagem deletada com sucesso." });
      } else {
        res.status(404).json({ message: "Imagem não encontrada." });
      }
    } catch (err) {
      console.error("Erro ao deletar imagem:", err);
      res.status(500).json({ error: "Erro ao deletar imagem." });
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

  //Post novo corpo academico
  app.post("/corpo-academico", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const novoDocente = req.body;

    try {
      const collection = client.db("PPG_Teste").collection("Corpo_docente");

      const result = await collection.insertOne(novoDocente);

      if (result.insertedCount === 1) {
        res.status(201).json({ message: "Docente adicionado com sucesso", id: result.insertedId });
      } else {
        res.status(500).json({ message: "Falha ao adicionar o docente" });
      }
    } catch (err) {
      console.error("Erro ao inserir docente:", err);
      res.status(500).json({ error: "Erro ao inserir docente." });
    }
  });

  // Update corpo academico by id
  app.put("/corpo-academico/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const docenteId = req.params.id;
    const novosDados = req.body;

    try {
      const collection = client.db("PPG_Teste").collection("Corpo_docente");
      const result = await collection.updateOne(
        { _id: new ObjectId(docenteId) },
        { $set: novosDados }
      );

      if (result.modifiedCount === 1) {
        res.status(200).json({ message: "Docente atualizado com sucesso" });
      } else {
        res.status(404).json({ message: "Docente não encontrado" });
      }
    } catch (err) {
      console.error("Erro ao atualizar docente:", err);
      res.status(500).json({ error: "Erro ao atualizar docente." });
    }
  });


  //Delete corpo academico
  app.delete("/corpo-academico/:id", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const docenteId = req.params.id;

    try {
      const collection = client.db("PPG_Teste").collection("Corpo_docente");
      const result = await collection.deleteOne({ _id: new ObjectId(docenteId) });

      if (result.deletedCount === 1) {
        res.status(200).json({ message: "Docente deletado com sucesso" });
      } else {
        res.status(404).json({ message: "Docente não encontrado" });
      }
    } catch (err) {
      console.error("Erro ao deletar docente:", err);
      res.status(500).json({ error: "Erro ao deletar docente." });
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


  // Rota para lidar com o upload de imagem
  //   app.post("/img/upload", passport.authenticate("jwt", { session: false }), uploadImageMiddleware, async (req, res) => {
  //     try {
  //       const collection = client.db("PPG_Teste").collection("Imagens");
  //       const result = await collection.insertOne(req.novaImagem);

  //       res.status(201).json({
  //         message: "Imagem enviada e salva no MongoDB.",
  //         id: result.insertedId,
  //       });
  //     } catch (err) {
  //       console.error("Erro ao salvar a imagem", err);
  //       res.status(500).json({ nessage: "Erro ao salvar a imagem", err });
  //     }
  //   });

  //   app.use(express.json());
}

module.exports = { configureRoutes };
