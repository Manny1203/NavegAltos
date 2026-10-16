# 📅 Cronograma y Diagrama de Gantt del Proyecto NavegAltos

**Proyecto:** NavegAltos (Sistema de Navegación y Localización Campus)  
**Fuente de Datos:** Historial analítico de commits de Git (Marzo 2026 – Octubre 2026)  
**Fecha de Generación:** 15 de Octubre, 2026  

---

## 1. Diagrama de Gantt General

```mermaid
gantt
    title Cronología de Desarrollo - NavegAltos
    dateFormat YYYY-MM-DD
    axisFormat %d %b %Y

    section Fase 1: Concepción y Core
    Prototipo local (SQLite/Prisma)          :done, f1_1, 2026-03-12, 2026-03-13
    Migración a Supabase y Auth Institucional:done, f1_2, 2026-03-13, 2026-03-14

    section Fase 2: Gestión de Pines y Admin
    Gestión de pines, filtros y categorías    :done, f2_1, 2026-03-16, 2026-03-20
    Panel de Administrador y mapa Rectoría   :done, f2_2, 2026-03-21, 2026-03-27

    section Fase 3: Vectorización y Mapas
    Mapa vectorial SVG y controles de Zoom   :done, f3_1, 2026-04-16, 2026-04-19
    Identificación y selector de edificios   :done, f3_2, 2026-04-17, 2026-04-24

    section Fase 4: Motor de Rutas y PWA
    PWA instalable y hosteo en Vercel        :done, f4_1, 2026-05-05, 2026-05-06
    GPS en tiempo real (Transformación Afín) :done, f4_2, 2026-05-05, 2026-05-07
    Algoritmo A* y Editor visual de grafos   :done, f4_3, 2026-05-05, 2026-05-08
    Soporte offline básico                   :done, f4_4, 2026-05-11, 2026-05-12

    section Fase 5: Auth, Social y Perfiles
    OAuth Google y recuperación contraseñas  :done, f5_1, 2026-05-12, 2026-05-14
    Perfil de usuario y avatar               :done, f5_2, 2026-05-12, 2026-05-15
    Compartición de pines (shared_pins)      :done, f5_3, 2026-05-15, 2026-05-17
    Modo invitado y optimización móvil       :done, f5_4, 2026-05-23, 2026-05-26

    section Fase 6: UX, Búsqueda y Reportes
    Fuzzy Search, favoritos y expiración     :done, f6_1, 2026-06-01, 2026-06-10
    Módulo de reportes de bugs y denuncias   :done, f6_2, 2026-06-09, 2026-06-14
    Onboarding (tutorial) y Términos         :done, f6_3, 2026-06-13, 2026-06-16

    section Fase 7: DevOps y Ciberseguridad
    Protección de .env y saneamiento Git     :done, f7_1, 2026-09-16, 2026-09-17
    Keep-alive automático en GitHub Actions  :done, f7_2, 2026-10-08, 2026-10-09
    Pruebas de carga (Grafana k6)            :done, f7_3, 2026-10-08, 2026-10-09
    Cabeceras HTTP defensivas (Vercel)       :done, f7_4, 2026-10-08, 2026-10-09
    Remediación RLS (PII y pines privados)   :active, f7_5, 2026-10-15, 2026-10-17
```

---

## 2. Desglose Detallado por Etapas y Fechas Clave

| Fase | Fechas | Hitos Principales |
| :--- | :---: | :--- |
| **1. Prototipado e Infraestructura** | **12 Mar – 14 Mar** | Creación del frontend base, descarte de SQLite/Prisma local y adopción definitiva de **Supabase** para gestión cloud y autenticación institucional. |
| **2. Pines y Panel Admin** | **16 Mar – 27 Mar** | Filtros por categorías, pines públicos vs privados, creación del panel de administración para moderación de ubicaciones y soporte inicial para el edificio de Rectoría. |
| **3. Vectorización y Rendimiento** | **16 Abr – 24 Abr** | Reemplazo de imágenes estáticas por **mapa vectorial SVG** optimizado para evitar caídas de FPS, incorporación de zoom suave y selector de edificios. |
| **4. Navegación, Rutas y PWA** | **05 May – 12 May** | Implementación del algoritmo de rutas **A-Star (A*)**, calibración de **GPS en tiempo real** con matriz afín, editor de grafos de rutas con Modo Zen y conversión a **PWA instalable**. |
| **5. Autenticación y Perfiles** | **12 May – 26 May** | Login con Google OAuth, perfiles de usuario con foto, sistema de compartición de pines con enlaces temporales (`shared_pins`) y modo invitado. |
| **6. Búsqueda y Usabilidad** | **01 Jun – 16 Jun** | Algoritmo de búsqueda difusa (*Fuzzy Search* con fuse.js), pines favoritos, sistema de reporte de fallos (`system_bugs`), onboarding interactivo (tutorial guiado) y términos legales. |
| **7. Infraestructura y Ciberseguridad** | **16 Sep – Actualidad** | Eliminación de credenciales en Git, temporizador **Keep-Alive con GitHub Actions**, pruebas de estrés con **Grafana k6** (100% de éxito), cabeceras HTTP de seguridad y **blindaje de RLS en base de datos**. |

---

## 3. Estado Actual de la Línea de Tiempo

* **Fecha actual:** 15 de Octubre, 2026
* **Hito en curso:** Fase 7 (Cierre de brechas críticas: PII en `profiles` y función RPC en `shared_pins`).
