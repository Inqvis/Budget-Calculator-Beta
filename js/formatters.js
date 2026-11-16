(function (root) {
  "use strict";

  function formatCLP(amount) {
    var num = Math.trunc(Number(amount) || 0);
    var sign = num < 0 ? "-" : "";
    var abs = Math.abs(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return sign + "$" + abs;
  }

  function formatPercent(value) {
    var num = Number(value) || 0;
    return (Math.round(num * 10) / 10).toString().replace(".", ",") + "%";
  }

  function parsePositiveInt(raw) {
    var trimmed = String(raw == null ? "" : raw).trim();
    if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+|\d{1,3}(?:,\d{3})+)$/.test(trimmed)) return null;
    var value = Number(trimmed.replace(/[.,]/g, ""));
    if (!Number.isSafeInteger(value) || value <= 0) return null;
    return value;
  }

  var api = {
    formatCLP: formatCLP,
    formatPercent: formatPercent,
    parsePositiveInt: parsePositiveInt,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.BudgetFormatters = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : window);
