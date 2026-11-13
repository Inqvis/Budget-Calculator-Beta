(function () {
  "use strict";

  var calc = window.BudgetCalculator;
  var fmt = window.BudgetFormatters;
  var store = window.BudgetStorage;

  var state = store.loadBudget();

  var els = {
    incomeForm: document.getElementById("income-form"),
    incomeDesc: document.getElementById("income-desc"),
    incomeAmount: document.getElementById("income-amount"),
    incomeDescErr: document.getElementById("income-desc-error"),
    incomeAmountErr: document.getElementById("income-amount-error"),

    expenseForm: document.getElementById("expense-form"),
    expenseDesc: document.getElementById("expense-desc"),
    expenseAmount: document.getElementById("expense-amount"),
    expenseHormiga: document.getElementById("expense-hormiga"),
    expenseDescErr: document.getElementById("expense-desc-error"),
    expenseAmountErr: document.getElementById("expense-amount-error"),
    expenseTypeErr: document.getElementById("expense-type-error"),

    totalIngresos: document.getElementById("total-ingresos"),
    ingresosCount: document.getElementById("ingresos-count"),
    totalGastos: document.getElementById("total-gastos"),
    gastosBreakdown: document.getElementById("gastos-breakdown"),
    balanceCard: document.getElementById("balance-card"),
    balanceNeto: document.getElementById("balance-neto"),
    estadoLabel: document.getElementById("estado-label"),

    overdraftAlert: document.getElementById("overdraft-alert"),
    hormigaAlert: document.getElementById("hormiga-alert"),

    ahorroMonto: document.getElementById("ahorro-monto"),
    ahorroPorcentaje: document.getElementById("ahorro-porcentaje"),
    ahorroNota: document.getElementById("ahorro-nota"),

    barFijos: document.getElementById("bar-fijos"),
    barVariables: document.getElementById("bar-variables"),
    barSaldo: document.getElementById("bar-saldo"),
    legendFijos: document.getElementById("legend-fijos"),
    legendVariables: document.getElementById("legend-variables"),
    legendSaldo: document.getElementById("legend-saldo"),

    incomeList: document.getElementById("income-list"),
    expenseList: document.getElementById("expense-list"),
    listTotalIngresos: document.getElementById("list-total-ingresos"),
    listTotalGastos: document.getElementById("list-total-gastos"),

    btnPrint: document.getElementById("btn-print"),
    btnClear: document.getElementById("btn-clear"),
    printDate: document.getElementById("print-date"),
  };

  function makeId() {
    return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function clearErrors(pairs) {
    for (var i = 0; i < pairs.length; i++) {
      pairs[i][0].textContent = "";
      if (pairs[i][1]) pairs[i][1].removeAttribute("aria-invalid");
    }
  }

  function showError(errEl, inputEl, message) {
    errEl.textContent = message || "";
    if (inputEl) {
      if (message) inputEl.setAttribute("aria-invalid", "true");
      else inputEl.removeAttribute("aria-invalid");
    }
  }

  function renderTableRows(tbody, items, colSpan, emptyText, rowBuilder) {
    tbody.textContent = "";
    if (items.length === 0) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = colSpan;
      emptyCell.className = "empty-row";
      emptyCell.textContent = emptyText;
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    for (var i = 0; i < items.length; i++) {
      tbody.appendChild(rowBuilder(items[i]));
    }
  }

  function createDeleteButton(type, id, label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-delete";
    btn.dataset.deleteType = type;
    btn.dataset.deleteId = id;
    btn.setAttribute("aria-label", "Eliminar " + label);
    btn.textContent = "Eliminar";
    return btn;
  }

  function render() {
    var summary = calc.calculateBudget(state.ingresos, state.gastos);

    els.totalIngresos.textContent = fmt.formatCLP(summary.total_ingresos);
    els.ingresosCount.textContent =
      state.ingresos.length + (state.ingresos.length === 1 ? " registro" : " registros");

    els.totalGastos.textContent = fmt.formatCLP(summary.total_gastos);
    els.gastosBreakdown.textContent =
      "Fijos: " +
      fmt.formatCLP(summary.total_fijos) +
      " · Variables: " +
      fmt.formatCLP(summary.total_variables);

    els.balanceCard.dataset.state = summary.estado_presupuesto;
    els.balanceNeto.textContent = fmt.formatCLP(summary.balance_neto);
    if (summary.estado_presupuesto === "positivo") {
      els.estadoLabel.textContent = "Saldo positivo";
    } else if (summary.estado_presupuesto === "deficit") {
      els.estadoLabel.textContent = "Déficit / Sobregiro";
    } else {
      els.estadoLabel.textContent = "Presupuesto equilibrado";
    }

    if (summary.balance_neto < 0) {
      els.overdraftAlert.hidden = false;
      els.overdraftAlert.textContent =
        "Atención: tus gastos superan tus ingresos en " +
        fmt.formatCLP(Math.abs(summary.balance_neto)) +
        ".";
    } else {
      els.overdraftAlert.hidden = true;
      els.overdraftAlert.textContent = "";
    }

    if (summary.total_hormiga > 0) {
      els.hormigaAlert.hidden = false;
      els.hormigaAlert.textContent =
        "Gastos hormiga del mes: " +
        fmt.formatCLP(summary.total_hormiga) +
        " (" +
        fmt.formatPercent(summary.porcentaje_hormiga) +
        " del gasto total).";
    } else {
      els.hormigaAlert.hidden = true;
      els.hormigaAlert.textContent = "";
    }

    els.ahorroMonto.textContent = fmt.formatCLP(summary.capacidad_ahorro.monto_maximo);
    els.ahorroPorcentaje.textContent =
      fmt.formatPercent(summary.capacidad_ahorro.porcentaje_ingreso) + " del ingreso";
    if (summary.balance_neto > 0) {
      els.ahorroNota.textContent =
        "Monto máximo ahorrable este mes manteniendo tus gastos cubiertos.";
    } else if (summary.balance_neto < 0) {
      els.ahorroNota.textContent =
        "Actualmente estás en déficit; no hay saldo disponible para ahorro.";
    } else if (summary.total_ingresos === 0 && summary.total_gastos === 0) {
      els.ahorroNota.textContent =
        "Ingresa tus ingresos y gastos para calcular tu monto máximo ahorrable.";
    } else {
      els.ahorroNota.textContent =
        "Tus ingresos cubren exactamente tus gastos ($0 disponible para ahorrar).";
    }

    var saldoPositivo = Math.max(0, summary.balance_neto);
    var base = Math.max(summary.total_ingresos, summary.total_gastos, 1);
    var hasAny = summary.total_ingresos > 0 || summary.total_gastos > 0;
    els.barFijos.style.width = hasAny ? (summary.total_fijos / base) * 100 + "%" : "0%";
    els.barVariables.style.width = hasAny ? (summary.total_variables / base) * 100 + "%" : "0%";
    els.barSaldo.style.width = hasAny ? (saldoPositivo / base) * 100 + "%" : "0%";

    els.legendFijos.textContent =
      fmt.formatCLP(summary.total_fijos) + " (" + fmt.formatPercent(summary.porcentaje_fijos) + ")";
    els.legendVariables.textContent =
      fmt.formatCLP(summary.total_variables) +
      " (" +
      fmt.formatPercent(summary.porcentaje_variables) +
      ")";
    els.legendSaldo.textContent =
      fmt.formatCLP(saldoPositivo) +
      " (" +
      fmt.formatPercent(summary.capacidad_ahorro.porcentaje_ingreso) +
      ")";

    els.listTotalIngresos.textContent = fmt.formatCLP(summary.total_ingresos);
    els.listTotalGastos.textContent = fmt.formatCLP(summary.total_gastos);

    renderTableRows(
      els.incomeList,
      state.ingresos,
      3,
      "Aún no has agregado ingresos.",
      function (item) {
        var tr = document.createElement("tr");
        var tdDesc = document.createElement("td");
        tdDesc.textContent = item.descripcion;

        var tdAmt = document.createElement("td");
        tdAmt.className = "col-amount";
        tdAmt.textContent = fmt.formatCLP(item.monto);

        var tdAct = document.createElement("td");
        tdAct.className = "col-action no-print";
        tdAct.appendChild(createDeleteButton("ingreso", item.id, item.descripcion));

        tr.appendChild(tdDesc);
        tr.appendChild(tdAmt);
        tr.appendChild(tdAct);
        return tr;
      }
    );

    renderTableRows(
      els.expenseList,
      state.gastos,
      4,
      "Aún no has agregado gastos.",
      function (item) {
        var tr = document.createElement("tr");
        var tdDesc = document.createElement("td");
        tdDesc.textContent = item.descripcion;

        var tdBadges = document.createElement("td");
        var typeBadge = document.createElement("span");
        typeBadge.className =
          "badge " + (item.tipo === "fijo" ? "badge-fijo" : "badge-variable");
        typeBadge.textContent = item.tipo === "fijo" ? "Fijo" : "Variable";
        tdBadges.appendChild(typeBadge);

        if (item.es_hormiga) {
          var antBadge = document.createElement("span");
          antBadge.className = "badge badge-hormiga";
          antBadge.textContent = "Hormiga";
          tdBadges.appendChild(antBadge);
        }

        var tdAmt = document.createElement("td");
        tdAmt.className = "col-amount";
        tdAmt.textContent = fmt.formatCLP(item.monto);

        var tdAct = document.createElement("td");
        tdAct.className = "col-action no-print";
        tdAct.appendChild(createDeleteButton("gasto", item.id, item.descripcion));

        tr.appendChild(tdDesc);
        tr.appendChild(tdBadges);
        tr.appendChild(tdAmt);
        tr.appendChild(tdAct);
        return tr;
      }
    );
  }

  function updateAndRender() {
    store.saveBudget(state);
    render();
  }

  els.incomeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors([
      [els.incomeDescErr, els.incomeDesc],
      [els.incomeAmountErr, els.incomeAmount],
    ]);

    var check = calc.validateEntry(els.incomeDesc.value, els.incomeAmount.value);
    if (!check.valid) {
      showError(els.incomeDescErr, els.incomeDesc, check.errors.description);
      showError(els.incomeAmountErr, els.incomeAmount, check.errors.amount);
      return;
    }

    state.ingresos.push({
      id: makeId(),
      descripcion: check.description,
      monto: check.amount,
    });
    els.incomeForm.reset();
    els.incomeDesc.focus();
    updateAndRender();
  });

  els.expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors([
      [els.expenseDescErr, els.expenseDesc],
      [els.expenseAmountErr, els.expenseAmount],
      [els.expenseTypeErr, null],
    ]);

    var selectedType = els.expenseForm.querySelector('input[name="tipo"]:checked');
    var tipo = selectedType ? selectedType.value : "";

    var check = calc.validateEntry(els.expenseDesc.value, els.expenseAmount.value, {
      requireType: true,
      type: tipo,
    });
    if (!check.valid) {
      showError(els.expenseDescErr, els.expenseDesc, check.errors.description);
      showError(els.expenseAmountErr, els.expenseAmount, check.errors.amount);
      showError(els.expenseTypeErr, null, check.errors.type);
      return;
    }

    state.gastos.push({
      id: makeId(),
      descripcion: check.description,
      monto: check.amount,
      tipo: tipo,
      es_hormiga: els.expenseHormiga.checked,
    });
    els.expenseDesc.value = "";
    els.expenseAmount.value = "";
    els.expenseHormiga.checked = false;
    els.expenseDesc.focus();
    updateAndRender();
  });

  function handleTableDelete(event) {
    var btn = event.target.closest("[data-delete-id]");
    if (!btn) return;
    var id = btn.dataset.deleteId;
    var type = btn.dataset.deleteType;
    if (type === "ingreso") {
      state.ingresos = state.ingresos.filter(function (item) {
        return item.id !== id;
      });
    } else if (type === "gasto") {
      state.gastos = state.gastos.filter(function (item) {
        return item.id !== id;
      });
    }
    updateAndRender();
  }

  els.incomeList.addEventListener("click", handleTableDelete);
  els.expenseList.addEventListener("click", handleTableDelete);

  els.btnClear.addEventListener("click", function () {
    if (state.ingresos.length === 0 && state.gastos.length === 0) return;
    if (!window.confirm("¿Seguro que quieres borrar todos los ingresos y gastos?")) return;
    state = store.clearBudget();
    render();
  });

  els.btnPrint.addEventListener("click", function () {
    window.BudgetPDF.download(state, calc.calculateBudget(state.ingresos, state.gastos));
  });

  render();
})();
