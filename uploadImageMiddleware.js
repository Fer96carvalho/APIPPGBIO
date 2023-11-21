const multer = require('multer');
require('dotenv').config()


// Configuração do multer (storage, destino e outros)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.PathImg);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    req.uploadFileName = filename;
    cb(null, filename);
  },
});

const upload = multer({ storage });

// Middleware para fazer upload e persistir a imagem no MongoDB
function uploadImageMiddleware(req, res, next) {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Erro ao fazer o upload da imagem.' });
    }

    try {
      const filename = req.uploadFileName;
      const novaImagem = {
        url: filename,
        legenda: req.body.legend
      };
      req.novaImagem = novaImagem;
      next();

    } catch (error) {
      res.status(500).json({ message: 'Erro ao salvar a imagem: ' + error });
    }
  });
}

module.exports = uploadImageMiddleware;
