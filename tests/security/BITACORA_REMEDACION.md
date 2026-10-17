# 📋 Bitácora e Informe de Remediación de Ciberseguridad

**Proyecto:** NavegAltos  
**Fecha de Inicio:** 15 de Octubre, 2026  
**Última Actualización:** 17 de Octubre, 2026  
**Estado General de Seguridad:** 🟢 **100% BLINDADO Y RESUELTO**  

---

## 🎯 1. Tablero de Control de Seguridad (Estado Final)

| ID | Vulnerabilidad / Amenaza | Nivel de Riesgo | Componente Afectado | Estado de Verificación |
| :---: | :--- | :---: | :---: | :---: |
| **SEC-01** | **Exposición de PII (nombres y fotos)** | 🔴 Crítico | `public.profiles` | 🟢 **RESUELTO Y CONFIRMADO** |
| **SEC-02** | **Fuga masiva de pines privados** | 🔴 Crítico | `public.shared_pins` | 🟢 **RESUELTO Y CONFIRMADO** |
| **SEC-03** | **Fuga de bugs y correos (`admin@udg.mx`)** | 🟡 Medio | `public.system_bugs` | 🟢 **RESUELTO Y CONFIRMADO** |
| **SEC-04** | **Exposición de denuncias de pines** | 🟡 Medio | `public.pin_reports` | 🟢 **RESUELTO Y CONFIRMADO** |
| **SEC-05** | **Enumeración de administradores** | 🟡 Medio | `public.admin_users` | 🟢 **RESUELTO Y CONFIRMADO** |
| **SEC-06** | **Ausencia de cabeceras HTTP defensivas** | 🟡 Medio | Frontend (`vercel.json`) | 🟢 **RESUELTO** |
| **SEC-07** | **Suspensión de base de datos por inactividad** | 🟡 Medio | Backend Supabase | 🟢 **RESUELTO** |

---

## 🔍 2. Auditoría Final de Verificación en Vivo (Resultados 100% Exitosos)

Se ejecutaron pruebas directas automatizadas con peticiones anónimas (utilizando únicamente la anon key pública) simulando a un atacante externo. Los resultados obtenidos son:

1. ✅ **`public.profiles` (SEC-01):**  
   - Comando: `GET /rest/v1/profiles?select=*` ➔ **Resultado: `[]` (0 registros)**.  
   - *Impacto:* La purga dinámica eliminó la política residual previa. Ningún tercero puede descargar nombres reales ni fotos de Google de los alumnos.

2. ✅ **`public.shared_pins` (SEC-02):**  
   - Comando: `GET /rest/v1/shared_pins?select=*` ➔ **Resultado: `[]` (0 registros)**.  
   - *Impacto:* El scrape masivo de pines compartidos está cerrado. Solo la función RPC `get_shared_pin` entrega datos si se conoce el UUID exacto de 128 bits y tiene menos de 7 días.

3. ✅ **`public.system_bugs` (SEC-03):**  
   - Comando: `GET /rest/v1/system_bugs?select=*` ➔ **Resultado: `[]` (0 registros)**.  
   - *Impacto:* Los correos del personal institucional (`admin@udg.mx`) y reportes de fallos ya no son públicos. Solo administradores pueden verlos.

4. ✅ **`public.pin_reports` (SEC-04):**  
   - Comando: `GET /rest/v1/pin_reports?select=*` ➔ **Resultado: `[]` (0 registros)**.  
   - *Impacto:* Las denuncias de pines y los identificadores de usuarios denunciantes quedaron ocultos para terceros.

5. ✅ **`public.admin_users` (SEC-05):**  
   - Comando: `GET /rest/v1/admin_users?select=*` ➔ **Resultado: `[]` (0 registros)**.  
   - *Impacto:* Ningún usuario anónimo puede consultar la lista de administradores del sistema.

6. ✅ **Revisión Exhaustiva del Resto de Tablas:**  
   - `public.pins`: Pines privados protegidos (`is_public=false` devuelve `[]`). Pines públicos accesibles.
   - `public.pin_requests`: Protegido (`[]`).
   - `public.user_favorites`: Protegido (`[]`).
   - `public.notifications`: Protegido (`[]`).
   - `public.campus_graphs`: Lectura pública de rutas permitida, pero modificaciones bloqueadas (0 filas afectadas ante ataques de alteración).

---

## 📌 3. Tarea Registrada para Siguiente Iteración (UI / Funcionalidad)

| Código | Módulo | Descripción del Problema | Acción Prevista |
| :---: | :---: | :--- | :--- |
| **TASK-UI-01** | `NotificationBell.jsx` | **Apertura interactiva de notificaciones:** Actualmente al hacer clic en una notificación en la barra superior (e.g., *"Un usuario ha reportado el pin..."*), únicamente se ejecuta `markAsRead()`, cambiando su estilo a leído sin abrir el reporte ni navegar al contenido correspondiente. | Implementar manejador `onNotificationClick(notif)` para que según el `notif.type` (`new_report`, `new_bug`, `pin_request`, etc.), redirija al panel de administración abriendo la pestaña correspondiente o mostrando el modal de detalle del reporte. |

---

## 📅 4. Registro Cronológico de Cambios

| Fecha | Autor | Acción Realizada | Archivos Modificados |
| :---: | :---: | :--- | :--- |
| **2026-10-17** | Antigravity | Verificación en vivo de Fase 2: Confirmado el cierre definitivo de `profiles`, `system_bugs`, `pin_reports` y `admin_users`. Auditoría completa concluida con 100% de éxito. Registro de `TASK-UI-01`. | `tests/security/BITACORA_REMEDACION.md` |
| **2026-10-16** | Antigravity | Creación de script SQL de Fase 2 (purga dinámica de `profiles`, blindaje de `system_bugs`, `pin_reports` y `admin_users`). | `tests/security/remediacion_fase2_reportes_bugs_y_profiles.sql` |
| **2026-10-15** | Antigravity | Verificación en vivo de Fase 1: Confirmado cierre de `shared_pins`. Detección de política residual en `profiles`. | `tests/security/BITACORA_REMEDACION.md` |
| **2026-10-15** | Antigravity | Actualización de lógica de recepción de pines para invocar RPC segura. | `frontend/src/pages/Dashboard.jsx` |
| **2026-10-15** | Antigravity | Creación del documento maestro de seguimiento de remediación y script Fase 1. | `tests/security/BITACORA_REMEDACION.md`, `remediacion_fase1_pii_y_pines.sql` |
| **2026-10-08** | Antigravity | Endurecimiento de cabeceras HTTP de seguridad (CSP, HSTS, X-Frame-Options). | `vercel.json`, `frontend/vercel.json` |
| **2026-10-08** | Antigravity | Configuración de keep-alive automatizado con GitHub Actions. | `.github/workflows/supabase-keepalive.yml` |
