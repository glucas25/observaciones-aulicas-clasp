# ADR 0001: expediente PDF unificado

Estado: aceptado provisionalmente para DEV; requiere aprobación de producto para PROD.

Apps Script no ofrece fusión binaria nativa de PDFs. Para evitar un servicio externo y conservar privacidad, V1 renderiza `FULL_PACKAGE` desde el mismo snapshot/hash mediante una plantilla Google Docs que presenta anexos 1, 2, 3 y 5 en ese orden.

Consecuencias: datos e idempotencia son equivalentes a los anexos individuales, pero la paginación puede diferir. Si UAT exige concatenación byte a byte de los PDFs aprobados, se incorporará un servicio interno mínimo con ACL y retención documentadas.

