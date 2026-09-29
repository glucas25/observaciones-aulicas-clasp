# Despliegue y publicación

## Propiedades de Script

Obligatorias para operación: `APP_ENV`, `APP_VERSION`, `SPREADSHEET_ID`, `OUTPUT_FOLDER_ID`, `TEMP_FOLDER_ID`. Las funciones de setup completan los IDs que crean.

Plantillas: `TEMPLATES_FOLDER_ID`, `ANNEX1_TEMPLATE_ID`, `ANNEX2_TEMPLATE_ID`, `ANNEX3_TEMPLATE_ID`, `ANNEX5_TEMPLATE_ID`, `FULL_PACKAGE_TEMPLATE_ID`, `TEMPLATE_VERSION`.

Opcionales: `TIMEZONE`, `RETENTION_DAYS`, `SUPPORT_EMAIL`, `BACKUP_FOLDER_ID`.

IA, desactivada por defecto: `AI_ENABLED`, `AI_PROVIDER=OPENAI`, `AI_MODEL`, `AI_PROMPT_VERSION`, `AI_ENDPOINT`, `AI_API_KEY`. La clave solo se guarda en Script Properties. El adapter usa Responses API y salida estructurada; confirme el modelo permitido por la institución antes de activarlo.

## Secuencia por ambiente

1. Cree proyectos separados para DEV, UAT y PROD; nunca copie datos reales a DEV.
2. Configure `.clasp.json` local (está ignorado por Git), ejecute pruebas, validación y `clasp push`.
3. Configure las Script Properties y ejecute `setupProject()`, `bootstrapCurrentUserAsAdmin()` y `createStarterTemplates()` con la misma cuenta institucional.
4. Edite institución, usuarios, docentes y checks. Cambie la rúbrica a `ACTIVE` solo tras aprobación pedagógica.
5. Reemplace las plantillas iniciales por copias oficiales con los mismos marcadores y suba `TEMPLATE_VERSION`.
6. Compruebe que carpetas y archivos no tengan acceso público.
7. Publique una versión nueva de la Web App, ejecutada por la identidad institucional y accesible al dominio previsto. La allowlist de `USERS` se valida además en cada endpoint.
8. Ejecute el checklist de `UAT.md`, revise cinco PDFs y active el backup diario.

## Smoke test

- Una cuenta no incluida recibe `FORBIDDEN`.
- Un evaluador crea y recupera un borrador.
- Dos pestañas provocan `VERSION_CONFLICT` sin sobrescritura.
- Desacuerdo sin argumento y No aplica sin observación bloquean el cierre.
- El cierre produce snapshot/hash y bloquea edición.
- Los cuatro anexos y el expediente comparten hash y no contienen marcadores `{{...}}`.
- Reintentar generación devuelve el archivo existente.
- Un administrador reabre, registra motivo e incrementa `data_version`.

## Rollback

Vuelva a desplegar la versión anterior del script. No revierta filas: las migraciones son aditivas. Si hay riesgo de corrupción, suspenda la Web App, copie el spreadsheet afectado, restaure según el runbook y reconcilie contra `AUDIT_LOG` y `VISIT_SNAPSHOTS`.

