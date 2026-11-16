(function (root) {
  "use strict";

  var STORAGE_KEY = "budget_calculator_data_v1";

  function emptyState() {
    return { ingresos: [], gastos: [] };
  }

  function normalizeList(items, isExpense) {
    if (!Array.isArray(items)) return [];
    var clean = [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || typeof item !== "object") continue;
      var rawMonto = Number(item.monto);
      if (!Number.isFinite(rawMonto)) continue;
      var monto = Math.trunc(rawMonto);
      var desc = String(item.descripcion || "").trim().slice(0, 60);
      if (!desc || !Number.isSafeInteger(monto) || monto <= 0) continue;
      var entry = {
        id: String(item.id || Date.now() + "_" + i),
        descripcion: desc,
        monto: monto,
      };
      if (isExpense) {
        entry.tipo = item.tipo === "fijo" ? "fijo" : "variable";
        entry.es_hormiga = item.es_hormiga === true;
      }
      clean.push(entry);
    }
    return clean;
  }

  function loadBudget() {
    try {
      var raw = root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return emptyState();
      return {
        ingresos: normalizeList(parsed.ingresos, false),
        gastos: normalizeList(parsed.gastos, true),
      };
    } catch (_err) {
      return emptyState();
    }
  }

  function saveBudget(data) {
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (err) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("No se pudo guardar el presupuesto en localStorage:", err);
      }
      return false;
    }
  }

  var api = {
    STORAGE_KEY: STORAGE_KEY,
    loadBudget: loadBudget,
    saveBudget: saveBudget,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BudgetStorage = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
