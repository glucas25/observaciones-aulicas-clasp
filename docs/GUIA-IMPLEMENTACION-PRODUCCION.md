# Guía detallada de implementación externa y puesta en producción

Esta guía convierte las actividades externas del plan maestro en un procedimiento ejecutable. Debe repetirse para `DEV`, `UAT` y `PROD`; cada ambiente tendrá un proyecto Apps Script, spreadsheet, carpetas, plantillas, propiedades y despliegue independientes.

No se debe desplegar PROD hasta completar las aprobaciones institucionales y el checklist UAT.

## 1. Responsables y evidencias

| Responsable | Decisiones/acciones | Evidencia que debe conservarse |
|---|---|---|
| Product owner | alcance, campos, checks físicos, retención y aceptación | acta o correo de aprobación |
| Referente pedagógico | textos oficiales, 45 descriptores y regla de No aplica | catálogo firmado/versionado |
| Responsable técnico | proyectos, cuentas, secretos, ACL, despliegues y backup | registro de configuración y release |
| QA/UAT | pruebas funcionales y regresión documental | checklist y PDFs golden aprobados |
| Administrador institucional | usuarios, docentes y soporte inicial | matriz de accesos vigente |
| Responsable de privacidad | uso de datos y proveedor de IA | evaluación/autorización o decisión de mantener IA apagada |

Defina suplentes para las cuentas técnicas. Los proyectos, carpetas y triggers no deben depender de una cuenta personal que pueda darse de baja.

## 2. Prerrequisitos técnicos

- Cuenta institucional de Google Workspace con permiso para Apps Script, Sheets, Docs y Drive.
- Node.js 20 o superior.
- Apps Script API activada en `https://script.google.com/home/usersettings`.
- `clasp` instalado y autenticado con la cuenta técnica:

```powershell
npm install -g @google/clasp
clasp login
```

- Repositorio Git institucional. No incluya `.clasp.json`, `.clasprc.json`, API keys ni IDs confidenciales en commits.
- Tres ubicaciones de Drive separadas o, preferiblemente, Shared Drives separados para DEV/UAT/PROD.

Google documenta la instalación, autenticación, `push`, versionado y despliegue con `clasp` en su guía oficial: <https://developers.google.com/apps-script/guides/clasp>.

## 3. Decisiones institucionales previas

Registre estas decisiones antes de cargar PROD:

1. Nombre, ubicación, zona, distrito, circuito, dirección y jornada institucional.
2. Lista definitiva de checks de documentación física. La semilla actual (`EVI-1.0-DRAFT`) contiene solo tres ejemplos.
3. Si `No aplica` siempre exige justificación. El código actual la exige.
4. Textos exactos de los 15 criterios y 45 descriptores, cotejados contra el documento oficial.
5. Retención de borradores, snapshots, salidas IA, PDFs, auditoría y backups.
6. Quién puede consultar todas las visitas y quién puede reabrir/anular.
7. Logos, encabezados, pies, espacios de firma, tablas y paginación oficial.
8. Si el expediente unificado puede renderizarse desde una plantilla única o debe concatenar binariamente los cuatro PDFs. Consulte el ADR `docs/adr/0001-expediente-unificado.md`.
9. Si se autoriza IA externa; proveedor, modelo, región/retención, datos permitidos y presupuesto.
10. Cuenta técnica ejecutora, soporte, horario de mantenimiento y aprobadores de releases.

## 4. Crear los ambientes Google

Repita este procedimiento tres veces y use nombres inequívocos:

- `Visitas Aulicas - DEV`
- `Visitas Aulicas - UAT`
- `Visitas Aulicas - PROD`

### 4.1 Crear el proyecto Apps Script

1. Inicie sesión con la cuenta técnica del ambiente.
2. Abra `https://script.google.com` y cree un proyecto independiente.
3. Asigne el nombre del ambiente.
4. En **Configuración del proyecto**, copie el **Script ID**.
5. Confirme la zona horaria `America/Guayaquil`.
6. No edite código manualmente después de adoptar `clasp`; el repositorio será la fuente de verdad.

### 4.2 Conectar el repositorio

Desde la raíz del proyecto local:

```powershell
Copy-Item .clasp.json.example .clasp.json
```

Edite `.clasp.json` y sustituya el valor de `scriptId`. Debe conservar:

```json
{
  "scriptId": "SCRIPT_ID_DEL_AMBIENTE",
  "rootDir": "src"
}
```

Antes de subir código:

```powershell
npm test
npm run validate
clasp push
clasp open-script
```

Resultado esperado: las pruebas pasan, el validador informa 19 hojas/15 criterios/45 descriptores y el editor muestra los archivos de `src`.

### 4.3 Inicializar persistencia y administrador

Primero configure `APP_ENV`, `APP_VERSION`, `TIMEZONE`, `RETENTION_DAYS`,
`SUPPORT_EMAIL` y `AI_ENABLED` en **Configuración del proyecto > Propiedades
de la secuencia de comandos**. Las funciones elegidas en el selector
**Ejecutar** no reciben argumentos.

Si ya ejecutó `setupProject` y se creó la hoja de cálculo, continúe con el paso
2. Volver a ejecutarla es seguro mientras no se haya alterado el esquema.

1. Seleccione `setupProject` y pulse **Ejecutar**. Autorice los permisos. La
   función crea o valida el spreadsheet, registra `SPREADSHEET_ID`, crea las 18
   hojas y carga la semilla idempotente.
2. Sin cambiar de cuenta, seleccione `bootstrapCurrentUserAsAdmin` y pulse
   **Ejecutar**. La función agrega el correo de la cuenta ejecutora a `USERS`
   con rol `ADMIN` y crea la institución provisional. Compruebe ambas filas en
   las hojas `USERS` e `INSTITUTIONS`.
3. Seleccione `createStarterTemplates` y pulse **Ejecutar**. Como la cuenta ya
   es administradora, la función crea las tres carpetas, los cinco documentos
   iniciales y registra sus IDs en Script Properties.

Use `DEV`, `UAT` o `PROD` en `APP_ENV`. La función
`bootstrapAdmin(email, displayName)` queda disponible para llamadas
programáticas, pero no se puede invocar con argumentos desde el selector del
editor. No agregue correos temporales al código fuente para evitar esa
limitación.

Este proceso no publica la Web App ni crea una URL de acceso. La hoja creada es
la persistencia de la aplicación. Publique la Web App siguiendo la sección 9.

## 5. Configurar Script Properties

Las propiedades se administran en **Configuración del proyecto > Propiedades de la secuencia de comandos**. Son valores compartidos por todo el proyecto; Google describe su alcance y gestión en <https://developers.google.com/apps-script/guides/properties>.

### 5.1 Propiedades obligatorias

| Propiedad | Ejemplo | Origen |
|---|---|---|
| `APP_ENV` | `DEV`, `UAT`, `PROD` | manual/setup |
| `APP_VERSION` | `1.0.0` | release |
| `SPREADSHEET_ID` | ID de Google Sheets | `setupProject()` |
| `TEMPLATES_FOLDER_ID` | ID de carpeta | `createStarterTemplates()` |
| `OUTPUT_FOLDER_ID` | ID de carpeta PDF | `createStarterTemplates()` |
| `TEMP_FOLDER_ID` | ID de temporales | `createStarterTemplates()` |
| `ANNEX1_TEMPLATE_ID` | ID de Google Doc | setup/plantilla aprobada |
| `ANNEX2_TEMPLATE_ID` | ID de Google Doc | setup/plantilla aprobada |
| `ANNEX3_TEMPLATE_ID` | ID de Google Doc | setup/plantilla aprobada |
| `ANNEX5_TEMPLATE_ID` | ID de Google Doc | setup/plantilla aprobada |
| `FULL_PACKAGE_TEMPLATE_ID` | ID de Google Doc | setup/plantilla aprobada |
| `TEMPLATE_VERSION` | `TPL-1.0` | control documental |
| `TIMEZONE` | `America/Guayaquil` | manual/setup |
| `RETENTION_DAYS` | `365` | política aprobada |
| `SUPPORT_EMAIL` | correo institucional | manual/setup |

No copie IDs de DEV a UAT/PROD.

### 5.2 IA opcional

Mantenga `AI_ENABLED=false` hasta aprobar privacidad y completar el flujo manual/PDF.

| Propiedad | Contenido |
|---|---|
| `AI_ENABLED` | `true` solo después de aprobación |
| `AI_PROVIDER` | `OPENAI` |
| `AI_MODEL` | modelo aprobado y probado |
| `AI_PROMPT_VERSION` | por ejemplo `PROMPT-1.0` |
| `AI_ENDPOINT` | endpoint HTTPS aprobado |
| `AI_API_KEY` | secreto del proyecto/ambiente |

La API key nunca debe guardarse en Sheets, HTML, Git, documentación ni capturas. Rote la clave si se expone. El adapter envía contexto anonimizado, solicita JSON estricto, usa `store:false`, aplica un reintento acotado y abre temporalmente el circuit breaker ante fallos reiterados.

## 6. Aprobar y configurar catálogos

### 6.1 Rúbrica

1. Compare `06-CATALOGO-RUBRICA.md` palabra por palabra con el original vigente.
2. Documente diferencias y corrija una nueva versión; no altere una versión usada por visitas finalizadas.
3. En `RUBRIC_VERSIONS`, complete `source_document`, `approved_by`, `approved_at` y cambie `status` de `DRAFT` a `ACTIVE`.
4. Verifique en `RUBRIC_CRITERIA`: 15 códigos únicos, orden 1–15, grupo correcto, tres descriptores no vacíos y `allows_na` según la decisión aprobada.
5. Conserve acta, documento fuente y versión en el expediente del release.

### 6.2 Criterios generales

Verifique los seis registros de `GENERAL_CRITERIA`, su orden y `catalog_version`. Una corrección oficial debe crear otra versión y actualizar las nuevas visitas, sin modificar snapshots existentes.

### 6.3 Checks físicos

1. Reemplace los ejemplos `EVI-1.0-DRAFT` por la lista aprobada.
2. Use códigos estables, etiquetas oficiales, orden continuo y una nueva `catalog_version`.
3. Desactive los registros retirados (`active=FALSE`); no los borre si están referenciados.
4. Actualice la versión usada al crear nuevas visitas si se cambia el catálogo en código/configuración.

## 7. Preparar las plantillas oficiales

Las plantillas iniciales solo sirven para pruebas técnicas; no son evidencia de fidelidad visual.

1. Duplique cada documento oficial en la carpeta de plantillas del ambiente.
2. Conserve tablas, logos, encabezados, pies, saltos y espacios de firma.
3. Inserte los marcadores requeridos sin cambiar mayúsculas ni llaves:

```text
{{DOCUMENT_TITLE}} {{VISIT_ID}} {{INSTITUTION_NAME}} {{VISIT_DATE}}
{{TEACHER_NAME}} {{COURSE}} {{SUBJECT}} {{CONTENT_TOPIC}}
{{LOCATION}} {{SHIFT}} {{STUDENT_COUNT}}
{{OBSERVATION_RECORD}} {{EVIDENCE_CHECKS}}
{{GENERAL_CRITERIA_TABLE}} {{RUBRIC_SELECTIONS_TABLE}}
{{STRENGTHS}} {{IMPROVEMENTS}}
{{DIRECTIVE_COMMITMENTS}} {{TEACHER_COMMITMENTS}}
{{FINAL_OBSERVATIONS}}
```

4. Configure los cinco IDs en Script Properties y asigne una nueva `TEMPLATE_VERSION`.
5. Restrinja las plantillas a administradores técnicos; evaluadores solo necesitan usar la Web App.
6. Genere casos normal, máximo y Unicode para cada anexo.
7. Compare página por página contra las muestras aprobadas: datos, casillas, tablas, saltos, márgenes, logos, firmas y ausencia de marcadores.
8. Guarde los PDFs anonimizados como golden files y registre aprobador/fecha.

## 8. Configurar institución, usuarios, docentes y asignaciones

1. Abra la Web App con el administrador inicial y complete los datos institucionales.
2. Cargue usuarios con correo normalizado, rol e institución:
   - `ADMIN`: configuración, acceso total, reapertura, anulación y auditoría.
   - `DIRECTIVE`: evalúa solo asignados, modifica solo sus visitas y consulta toda su institución en modo lectura.
   - `EVALUATOR`: evalúa solo asignados y consulta sus visitas realizadas y recibidas.
   - `TEACHER`: consulta únicamente sus evaluaciones finalizadas recibidas.
3. Cargue todos los docentes en `TEACHERS`. Para consultar evaluaciones recibidas, el correo debe coincidir exactamente con `USERS.email`. Un correo no puede pertenecer a dos docentes activos.
4. Ejecute nuevamente `setupProject()` después de actualizar el código. Añadirá `EVALUATOR_ASSIGNMENTS` sin borrar datos existentes.
5. En `EVALUATOR_ASSIGNMENTS`, cree una fila por relación evaluador-docente:

| Columna | Contenido |
|---|---|
| `assignment_id` | identificador único, por ejemplo `ASG-0001` |
| `evaluator_user_id` | valor de `USERS.user_id`, no el correo |
| `teacher_id` | valor de `TEACHERS.teacher_id`, no el nombre |
| `effective_from` | fecha inicial `YYYY-MM-DD`, opcional |
| `effective_to` | fecha final `YYYY-MM-DD`, opcional |
| `active` | `TRUE` o `FALSE` |
| `created_at` | fecha/hora ISO 8601 |
| `created_by` | `user_id` del administrador que autoriza |

6. El selector **Nueva evaluación** muestra solo docentes asignados. El servidor vuelve a validar asignación, vigencia, institución y prohibición de autoevaluación.
7. Desactive usuarios, docentes y asignaciones retirados en lugar de borrarlos.
8. Pruebe una cuenta por rol: el directivo debe ver toda su institución sin editar visitas ajenas; evaluador y docente no deben ver borradores recibidos.
9. Revise trimestralmente asignaciones, vigencias y propietarios de despliegues y triggers.

## 9. Publicar la Web App

El manifiesto usa `USER_DEPLOYING` y acceso `DOMAIN`: solo las cuentas autenticadas del mismo Google Workspace pueden abrir la Web App. Cada endpoint exige además que el correo esté activo en `USERS`. Esta restricción es necesaria cuando el administrador del dominio inhabilita el acceso `ANYONE`; usuarios externos al dominio no podrán acceder aunque estén registrados en la aplicación.

La identidad de ejecución determina qué cuenta accede a Sheets/Drive. Google describe las opciones y sus implicaciones en <https://developers.google.com/apps-script/guides/web> y <https://developers.google.com/apps-script/manifest/web-app-api-executable>.

### Publicación manual

1. En Apps Script seleccione **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecute como la cuenta técnica que posee o administra las carpetas.
4. En **Quién tiene acceso**, seleccione **Cualquier usuario de su dominio**. Si esa opción no aparece, solicite al administrador de Workspace que habilite las Web Apps internas para la unidad organizativa de la cuenta técnica.
5. Autorice scopes y copie URL/deployment ID al registro del ambiente.
6. No use una implementación HEAD para producción.

### Publicación con clasp

```powershell
clasp push
clasp version "v1.0.0 - UAT aprobado"
clasp deploy -V NUMERO_DE_VERSION -d "PROD v1.0.0"
clasp deployments
```

Para actualizar un deployment existente:

```powershell
clasp version "v1.0.1 - corrección"
clasp redeploy -V NUMERO_DE_VERSION -d "PROD v1.0.1" DEPLOYMENT_ID
```

Registre versión de Git, versión Apps Script, deployment ID, URL, fecha, ejecutor y aprobadores.

## 10. Backups, triggers y restauración

Ejecute como la cuenta técnica:

```javascript
installDailyBackupTrigger();
```

El trigger ejecuta `createBackup()` diariamente. Los triggers instalables siempre se ejecutan bajo la cuenta que los creó; por eso deben pertenecer a la cuenta institucional y revisarse después de cambios de personal. Consulte <https://developers.google.com/apps-script/guides/triggers/installable>.

Validación obligatoria:

1. Ejecute manualmente `createBackup()`.
2. Abra la copia y verifique las 19 hojas, conteos y snapshots.
3. Restrinja la carpeta de backups.
4. Pruebe una restauración en UAT siguiendo `docs/runbooks/BACKUP-RESTORE.md`.
5. Registre duración, responsable, archivo restaurado y resultado.

## 11. UAT y regresión documental

Ejecute `docs/runbooks/UAT.md` con datos sintéticos. Como mínimo:

- acceso autorizado, inactivo y no autorizado;
- matriz de roles: administrador total, directivo supervisor de solo lectura sobre visitas ajenas, evaluador propietario y docente receptor;
- asignación vigente, vencida, inactiva, docente no asignado y bloqueo de autoevaluación;
- separación entre evaluaciones realizadas y recibidas, ocultando al docente los borradores recibidos;
- guardado/recuperación y conflicto de dos pestañas;
- seis criterios completos y desacuerdo sin argumento;
- 15 criterios, todos los niveles y No aplica;
- Unicode, textos largos y caracteres que podrían iniciar fórmulas;
- flujo manual completo con IA apagada;
- IA válida, inválida, timeout/fallo y confirmación humana, si se autoriza;
- cierre, bloqueo, snapshot, hash y reintento idempotente;
- cuatro anexos y expediente con el mismo snapshot/hash;
- reapertura, incremento de `data_version`, nueva salida y conservación histórica;
- anulación auditada;
- backup/restauración y permisos Drive sin enlaces públicos.

No cierre UAT mientras exista un defecto crítico/alto o una diferencia documental no aprobada.

## 12. Piloto controlado

1. Capacite a administradores y evaluadores con información sintética.
2. Seleccione al menos cinco visitas reales controladas y obtenga autorización para el tratamiento de datos.
3. Mida tiempo de captura, generación, fallos/reintentos y correcciones de texto.
4. Compare UI, Anexo 2, Anexo 3 y snapshot: debe haber cero diferencias.
5. Reimprima una visita desde historial y confirme identidad de datos.
6. Registre incidentes, severidad, resolución y cambios de catálogo/plantilla.
7. Obtenga aceptación formal pedagógica, técnica y del product owner.

## 13. Criterios para autorizar PROD

- [ ] Rúbrica y checks aprobados y versionados.
- [ ] Plantillas oficiales y golden PDFs aprobados.
- [ ] Usuarios, roles, retención, soporte y responsables definidos.
- [ ] IA aprobada o confirmada como desactivada.
- [ ] UAT sin defectos críticos/altos.
- [ ] Cinco visitas piloto aceptadas.
- [ ] ACL verificadas; ningún archivo/carpeta es público.
- [ ] Backup y restauración probados.
- [ ] Versión inmutable y rollback anterior disponibles.
- [ ] Manual/capacitación completados.
- [ ] Acta de salida firmada por product owner, referente pedagógico y responsable técnico.

## 14. Operación posterior

Diariamente/semanalmente:

- revisar ejecuciones fallidas, `AUDIT_LOG`, jobs en error y cuotas;
- ejecutar `reconcileDocumentJobs()` si existen jobs `GENERATING` atascados;
- revisar almacenamiento, PDFs y respaldo más reciente;
- procesar altas/bajas mediante solicitud autorizada.

Mensualmente:

- abrir/restaurar una copia de respaldo;
- revisar usuarios, carpetas, despliegues, triggers y secretos;
- analizar latencia, fallos documentales y aceptación/edición de IA;
- confirmar que la política de retención se aplica.

Por release:

- ejecutar `npm test` y `npm run validate`;
- actualizar `APP_VERSION`, changelog y versiones de plantilla/rúbrica;
- hacer UAT selectivo y regresión de PDFs;
- crear versión Apps Script inmutable;
- comunicar cambios y conservar el deployment anterior para rollback.

## 15. Registro mínimo por ambiente

Conserve fuera del repositorio público una ficha con:

```text
Ambiente:
Cuenta técnica:
Script ID:
Spreadsheet ID:
Templates/Output/Temp/Backup folder IDs:
Deployment ID y URL:
APP_VERSION:
RUBRIC_VERSION:
GENERAL_CATALOG_VERSION:
EVIDENCE_CATALOG_VERSION:
TEMPLATE_VERSION:
AI habilitada/proveedor/modelo/prompt version:
Fecha de backup restaurado:
Fecha/aprobadores UAT:
Fecha/aprobadores de salida:
Responsable de soporte y contacto:
```

No incluya `AI_API_KEY`, tokens OAuth ni `.clasprc.json` en esta ficha.

