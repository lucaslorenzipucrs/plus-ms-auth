const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const authMiddleware = require("./middlewares/authMiddleware");
const roleMiddleware = require("./middlewares/roleMiddleware");
require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");

const app = express();
app.use(express.json());
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Plus MS Auth API",
      version: "1.0.0",
      description: "API de autenticação do sistema Plus"
    },

    servers: [
      {
        url: "http://localhost:3001"
      }
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },

    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: [__filename]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Get /docs for swagger
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const PORT = process.env.PORT || 3001;

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
// POST /auth/login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "email e password são obrigatórios" });

  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: "Credenciais inválidas" });

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refresh = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, refresh });
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Gera novo access token usando refresh token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh:
 *                 type: string
 *     responses:
 *       200:
 *         description: Novo token gerado
 *       401:
 *         description: Refresh token inválido
 */
// POST /auth/refresh
app.post("/auth/refresh", (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: "refresh token obrigatório" });

  try {
    const payload = jwt.verify(refresh, JWT_SECRET);
    const token = jwt.sign({ sub: payload.sub }, JWT_SECRET, { expiresIn: "15m" });
    res.json({ token });
  } catch {
    res.status(401).json({ error: "Refresh token inválido ou expirado" });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realiza logout do usuário
 *     tags:
 *       - Auth
 *     responses:
 *       204:
 *         description: Logout realizado com sucesso
 */
// POST /auth/logout
app.post("/auth/logout", (_req, res) => {
  // Stateless: em produção invalidar o refresh token no banco
  res.status(204).send();
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Retorna dados do usuário autenticado
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *       401:
 *         description: Token inválido ou expirado
 */
// GET /auth/me
app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.sub,
    email: req.user.email,
    role: req.user.role
  });
});

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Área restrita para administradores
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Acesso permitido
 *       403:
 *         description: Acesso negado
 */
// GET /admin
app.get("/admin", authMiddleware, roleMiddleware("ADMIN"), (req, res) => {
    res.json({
      message: "Área admin liberada"
    });
  }
);

app.listen(PORT, () => console.log(`plus-ms-auth rodando na porta ${PORT}`));
