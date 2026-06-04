const logger = (req, res, next) => {
    const inicio = Date.now();

    
    res.on('finish', () => {
        const duracao = Date.now() - inicio;
        console.log(`[LOG] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Tempo: ${duracao}ms`);
    });

    next();
};

module.exports = logger;