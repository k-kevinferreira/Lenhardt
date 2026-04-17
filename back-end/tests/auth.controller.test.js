const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const controllerPath = path.resolve(__dirname, "../src/controllers/auth.controller.js");

function createReq(overrides = {}) {
  return {
    body: {},
    params: {},
    user: { id: 99, email: "root@empresa.com", role: "admin" },
    app: { locals: {} },
    ip: "127.0.0.1",
    cookies: {},
    ...overrides,
  };
}

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    cookie() {
      return this;
    },
    clearCookie() {
      return this;
    },
  };
}

function loadAuthController({
  dbMock,
  bcryptMock = { hash: async () => "hashed-password", compare: async () => true },
  jwtMock = { sign: () => "token", verify: () => ({ id: 1 }) },
  auditMock = { writeAuditLog: async () => {} },
  validationMock = {
    normalizeEmail: (value) => String(value || "").trim().toLowerCase(),
    isValidEmail: (value) => /^\S+@\S+\.\S+$/.test(String(value || "")),
    trimToString: (value) => String(value || "").trim(),
  },
} = {}) {
  const dependencyMap = new Map([
    [path.resolve(__dirname, "../src/config/db.js"), dbMock],
    [path.resolve(__dirname, "../src/utils/audit.js"), auditMock],
    [require.resolve("bcryptjs"), bcryptMock],
    [require.resolve("jsonwebtoken"), jwtMock],
    [path.resolve(__dirname, "../src/utils/validation.js"), validationMock],
  ]);

  const previousEntries = new Map();
  delete require.cache[controllerPath];

  for (const [modulePath, mockExports] of dependencyMap.entries()) {
    previousEntries.set(modulePath, require.cache[modulePath]);
    require.cache[modulePath] = {
      id: modulePath,
      filename: modulePath,
      loaded: true,
      exports: mockExports,
    };
  }

  const controller = require(controllerPath);

  return {
    controller,
    restore() {
      delete require.cache[controllerPath];
      for (const [modulePath, cachedEntry] of previousEntries.entries()) {
        if (cachedEntry) {
          require.cache[modulePath] = cachedEntry;
        } else {
          delete require.cache[modulePath];
        }
      }
    },
  };
}

test("criarAdmin aceita role operador e retorna 201", async () => {
  const { controller, restore } = loadAuthController({
    dbMock: {
      async query(sql) {
        if (sql.includes("SELECT id FROM admins WHERE email")) return [[]];
        if (sql.includes("INSERT INTO admins")) return [{ insertId: 42 }];
        throw new Error(`Query nao mockada: ${sql}`);
      },
    },
  });

  const req = createReq({
    body: { email: "operador@empresa.com", senha: "123456", role: "operador" },
  });
  const res = createRes();

  try {
    await controller.criarAdmin(req, res);
  } finally {
    restore();
  }

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.role, "operador");
  assert.equal(res.body.id, 42);
});

test("alterarStatusAdmin impede desativar o ultimo admin ativo", async () => {
  const { controller, restore } = loadAuthController({
    dbMock: {
      async query(sql) {
        if (sql.includes("SELECT id, ativo, role FROM admins WHERE id")) {
          return [[{ id: 10, ativo: 1, role: "admin" }]];
        }
        if (sql.includes("SELECT COUNT(*) AS total FROM admins")) {
          return [[{ total: 1 }]];
        }
        throw new Error(`Query nao mockada: ${sql}`);
      },
    },
  });

  const req = createReq({
    params: { id: "10" },
    body: { ativo: 0 },
  });
  const res = createRes();

  try {
    await controller.alterarStatusAdmin(req, res);
  } finally {
    restore();
  }

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { message: "Nao e possivel desativar o ultimo admin ativo." });
});

test("alterarRoleAdmin impede auto rebaixamento de admin para operador", async () => {
  const { controller, restore } = loadAuthController({
    dbMock: {
      async query(sql) {
        if (sql.includes("SELECT id, ativo, role FROM admins WHERE id")) {
          return [[{ id: 15, ativo: 1, role: "admin" }]];
        }
        throw new Error(`Query nao mockada: ${sql}`);
      },
    },
  });

  const req = createReq({
    params: { id: "15" },
    body: { role: "operador" },
    user: { id: 15, email: "self@empresa.com", role: "admin" },
  });
  const res = createRes();

  try {
    await controller.alterarRoleAdmin(req, res);
  } finally {
    restore();
  }

  assert.equal(res.statusCode, 409);
  assert.deepEqual(res.body, { message: "Voce nao pode alterar o proprio perfil de acesso." });
});
