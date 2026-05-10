const request = require("supertest");
const { app, pool } = require("../src/index");

describe("Auth API", () => {

  test("deve fazer login com credenciais válidas", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@plus.com",
        password: "admin123"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
  });

  test("deve rejeitar login inválido", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@plus.com",
        password: "senhaerrada"
      });

    expect(response.statusCode).toBe(401);
  });

  test("deve acessar /auth/me com token válido", async () => {

    // Faz login primeiro
    const login = await request(app)
        .post("/auth/login")
        .send({
        email: "admin@plus.com",
        password: "admin123"
        });

    const token = login.body.token;

    const response = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe("admin@plus.com");
    });

    test("deve bloquear /admin sem token", async () => {
    const response = await request(app)
        .get("/admin");

    expect(response.statusCode).toBe(401);
    });

    test("deve permitir acesso ao /admin com role ADMIN", async () => {

    const login = await request(app)
        .post("/auth/login")
        .send({
        email: "admin@plus.com",
        password: "admin123"
        });

    const token = login.body.token;

    const response = await request(app)
        .get("/admin")
        .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    });

    afterAll(async () => {
      await pool.end();
    });
});
