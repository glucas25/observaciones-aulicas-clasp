# Visitas Áulicas V1

Aplicación web interna implementada en Google Apps Script para registrar visitas áulicas, cerrar evaluaciones mediante snapshots inmutables y generar los anexos 1, 2, 3 y 5. La especificación funcional sigue siendo la fuente de verdad y la arquitectura conserva una ruta de migración a React, FastAPI y PostgreSQL.

## Implementación disponible

- Web App accesible para escritorio/tablet con roles `ADMIN`, `DIRECTIVE`, `EVALUATOR` y `TEACHER`.
- Esquema idempotente de 19 hojas, catálogos versionados y semilla de 15 criterios/45 descriptores.
- Borradores, control de versión optimista, estados, reapertura/anulación y auditoría.
- Captura de Anexos 1, 2, 3 y 5, checks físicos y validaciones de cierre.
- Snapshot SHA-256 inmutable y generación idempotente de cinco PDFs.
- IA opcional mediante Responses API con salida JSON estricta, datos minimizados y revisión humana.
- Administración básica, respaldos y pruebas unitarias del dominio/documentos.

## Inicio rápido

1. Instale Node.js y `clasp` (`npm install -g @google/clasp`) e inicie sesión con `clasp login`.
2. Copie `.clasp.json.example` como `.clasp.json` y coloque el `scriptId` del proyecto DEV.
3. Ejecute `npm test` y `npm run validate`; luego `clasp push`.
4. En el editor de Apps Script ejecute, en este orden:
   - `setupProject()` para crear o validar el spreadsheet y sembrar catálogos.
   - `bootstrapAdmin('correo@institucion.edu', 'Nombre')` para el primer administrador.
   - `createStarterTemplates()` para crear carpetas y plantillas iniciales.
   - `installDailyBackupTrigger()` para activar el respaldo diario.
5. Sustituya las plantillas iniciales por las oficiales aprobadas, manteniendo los marcadores, y publique una versión inmutable de la Web App.

La secuencia completa, responsables, propiedades, catálogos, plantillas, despliegue, UAT, piloto y salida a producción está en [la guía detallada de implementación](./docs/GUIA-IMPLEMENTACION-PRODUCCION.md). El runbook resumido está en [la guía de despliegue](./docs/runbooks/DEPLOYMENT.md), y las aprobaciones pendientes en [IMPLEMENTATION-STATUS.md](./docs/IMPLEMENTATION-STATUS.md).

## Decisión de producto

La V1 digitaliza el trabajo **después** de la observación presencial. El evaluador transcribe su borrador físico, registra checks de documentación disponible, completa la rúbrica y revisa el texto sugerido por IA. El sistema genera los anexos 1, 2, 3 y 5 en PDF, individualmente o como expediente conjunto.

No forman parte de la V1: captura durante la clase, carga de evidencias, Anexo 4, firma electrónica, seguimiento de compromisos, analítica avanzada ni operación multiinstitución.

## Documentos

1. [01-PLAN-MAESTRO.md](./01-PLAN-MAESTRO.md): visión, alcance, fases, procesos, MVP, riesgos y gobierno.
2. [02-ESPECIFICACION-FUNCIONAL.md](./02-ESPECIFICACION-FUNCIONAL.md): actores, estados, requisitos, reglas, validaciones y criterios de aceptación.
3. [03-ARQUITECTURA-TECNICA.md](./03-ARQUITECTURA-TECNICA.md): arquitectura, estructura Apps Script, seguridad, IA, documentos y migrabilidad.
4. [04-MODELO-DATOS.md](./04-MODELO-DATOS.md): hojas, columnas, claves, catálogos, IDs y trazabilidad.
5. [05-ROADMAP-BACKLOG-QA.md](./05-ROADMAP-BACKLOG-QA.md): backlog ordenado, pruebas, despliegue, configuración y DoD.
6. [06-CATALOGO-RUBRICA.md](./06-CATALOGO-RUBRICA.md): semilla funcional de los 15 criterios y 45 descriptores del Anexo 3.

## Orden recomendado de uso

1. Validar con la institución los campos y la reproducción visual de las plantillas.
2. Convertir las historias P0 del roadmap en tareas del repositorio.
3. Crear primero el modelo de datos y servicios de dominio; después la interfaz.
4. Implementar generación documental sin IA.
5. Habilitar IA únicamente tras aprobar el flujo manual completo.

## Principios obligatorios

- Un dato se captura una vez y se reutiliza en todos los anexos.
- Sheets es persistencia, no lógica de negocio.
- La UI no accede directamente a hojas, Drive ni al proveedor de IA.
- Los criterios y descriptores se leen de catálogos versionados.
- La IA propone; el evaluador decide, edita y confirma.
- Los PDFs se generan desde una instantánea inmutable de la evaluación finalizada.
- Toda corrección posterior requiere reapertura auditada y una nueva versión documental.

## Supuestos que requieren validación institucional

- Lista exacta de checks de documentación física disponible.
- Reglas de obligatoriedad de “No aplica”.
- Política de retención de borradores, PDFs y bitácora.
- Correos autorizados y roles iniciales.
- Plantillas oficiales y uso permitido de logotipos.
- Proveedor/modelo de IA y autorización para procesar datos.

## Definición resumida de MVP

El MVP está completo cuando un evaluador autorizado puede crear una visita, guardar y recuperar borradores, completar los datos del Anexo 1 y 2, responder los 21 criterios, editar el Anexo 5 con o sin IA, finalizar la evaluación y descargar los cuatro anexos o un expediente conjunto; un administrador puede configurar catálogos, docentes, usuarios y plantillas, y consultar la auditoría básica.
