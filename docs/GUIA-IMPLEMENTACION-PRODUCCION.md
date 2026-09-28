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

Resultado esperado: las pruebas pasan, el validador informa 18 hojas/15 criterios/45 descriptores y el editor muestra los archivos de `src`.

### 4.3 Inicializar persistencia y administrador

En el editor de Apps Script, seleccione y ejecute una vez:

```javascript
setupProject({
  properties: {
    APP_ENV: 'DEV',
    APP_VERSION: '1.0.0',
    TIMEZONE: 'America/Guayaquil',
    RETENTION_DAYS: '365',
    SUPPORT_EMAIL: 'soporte@institucion.edu',
    AI_ENABLED: 'false'
  }
});
```

Cambie `DEV` por `UAT` o `PROD`. Autorice los scopes solicitados. La función crea el spreadsheet si no existe, registra `SPREADSHEET_ID`, crea las 18 hojas y ejecuta la semilla idempotente.

Luego cree el primer administrador:

```javascript
bootstrapAdmin('administrador@institucion.edu', 'Nombre del administrador');
```

Finalmente cree las carpetas y plantillas iniciales:

```javascript
createStarterTemplates();
```

Esta función registra los IDs de carpetas y los cinco IDs de plantilla en Script Properties. Ejecútela después de `bootstrapAdmin`, con la misma cuenta autorizada.

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

## 8. Configurar institución, usuarios y docentes

1. Abra la Web App con el administrador inicial.
2. Complete los datos institucionales antes de crear visitas reales.
3. Cargue usuarios con correo normalizado, rol e institución:
   - `ADMIN`: configuración, reapertura, anulación y auditoría.
   - `EVALUATOR`: crea y edita visitas propias/asignadas.
   - `VIEWER`: consulta y reimpresión autorizada.
4. Cargue docentes usando solo los datos necesarios; evite cédula si no está justificada.
5. Desactive usuarios/docentes retirados en lugar de borrarlos.
6. Pruebe una cuenta por rol y una cuenta inactiva.
7. Revise trimestralmente la matriz de accesos y el propietario de triggers/despliegues.

## 9. Publicar la Web App

El manifiesto actual usa `USER_DEPLOYING` y acceso `ANYONE` (cualquier usuario autenticado); cada endpoint sigue exigiendo correo activo en `USERS`. Si toda la institución pertenece al mismo Workspace, valore cambiar `access` a `DOMAIN` antes de PROD. Nunca use acceso anónimo.

La identidad de ejecución determina qué cuenta accede a Sheets/Drive. Google describe las opciones y sus implicaciones en <https://developers.google.com/apps-script/guides/web> y <https://developers.google.com/apps-script/manifest/web-app-api-executable>.

### Publicación manual

1. En Apps Script seleccione **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecute como la cuenta técnica que posee o administra las carpetas.
4. Restrinja el acceso al dominio cuando sea viable; de lo contrario, usuarios autenticados + allowlist.
5. Autorice scopes y copie URL/deployment ID al registro del ambiente.
6. No use una implementación HEAD para producción.

### Publicación con clasp

```powershell
clasp push
clasp version "v1.0.0 - UAT aprobado"
clasp deploy NUMERO_DE_VERSION "PROD v1.0.0"
clasp deployments
```

Para actualizar un deployment existente:

```powershell
clasp version "v1.0.1 - corrección"
clasp redeploy DEPLOYMENT_ID NUMERO_DE_VERSION "PROD v1.0.1"
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
2. Abra la copia y verifique las 18 hojas, conteos y snapshots.
3. Restrinja la carpeta de backups.
4. Pruebe una restauración en UAT siguiendo `docs/runbooks/BACKUP-RESTORE.md`.
5. Registre duración, responsable, archivo restaurado y resultado.

## 11. UAT y regresión documental

Ejecute `docs/runbooks/UAT.md` con datos sintéticos. Como mínimo:

- acceso autorizado, inactivo y no autorizado;
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

