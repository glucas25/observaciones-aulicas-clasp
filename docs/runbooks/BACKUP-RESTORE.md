# Respaldo y restauración

`createBackup()` copia el spreadsheet con fecha/hora a una carpeta privada. `installDailyBackupTrigger()` instala un trigger diario a las 02:00 de la zona del proyecto. Revise mensualmente que la copia abra y conserve las 18 hojas.

Para restaurar:

1. Ponga la Web App en mantenimiento o retire temporalmente el despliegue.
2. Preserve una copia del archivo afectado y exporte `AUDIT_LOG`.
3. Abra la copia elegida, verifique cabeceras, conteos, snapshots y hashes.
4. Cambie `SPREADSHEET_ID` al ID restaurado; no sobrescriba el archivo corrupto.
5. Ejecute `setupProject()` para validar el esquema (no elimina datos).
6. Reabra la Web App en DEV/UAT, ejecute smoke test y luego publique PROD.
7. Reconcilie documentos/jobs y registre incidente, copia usada y aprobador.

