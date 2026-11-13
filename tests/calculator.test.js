"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateBudget, validateEntry } = require("../js/calculator.js");
const { formatCLP, formatPercent, parsePositiveInt } = require("../js/formatters.js");

test("presupuesto con saldo positivo y capacidad de ahorro", () => {
  const res = calculateBudget(
    [{ descripcion: "Sueldo", monto: 600000 }],
    [
      { descripcion: "Arriendo", monto: 250000, tipo: "fijo", es_hormiga: false },
      { descripcion: "Supermercado", monto: 100000, tipo: "variable", es_hormiga: false },
      { descripcion: "Café", monto: 20000, tipo: "variable", es_hormiga: true },
    ]
  );

  assert.equal(res.total_ingresos, 600000);
  assert.equal(res.total_fijos, 250000);
  assert.equal(res.total_variables, 120000);
  assert.equal(res.total_hormiga, 20000);
  assert.equal(res.total_gastos, 370000);
  assert.equal(res.balance_neto, 230000);
  assert.equal(res.estado_presupuesto, "positivo");
  assert.equal(res.porcentaje_fijos, 41.7);
  assert.equal(res.porcentaje_variables, 20);
  assert.deepEqual(res.capacidad_ahorro, {
    monto_maximo: 230000,
    porcentaje_ingreso: 38.3,
  });
});

test("presupuesto en equilibrio exacto (balance_neto == 0)", () => {
  const res = calculateBudget(
    [{ descripcion: "Beca", monto: 300000 }],
    [
      { descripcion: "Pieza", monto: 200000, tipo: "fijo", es_hormiga: false },
      { descripcion: "Comida", monto: 100000, tipo: "variable", es_hormiga: false },
    ]
  );

  assert.equal(res.balance_neto, 0);
  assert.equal(res.estado_presupuesto, "equilibrado");
  assert.deepEqual(res.capacidad_ahorro, {
    monto_maximo: 0,
    porcentaje_ingreso: 0,
  });
});

test("presupuesto en déficit / sobregiro", () => {
  const res = calculateBudget(
    [{ descripcion: "Freelance", monto: 200000 }],
    [
      { descripcion: "Arriendo", monto: 180000, tipo: "fijo", es_hormiga: false },
      { descripcion: "Salidas", monto: 55000, tipo: "variable", es_hormiga: true },
    ]
  );

  assert.equal(res.balance_neto, -35000);
  assert.equal(res.estado_presupuesto, "deficit");
  assert.deepEqual(res.capacidad_ahorro, {
    monto_maximo: 0,
    porcentaje_ingreso: 0,
  });
});

test("cálculo con ingresos en $0 evita división por cero", () => {
  const res = calculateBudget(
    [],
    [{ descripcion: "Snack", monto: 5000, tipo: "variable", es_hormiga: true }]
  );

  assert.equal(res.total_ingresos, 0);
  assert.equal(res.total_gastos, 5000);
  assert.equal(res.balance_neto, -5000);
  assert.equal(res.porcentaje_fijos, 0);
  assert.equal(res.porcentaje_variables, 0);
  assert.equal(res.porcentaje_hormiga, 100);
  assert.equal(res.capacidad_ahorro.porcentaje_ingreso, 0);
});

test("suma correcta de gastos fijos, variables y hormiga (incluyendo fijo hormiga)", () => {
  const res = calculateBudget(
    [{ descripcion: "Sueldo", monto: 500000 }],
    [
      { descripcion: "Suscripción app", monto: 5000, tipo: "fijo", es_hormiga: true },
      { descripcion: "Internet", monto: 25000, tipo: "fijo", es_hormiga: false },
      { descripcion: "Delivery", monto: 15000, tipo: "variable", es_hormiga: true },
    ]
  );

  assert.equal(res.total_fijos, 30000);
  assert.equal(res.total_variables, 15000);
  assert.equal(res.total_hormiga, 20000);
  assert.equal(res.total_gastos, 45000);
});

test("validación y formateo CLP", () => {
  assert.equal(formatCLP(450000), "$450.000");
  assert.equal(formatCLP(-35000), "-$35.000");
  assert.equal(formatCLP(0), "$0");
  assert.equal(formatPercent(38.34), "38,3%");
  assert.equal(parsePositiveInt("150.000"), 150000);
  assert.equal(parsePositiveInt("0"), null);
  assert.equal(parsePositiveInt("-500"), null);
  assert.equal(parsePositiveInt("12.5"), null);
  assert.equal(parsePositiveInt("12,5"), null);

  assert.equal(validateEntry("A", "1000").valid, false);
  assert.equal(validateEntry("Sueldo", "0").valid, false);
  assert.equal(validateEntry("Café", "2500", { requireType: true, type: "" }).valid, false);
  assert.equal(validateEntry("Café", "2.500", { requireType: true, type: "variable" }).valid, true);
});
