"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

function createMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

globalThis.localStorage = createMockStorage();
const { STORAGE_KEY, loadBudget, saveBudget } = require("../js/storage.js");

test("loadBudget con localStorage vacío retorna listas vacías", () => {
  globalThis.localStorage = createMockStorage();
  assert.deepEqual(loadBudget(), { ingresos: [], gastos: [] });
});

test("loadBudget con JSON corrupto o no objeto retorna listas vacías sin lanzar error", () => {
  for (const raw of ["{bad", "null", "123", '"texto"']) {
    globalThis.localStorage = createMockStorage({ [STORAGE_KEY]: raw });
    assert.deepEqual(loadBudget(), { ingresos: [], gastos: [] });
  }
});

test("loadBudget filtra entradas inválidas y normaliza descripción, tipo y es_hormiga", () => {
  const longDesc = "x".repeat(80);
  const payload = {
    ingresos: [
      null,
      { id: "i1", descripcion: "   ", monto: 10000 },
      { id: "i2", descripcion: "Negativo", monto: -500 },
      { id: "i3", descripcion: "Cero", monto: 0 },
      { id: "i4", descripcion: "NaN", monto: "no-num" },
      { id: "i5", descripcion: "Infinito", monto: Infinity },
      { id: "i6", descripcion: " " + longDesc + " ", monto: 250000.9 },
    ],
    gastos: [
      undefined,
      { id: "g1", descripcion: "Inválido", monto: -100, tipo: "fijo", es_hormiga: true },
      { id: "g2", descripcion: "Café", monto: 3500, tipo: "desconocido", es_hormiga: "si" },
      { id: "g3", descripcion: "Arriendo", monto: 300000, tipo: "fijo", es_hormiga: true },
    ],
  };
  globalThis.localStorage = createMockStorage({ [STORAGE_KEY]: JSON.stringify(payload) });

  const loaded = loadBudget();
  assert.deepEqual(loaded, {
    ingresos: [{ id: "i6", descripcion: "x".repeat(60), monto: 250000 }],
    gastos: [
      { id: "g2", descripcion: "Café", monto: 3500, tipo: "variable", es_hormiga: false },
      { id: "g3", descripcion: "Arriendo", monto: 300000, tipo: "fijo", es_hormiga: true },
    ],
  });
});

test("saveBudget retorna true al guardar y false cuando localStorage.setItem falla", () => {
  const mock = createMockStorage();
  globalThis.localStorage = mock;

  const data = { ingresos: [{ id: "1", descripcion: "Sueldo", monto: 500000 }], gastos: [] };
  assert.equal(saveBudget(data), true);
  assert.equal(mock.getItem(STORAGE_KEY), JSON.stringify(data));

  globalThis.localStorage = {
    setItem() {
      const err = new Error("Quota exceeded");
      err.name = "QuotaExceededError";
      throw err;
    },
  };
  assert.equal(saveBudget(data), false);
});
