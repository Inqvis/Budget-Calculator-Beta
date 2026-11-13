(function (root) {
  "use strict";

  var fmt = root.BudgetFormatters;

  function formatDateFile(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function download(state, summary) {
    var jsPDF = root.jspdf && root.jspdf.jsPDF;
    if (!jsPDF) {
      root.alert("No se pudo cargar el generador de PDF. Verifica tu conexión a internet.");
      return;
    }

    var doc = new jsPDF({ unit: "mm", format: "a4" });
    var margin = 15;
    var pageWidth = doc.internal.pageSize.getWidth();
    var maxWidth = pageWidth - margin * 2;
    var y = 18;

    function ensureSpace(needed) {
      if (y + needed > 280) {
        doc.addPage();
        y = 18;
      }
    }

    function drawRow(leftText, midText, rightText, bold) {
      ensureSpace(7);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9.5);
      var desc = doc.splitTextToSize(leftText, midText ? 88 : 135);
      doc.text(desc[0], margin + 2, y);
      if (midText) {
        doc.text(midText, margin + 94, y);
      }
      doc.text(rightText, pageWidth - margin - 2, y, { align: "right" });
      y += 6;
      doc.setDrawColor(210);
      doc.line(margin, y - 4, pageWidth - margin, y - 4);
    }

    var now = new Date();
    doc.setTextColor(17, 17, 17);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Resumen de Presupuesto Mensual — Budget Calculator", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "Fecha de emisión: " +
        now.toLocaleDateString("es-CL") +
        " " +
        now.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
      margin,
      y
    );
    y += 4;
    doc.setDrawColor(17);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Resumen ejecutivo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Resumen Ejecutivo", margin, y);
    y += 6;

    var estadoTexto =
      summary.estado_presupuesto === "positivo"
        ? "Saldo positivo"
        : summary.estado_presupuesto === "deficit"
          ? "Déficit / Sobregiro"
          : "Presupuesto equilibrado";

    var resumenFilas = [
      ["Total Ingresos", fmt.formatCLP(summary.total_ingresos)],
      [
        "Total Gastos Fijos",
        fmt.formatCLP(summary.total_fijos) + " (" + fmt.formatPercent(summary.porcentaje_fijos) + ")",
      ],
      [
        "Total Gastos Variables",
        fmt.formatCLP(summary.total_variables) +
          " (" +
          fmt.formatPercent(summary.porcentaje_variables) +
          ")",
      ],
      ["Total Gastos", fmt.formatCLP(summary.total_gastos)],
      [
        "Total Gastos Hormiga",
        fmt.formatCLP(summary.total_hormiga) +
          " (" +
          fmt.formatPercent(summary.porcentaje_hormiga) +
          " del gasto)",
      ],
      ["Balance Neto (" + estadoTexto + ")", fmt.formatCLP(summary.balance_neto)],
      [
        "Capacidad de Ahorro",
        fmt.formatCLP(summary.capacidad_ahorro.monto_maximo) +
          " (" +
          fmt.formatPercent(summary.capacidad_ahorro.porcentaje_ingreso) +
          " del ingreso)",
      ],
    ];

    doc.setLineWidth(0.2);
    for (var r = 0; r < resumenFilas.length; r++) {
      drawRow(resumenFilas[r][0], null, resumenFilas[r][1], r === 5);
    }

    // Tabla de Ingresos
    y += 6;
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Ingresos Registrados", margin, y);
    y += 6;
    drawRow("Descripción", null, "Monto (CLP)", true);
    if (state.ingresos.length === 0) {
      drawRow("Sin ingresos registrados.", null, "$0", false);
    } else {
      for (var i = 0; i < state.ingresos.length; i++) {
        drawRow(state.ingresos[i].descripcion, null, fmt.formatCLP(state.ingresos[i].monto), false);
      }
    }

    // Tabla de Gastos
    y += 6;
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Gastos Registrados", margin, y);
    y += 6;
    drawRow("Descripción", "Clasificación", "Monto (CLP)", true);
    if (state.gastos.length === 0) {
      drawRow("Sin gastos registrados.", "-", "$0", false);
    } else {
      for (var j = 0; j < state.gastos.length; j++) {
        var g = state.gastos[j];
        var clase = (g.tipo === "fijo" ? "Fijo" : "Variable") + (g.es_hormiga ? " · Hormiga" : "");
        drawRow(g.descripcion, clase, fmt.formatCLP(g.monto), false);
      }
    }

    doc.save("resumen-presupuesto-" + formatDateFile(now) + ".pdf");
  }

  root.BudgetPDF = { download: download };
})(typeof globalThis !== "undefined" ? globalThis : window);
