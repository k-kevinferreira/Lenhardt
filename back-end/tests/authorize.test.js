const test = require("node:test");
const assert = require("node:assert/strict");

const authorize = require("../src/middleware/authorize");

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
  };
}

test("authorize permite acesso para role autorizada", () => {
  const middleware = authorize("admin");
  const req = { user: { role: "admin" } };
  const res = createRes();
  let called = false;

  middleware(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(res.statusCode, 200);
});

test("authorize bloqueia role sem permissao", () => {
  const middleware = authorize("admin");
  const req = { user: { role: "operador" } };
  const res = createRes();
  let called = false;

  middleware(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: "Voce nao tem permissao para esta acao." });
});
