const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token não fornecido"
    });
  }

  try {
    const payload = jwt.verify(
      auth.slice(7),
      JWT_SECRET
    );

    req.user = payload;

    next();

  } catch {
    return res.status(401).json({
      error: "Token inválido ou expirado"
    });
  }
}

module.exports = authMiddleware;