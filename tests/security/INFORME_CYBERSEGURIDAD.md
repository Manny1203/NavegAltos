# 🛡️ Informe de Auditoría de Ciberseguridad

**Proyecto:** NavegAltos  
**Alcance:** Backend Supabase (PostgreSQL, PostgREST, RLS) y Frontend React / Vercel  
**Tipo de prueba:** Auditoría de Seguridad Web & Control de Acceso (DAST + SAST + Análisis RLS)  
**Fecha:** 8 de Octubre, 2026  
**Nivel de Riesgo Global:** 🟡 **MEDIO - ALTO** (Requiere atención en políticas RLS de lectura)

---

## 1. Resumen Ejecutivo

Se realizó una auditoría de seguridad integral evaluando:
1. **Control de Acceso a Nivel de Filas (Row Level Security - RLS)** en Supabase.
2. **Exposición de Información de Identificación Personal (PII)**.
3. **Privilegios administrativos y escalamiento de privilegios**.
4. **Vectores de inyección en código frontend (XSS, Eval, HTML Injection)**.
5. **Configuración de Cabeceras HTTP de Seguridad (Vercel)**.

### Resumen de Hallazgos

| Categoría | Severidad | Estado | Descripción |
| :--- | :---: | :---: | :--- |
| **Exposición PII en `profiles`** | 🔴 ALTA | **Vulnerable** | Cualquier usuario anónimo puede descargar nombres reales y fotos de Google de todos los usuarios registrados. |
| **Fuga de Pines Privados en `shared_pins`** | 🔴 ALTA | **Vulnerable** | La política `USING (true)` permite extraer en lote todos los pines privados compartidos. |
| **Exposición de Bugs y Reportes** | 🟡 MEDIA | **Vulnerable** | Tablas `system_bugs` y `pin_reports` legibles sin autenticación (revela correos y reportes). |
| **Enumeración de Administradores** | 🟡 MEDIA | **Vulnerable** | La tabla `admin_users` es pública para lectura, revelando los UUIDs de administradores. |
| **Cabeceras HTTP Faltantes** | 🟡 MEDIA | **Mejorable** | `vercel.json` no tiene configuradas cabeceras contra *Clickjacking* ni *MIME-sniffing*. |
| **Protección contra Escritura (INSERT/UPDATE/DELETE)** | 🟢 BAJA | ✅ **SEGURO** | RLS bloquea correctamente modificaciones no autorizadas (retorna 401 / 0 filas afectadas). |
| **Inyección de Código Frontend (XSS)** | 🟢 BAJA | ✅ **SEGURO** | No se utiliza `dangerouslySetInnerHTML` ni llamadas peligrosas a `eval()`. |
| **Protección de Claves Maestras** | 🟢 BAJA | ✅ **SEGURO** | La clave `service_role` de Supabase no está filtrada en el repositorio. |

---

## 2. Detalle de Vulnerabilidades Detectadas

### 🔴 1. Exfiltración Masiva de Datos Personales en `public.profiles`
- **Impacto:** Fuga de privacidad (RGPD / LFPDPPP).
- **Evidencia Técnica:**
  Una simple petición `GET /rest/v1/profiles?select=*` con la clave anónima pública devuelve la lista completa de usuarios registrados, incluyendo nombres y URLs de avatares.
- **Causa:** La tabla `profiles` tiene RLS deshabilitado o una política `FOR SELECT USING (true)` sin restricciones.
- **Remediación:** Permitir únicamente la lectura del propio perfil (`auth.uid() = id`), o solo a usuarios autenticados si la funcionalidad de la app lo requiere.

---

### 🔴 2. Fuga de Pines Privados en `public.shared_pins`
- **Impacto:** Pérdida de confidencialidad de ubicaciones privadas.
- **Evidencia Técnica:**
  En `compartir_pines.sql`:
  ```sql
  CREATE POLICY "Cualquiera puede leer pines compartidos"
  ON public.shared_pins FOR SELECT
  USING (true);
  ```
  La intención del desarrollador era que solo accedieran mediante enlace con el UUID exacto, pero la API REST permite ignorar el ID y consultar `GET /rest/v1/shared_pins?select=*`, extrayendo todos los pines creados con `is_public: false`.
- **Remediación:** Limitar la lectura para que solo retorne datos si el cliente especifica el ID exacto mediante una función RPC de base de datos (`SECURITY DEFINER`), o requiriendo tokens hash de compartición.

---

### 🟡 3. Exposición de Reportes Internos y Correos (`system_bugs` y `pin_reports`)
- **Impacto:** Fuga de información operativa y correos de contacto del personal universitario (`admin@udg.mx`).
- **Evidencia Técnica:**
  Peticiones anónimas a `GET /rest/v1/system_bugs` y `GET /rest/v1/pin_reports` devuelven el historial completo de incidencias y reportes generados.
- **Remediación:** Aplicar política RLS `FOR SELECT` restringida a los usuarios que pertenezcan a `admin_users`:
  ```sql
  CREATE POLICY "Solo administradores leen bugs"
  ON system_bugs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE admin_users.user_id = auth.uid()));
  ```

---

### 🟡 4. Ausencia de Cabeceras HTTP de Seguridad en `vercel.json`
- **Impacto:** La aplicación puede ser embebida en un `<iframe>` malicioso de terceros (Clickjacking) o sufrir ataques de falsificación de tipos MIME.
- **Remediación:** Añadir cabeceras en `vercel.json`.

---

## 3. Plan de Mitigación y Script SQL

Se generó un script correctivo listo para ejecutar en el editor SQL de Supabase:
👉 [fix_security_rls.sql](file:///c:/Users/root/Desktop/Antigravity/NavegAltos/tests/security/fix_security_rls.sql)
