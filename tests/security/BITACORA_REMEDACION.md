# 📋 Bitácora e Informe de Remediación de Ciberseguridad

**Proyecto:** NavegAltos  
**Fecha de Inicio de Remediación:** 15 de Octubre, 2026  
**Última Actualización:** 15 de Octubre, 2026  
**Estado General:** 🟡 **En Progreso (Fase 1: Vulnerabilidades Críticas)**  

---

## 🎯 1. Tablero de Control de Seguridad

| ID | Vulnerabilidad / Amenaza | Nivel de Riesgo | Componente Afectado | Estado Actual | Fase |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **SEC-01** | **Exposición de PII (nombres y fotos)** | 🔴 Crítico | `public.profiles` | 🟡 **Solución preparada** (SQL listo) | **Fase 1** |
| **SEC-02** | **Fuga masiva de pines privados** | 🔴 Crítico | `public.shared_pins` | 🟡 **Solución preparada** (Código + SQL listo) | **Fase 1** |
| **SEC-03** | Fuga de reportes de bugs y correos (`admin@udg.mx`) | 🟡 Medio | `public.system_bugs` | ⏳ Pendiente | Fase 2 |
| **SEC-04** | Exposición de denuncias de pines | 🟡 Medio | `public.pin_reports` | ⏳ Pendiente | Fase 2 |
| **SEC-05** | Enumeración de administradores | 🟡 Medio | `public.admin_users` | ⏳ Pendiente | Fase 2 |
| **SEC-06** | Ausencia de cabeceras HTTP defensivas | 🟡 Medio | Frontend (`vercel.json`) | 🟢 **RESUELTO** | Completado |
| **SEC-07** | Suspensión de base de datos por inactividad | 🟡 Medio | Backend Supabase | 🟢 **RESUELTO** | Completado |

---

## 🔍 2. Detalle de Vulnerabilidades en Tratamiento (Fase 1)

---

### 🛡️ SEC-01: Exposición de Información de Identificación Personal (PII)

* **Severidad:** 🔴 Alta / Crítica
* **Ubicación:** Tabla `public.profiles` (Supabase PostgreSQL)
* **Vector de Ataque:**  
  Cualquier usuario anónimo con acceso a la clave pública (`anon key`) podía ejecutar una consulta REST directa `GET /rest/v1/profiles?select=*` y descargar la lista completa de todos los alumnos registrados, incluyendo sus nombres completos y fotos de perfil de Google.
* **Causa Raíz:**  
  Ausencia de una política restrictiva en `public.profiles` para el comando `SELECT`, permitiendo lectura sin comprobar la identidad de quien solicita los datos.
* **Acciones Tomadas:**
  1. Se analizó el flujo de la aplicación (`UserProfile.jsx`) y se determinó que **ningún usuario necesita leer perfiles ajenos**. La consulta siempre es para el perfil propio (`where id = session.user.id`).
  2. Se diseñó una política RLS estricta en SQL:
     ```sql
     CREATE POLICY "Usuarios ven unicamente su propio perfil"
     ON public.profiles FOR SELECT
     TO authenticated
     USING (auth.uid() = id);
     ```
  3. Se incluyó en el script de migración [remediacion_fase1_pii_y_pines.sql](file:///c:/Users/root/Desktop/Antigravity/NavegAltos/tests/security/remediacion_fase1_pii_y_pines.sql).
* **Resultado Tras Aplicación:**
  - Peticiones anónimas o sin sesión: Reciben `[]` (cero registros).
  - Peticiones de usuarios autenticados: Solo devuelven la información del usuario en sesión.

---

### 🛡️ SEC-02: Fuga Masiva de Pines Privados Compartidos

* **Severidad:** 🔴 Alta / Crítica
* **Ubicación:** Tabla `public.shared_pins` y endpoint REST de Supabase
* **Vector de Ataque:**  
  Aunque los enlaces compartidos se diseñaron con URLs del tipo `dashboard?shared=<UUID>`, la política original de Supabase contenía `USING (true);`. Esto permitía que un atacante omitiera el parámetro de búsqueda y descargara en lote **todos los pines privados creados por todos los usuarios del campus**.
* **Causa Raíz:**  
  Uso de política permisiva `USING (true)` en la tabla, asumiendo erróneamente que los clientes solo solicitarían registros individuales.
* **Acciones Tomadas:**
  1. **Aislamiento en Base de Datos (RLS):** Se eliminó la política `USING (true)` y se restringió la lectura directa de la tabla únicamente al dueño que compartió el pin (`USING (auth.uid() = shared_by)`).
  2. **Creación de Función RPC Segura (`get_shared_pin`):** Se creó una función almacenada en PostgreSQL (`SECURITY DEFINER`) que:
     - Requiere obligatoriamente el UUID exacto de 128 bits.
     - Invalida y no entrega pines con más de 7 días de antigüedad.
     - Impide el scraping o listado masivo, ya que no permite listar filas sin conocer el identificador exacto.
  3. **Actualización del Frontend ([Dashboard.jsx](file:///c:/Users/root/Desktop/Antigravity/NavegAltos/frontend/src/pages/Dashboard.jsx)):**  
     Se actualizó el código de recepción de enlaces compartidos para invocar `supabase.rpc('get_shared_pin', { pin_id: sharedPinId })` de forma segura, manteniendo compatibilidad con fallback para evitar interrupciones.
* **Resultado Tras Aplicación:**
  - Intentos de listar `GET /rest/v1/shared_pins`: Bloqueados (devuelven `[]`).
  - Usuarios con el enlace legítimo (`?shared=<UUID>`): Continúan visualizando el pin sin problemas.

---

## 🛠️ 3. Pasos para Aplicar la Solución en Supabase

Para consolidar el cierre de ambas brechas:

1. Ingresa a tu panel de Supabase: [supabase.com/dashboard](https://supabase.com/dashboard).
2. Selecciona tu proyecto y abre la sección **SQL Editor**.
3. Abre el archivo local [remediacion_fase1_pii_y_pines.sql](file:///c:/Users/root/Desktop/Antigravity/NavegAltos/tests/security/remediacion_fase1_pii_y_pines.sql).
4. Copia su contenido, pégalo en una nueva consulta y presiona **Run** (botón verde).

---

## 🧪 4. Pruebas de Verificación y Validación Post-Aplicación

Una vez ejecutado el script en Supabase, podemos verificar inmediatamente desde la consola con los siguientes comandos:

1. **Verificar que `profiles` ya no es accesible anónimamente:**
   ```powershell
   curl.exe -s -H "apikey: sb_publishable_8yXULLzgA_RflwtyUKOfmw_5HKxDno8" "https://uxuivgazwybtfrelwaxc.supabase.co/rest/v1/profiles?select=*"
   # Resultado esperado: [] (vacío)
   ```

2. **Verificar que `shared_pins` ya no permite extracción masiva:**
   ```powershell
   curl.exe -s -H "apikey: sb_publishable_8yXULLzgA_RflwtyUKOfmw_5HKxDno8" "https://uxuivgazwybtfrelwaxc.supabase.co/rest/v1/shared_pins?select=*"
   # Resultado esperado: [] (vacío)
   ```

3. **Verificar que la función RPC `get_shared_pin` responde con el ID exacto:**
   ```powershell
   curl.exe -s -X POST -H "apikey: sb_publishable_8yXULLzgA_RflwtyUKOfmw_5HKxDno8" -H "Content-Type: application/json" -d '{"pin_id":"145d3580-56c0-4d05-8d79-fcac09d932bd"}' "https://uxuivgazwybtfrelwaxc.supabase.co/rest/v1/rpc/get_shared_pin"
   ```

---

## 📅 5. Registro Cronológico de Cambios

| Fecha | Autor | Acción Realizada | Archivos Modificados |
| :---: | :---: | :--- | :--- |
| **2026-10-15** | Antigravity | Creación del documento maestro de seguimiento de remediación. | `tests/security/BITACORA_REMEDACION.md` |
| **2026-10-15** | Antigravity | Actualización de lógica de recepción de pines para invocar RPC segura. | `frontend/src/pages/Dashboard.jsx` |
| **2026-10-15** | Antigravity | Creación de script SQL de Fase 1 para aislar `profiles` y crear RPC `get_shared_pin`. | `tests/security/remediacion_fase1_pii_y_pines.sql` |
| **2026-10-08** | Antigravity | Endurecimiento de cabeceras HTTP de seguridad (CSP, HSTS, X-Frame-Options). | `vercel.json`, `frontend/vercel.json` |
| **2026-10-08** | Antigravity | Configuración de keep-alive automatizado con GitHub Actions. | `.github/workflows/supabase-keepalive.yml` |
