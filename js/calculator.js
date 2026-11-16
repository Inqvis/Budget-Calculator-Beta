(function (root) {
  "use strict";

  var formatters =
    root.BudgetFormatters ||
    (typeof require === "function" ? require("./formatters.js") : null);

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function validateEntry(description, amount, options) {
    var errors = {};
    var desc = String(description == null ? "" : description).trim();
    if (desc.length < 2 || desc.length > 60) {
      errors.description = "Ingresa una descripción entre 2 y 60 caracteres.";
    }

    var parsed = formatters ? formatters.parsePositiveInt(amount) : null;
    if (parsed === null) {
      errors.amount = "Ingresa un monto entero positivo mayor a $0.";
    }

    if (options && options.requireType) {
      if (options.type !== "fijo" && options.type !== "variable") {
        errors.type = "Selecciona si el gasto es fijo o variable.";
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
      description: desc,
      amount: parsed,
    };
  }

  function toValidAmount(item) {
    if (!item || typeof item !== "object") return 0;
    var raw = Number(item.monto);
    if (!Number.isFinite(raw)) return 0;
    var monto = Math.trunc(raw);
    return Number.isSafeInteger(monto) && monto > 0 ? monto : 0;
  }

  function calculateBudget(ingresos, gastos) {
    var incomeList = Array.isArray(ingresos) ? ingresos : [];
    var expenseList = Array.isArray(gastos) ? gastos : [];

    var totalIngresos = 0;
    for (var i = 0; i < incomeList.length; i++) {
      totalIngresos += toValidAmount(incomeList[i]);
    }

    var totalFijos = 0;
    var totalVariables = 0;
    var totalHormiga = 0;
    for (var j = 0; j < expenseList.length; j++) {
      var g = expenseList[j];
      var monto = toValidAmount(g);
      if (monto <= 0) continue;
      if (g.tipo === "fijo") {
        totalFijos += monto;
      } else if (g.tipo === "variable") {
        totalVariables += monto;
      } else {
        continue;
      }
      if (g.es_hormiga === true) {
        totalHormiga += monto;
      }
    }

    var totalGastos = totalFijos + totalVariables;
    var balanceNeto = totalIngresos - totalGastos;

    var estadoPresupuesto = "equilibrado";
    if (balanceNeto > 0) {
      estadoPresupuesto = "positivo";
    } else if (balanceNeto < 0) {
      estadoPresupuesto = "deficit";
    }

    var porcentajeFijos =
      totalIngresos > 0 ? round1((totalFijos / totalIngresos) * 100) : 0;
    var porcentajeVariables =
      totalIngresos > 0 ? round1((totalVariables / totalIngresos) * 100) : 0;
    var porcentajeHormiga =
      totalGastos > 0 ? round1((totalHormiga / totalGastos) * 100) : 0;

    var montoAhorrable = balanceNeto > 0 ? balanceNeto : 0;
    var porcentajeAhorro =
      balanceNeto > 0 && totalIngresos > 0
        ? round1((balanceNeto / totalIngresos) * 100)
        : 0;

    return {
      total_ingresos: totalIngresos,
      total_fijos: totalFijos,
      total_variables: totalVariables,
      total_hormiga: totalHormiga,
      total_gastos: totalGastos,
      balance_neto: balanceNeto,
      estado_presupuesto: estadoPresupuesto,
      porcentaje_fijos: porcentajeFijos,
      porcentaje_variables: porcentajeVariables,
      porcentaje_hormiga: porcentajeHormiga,
      capacidad_ahorro: {
        monto_maximo: montoAhorrable,
        porcentaje_ingreso: porcentajeAhorro,
      },
    };
  }

  var api = {
    validateEntry: validateEntry,
    calculateBudget: calculateBudget,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BudgetCalculator = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
