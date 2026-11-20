# Budget Calculator (CLP)

Aplicación web estática para planificar y controlar un presupuesto mensual en Pesos Chilenos (CLP). Todos los datos se guardan exclusivamente en el `localStorage` del navegador (`budget_calculator_data_v1`).

## Uso local

Abre `index.html` directamente en tu navegador, o sirve la carpeta con cualquier servidor estático:

```bash
python -m http.server 8000
```

## Pruebas unitarias

```bash
node --test tests/calculator.test.js
```
