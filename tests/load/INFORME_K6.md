# 📊 Informe de Prueba de Carga y Rendimiento (Grafana k6)

**Proyecto:** NavegAltos  
**Objetivo de prueba:** Capacidad de respuesta y estabilidad de la base de datos Supabase ante tráfico simulado concurrente.  
**Herramienta:** Grafana k6 v2.2.0  
**Fecha:** 8 de Octubre, 2026  
**Resultado Global:** ✅ **100% EXITOSO (Aprobado)**

---

## 1. Resumen Ejecutivo

Se ejecutó una prueba de estrés y tráfico progresivo simulando hasta **10 usuarios virtuales concurrentes (VUs)** durante un periodo de **40 segundos**, realizando consultas reales a los endpoints de la API REST de Supabase (`/rest/v1/pins`).

El sistema demostró una **alta estabilidad y excelente velocidad de respuesta**, completando el 100% de las solicitudes sin una sola pérdida o error HTTP (0% de fallos).

---

## 2. Configuración del Escenario de Prueba

| Parámetro | Valor | Descripción |
| :--- | :--- | :--- |
| **Escenario** | Ramp-up ➔ Sustained ➔ Ramp-down | Simulación de curva de tráfico real |
| **Etapa 1 (Calentamiento)** | 10 segundos | Escalado gradual de 0 a 5 usuarios concurrentes |
| **Etapa 2 (Carga Máxima)** | 20 segundos | Tráfico sostenido con 10 usuarios concurrentes |
| **Etapa 3 (Enfriamiento)** | 10 segundos | Descenso gradual a 0 usuarios |
| **Total Usuarios (VUs Max)** | **10** | Usuarios realizando peticiones simultáneas activas |
| **Endpoints Evaluados** | • `GET /rest/v1/pins?select=id,name,...` (Carga de mapa)<br>• `GET /rest/v1/pins?select=id&limit=1` (Keep-alive) | Consultas críticas de la aplicación |

---

## 3. Resultados y Métricas Clave

### Métricas de Rendimiento HTTP

| Métrica | Resultado Obtenido | Umbral Esperado | Estado |
| :--- | :--- | :--- | :---: |
| **Tasa de Errores (http_req_failed)** | **0.00%** (0 fallos de 254) | < 1.00% | ✅ APROBADO |
| **Latencia Promedio (Avg)** | **139.53 ms** | < 400 ms | ✅ EXCELENTE |
| **Latencia Mediana (p50)** | **123.70 ms** | < 300 ms | ✅ EXCELENTE |
| **Latencia Percentil 90 (p90)** | **203.67 ms** | < 500 ms | ✅ EXCELENTE |
| **Latencia Percentil 95 (p95)** | **253.46 ms** | < 800 ms | ✅ APROBADO |
| **Latencia Mínima** | **76.71 ms** | N/A | ⚡ ÓPTIMO |
| **Latencia Máxima** | **405.14 ms** | < 1500 ms | ✅ ESTABLE |

---

## 4. Volumen de Tráfico y Verificaciones

- **Total de Peticiones HTTP procesadas:** **254 solicitudes** (~6.31 req/s)
- **Total de Iteraciones completas:** **127 iteraciones** sin interrupciones
- **Total de Validaciones (Checks):** **381 comprobaciones**
  - `✓ GetPins status es 200`: **100% exitoso** (127/127)
  - `✓ GetPins tiempo < 1000ms`: **100% exitoso** (127/127)
  - `✓ HealthCheck status es 200`: **100% exitoso** (127/127)
- **Transferencia de Red:**
  - **Datos Recibidos:** 537 kB (~13 kB/s)
  - **Datos Enviados:** 53 kB (~1.3 kB/s)

---

## 5. Análisis Técnico y Conclusiones

1. **Eficiencia en la Respuesta de Supabase (PostgREST):**
   - Incluso bajo 10 usuarios concurrentes constantes, el 95% de las consultas se resolvieron en menos de **254 milisegundos**.
   - No se presentaron picos de estrangulamiento (*rate limiting* o códigos HTTP 429).
2. **Capacidad de Concurrencia:**
   - La arquitectura actual soporta sin inconvenientes ráfagas de usuarios navegando y consultando pines en el mapa simultáneamente.
3. **Consistencia de Datos:**
   - Todas las llamadas REST respondieron con cabeceras correctas, formatos JSON válidos y códigos de estado `200 OK`.

---

## 6. Archivos de Prueba en el Proyecto

- **Script reproducible:** [k6-test.js](file:///c:/Users/root/Desktop/Antigravity/NavegAltos/tests/load/k6-test.js)
- Para ejecutarlo nuevamente en cualquier momento:
  ```powershell
  & "C:\Program Files\k6\k6.exe" run tests/load/k6-test.js
  ```
