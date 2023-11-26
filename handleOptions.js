const handleOptions = (req, res, next) => {
    // Adicione os cabeçalhos necessários para a política CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
  
    // Verifica se a solicitação é OPTIONS
    if (req.method === 'OPTIONS') {
      // Responde com sucesso e encerra a cadeia de middleware
      return res.sendStatus(200);
    }
  
    // Se não for OPTIONS, prossiga para o próximo middleware na cadeia
    next();
  };

module.exports = handleOptions;