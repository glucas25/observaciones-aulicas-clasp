# Estado de ejecución del plan maestro

Fecha de corte: 2026-09-28.

Las instrucciones operativas para cerrar estas acciones están consolidadas en [`GUIA-IMPLEMENTACION-PRODUCCION.md`](./GUIA-IMPLEMENTACION-PRODUCCION.md).

## Entregado en el repositorio

| Fase | Estado | Evidencia |
|---|---|---|
| 1. Diseño técnico | Implementado | Capas, contratos, esquema, estados y DTOs bajo `src/` |
| 2. Base técnica | Implementado en código | manifiesto, setup idempotente, allowlist, RBAC, auditoría y locks |
| 3. Núcleo manual | Implementado | flujo UI, guardado, validación, cierre, reapertura y anulación |
| 3a. Roles y asignaciones | Implementado | `DIRECTIVE`/`TEACHER`, asignaciones desde Sheets, separación realizadas/recibidas y autorización en servidor |
| 4. Documentos | Implementado con plantillas iniciales | snapshot, hash, jobs, idempotencia y cinco PDFs |
| 5. IA | Implementado y desactivado por defecto | adapter configurable, JSON Schema, `store:false`, revisión humana y fallback manual |
| 6. Calidad | Automatización base implementada | pruebas unitarias, validador, runbooks y checklist UAT |
| 7. Producción | Preparado, no ejecutado | guía de despliegue, backup y rollback |

## Decisiones/aprobaciones institucionales pendientes

No pueden resolverse correctamente solo con código:

- cotejo pedagógico y aprobación de los 45 descriptores; la versión semilla permanece `DRAFT`;
- lista oficial de checks físicos y regla definitiva de `No aplica`;
- plantillas oficiales, logotipos y aprobación visual página por página;
- correos/roles reales, retención y responsables de soporte;
- matriz inicial de asignaciones evaluador-docente, vigencias y responsable de mantenimiento;
- evaluación de privacidad y autorización del proveedor/modelo de IA;
- creación de proyectos DEV/UAT/PROD, ACL, UAT, capacitación y piloto de cinco visitas.

Las tres checks iniciales tienen versión `EVI-1.0-DRAFT` para hacer pruebas y deben reemplazarse antes de PROD.

## Limitación documentada

Apps Script no incorpora una API nativa fiable para fusionar PDFs. El expediente se renderiza desde el mismo snapshot en una plantilla unificada, en orden 1–2–3–5. Esto mantiene identidad de datos y hash, pero la institución debe aprobar visualmente la plantilla unificada o autorizar un servicio interno de combinación binaria.
