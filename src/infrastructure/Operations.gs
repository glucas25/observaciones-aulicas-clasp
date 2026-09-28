function createBackup() {
  var config=AppConfig.validate(),props=PropertiesService.getScriptProperties(),folderId=props.getProperty('BACKUP_FOLDER_ID');
  var folder=folderId?DriveApp.getFolderById(folderId):DriveApp.createFolder('Visitas Aulicas - Respaldos '+config.environment);
  if(!folderId)props.setProperty('BACKUP_FOLDER_ID',folder.getId());
  var stamp=Utilities.formatDate(new Date(),config.timezone,'yyyyMMdd-HHmmss'),copy=DriveApp.getFileById(config.spreadsheetId).makeCopy('BACKUP-'+config.environment+'-'+stamp,folder);
  Audit.write({user_id:'SYSTEM',email:'',role:'SYSTEM'},'BACKUP_CREATED','SPREADSHEET',config.spreadsheetId,'','maintenance','SUCCESS','Respaldo creado',{backupFileId:copy.getId()});
  return {fileId:copy.getId(),name:copy.getName(),url:copy.getUrl()};
}
function installDailyBackupTrigger(){Auth.requireRoles(['ADMIN']);ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='createBackup';}).forEach(function(t){ScriptApp.deleteTrigger(t);});ScriptApp.newTrigger('createBackup').timeBased().everyDays(1).atHour(2).create();return true;}
function reconcileDocumentJobs(){var cutoff=Date.now()-30*60*1000,count=0;SheetsRepository.all('DOCUMENT_JOBS').forEach(function(job){if(job.status==='GENERATING'&&new Date(job.started_at).getTime()<cutoff){job.status='ERROR';job.completed_at=JsonUtil.now();job.last_error_code='STALE_JOB';SheetsRepository.upsert('DOCUMENT_JOBS',['idempotency_key'],job);count++;}});return {reconciled:count};}

