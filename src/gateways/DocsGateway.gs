var DocsGateway = (function () {
  var labels={ACHIEVED:'Logrado',IN_PROGRESS:'En proceso',BEGINNING:'En inicio',NOT_APPLICABLE:'No aplica',FULLY_AGREE:'Totalmente de acuerdo',DISAGREE:'En desacuerdo'};
  function line_(values){return values.filter(function(v){return v!==''&&v!=null;}).join(' · ');}
  function replacements(snapshot,type){
    var general=(snapshot.generalResponses||[]).map(function(r,i){return (r.criterionCode||i+1)+'. '+(r.criterionText||'')+'\n'+(labels[r.result]||r.result)+(r.argument?' — '+r.argument:'');}).join('\n\n');
    var rubric=(snapshot.rubricResponses||[]).map(function(r,i){return (r.criterionCode||i+1)+'. '+(r.criterionTitle||'')+'\n'+(labels[r.level]||r.level)+(r.descriptorSnapshot?' — '+r.descriptorSnapshot:'')+(r.observation?' | Obs.: '+r.observation:'');}).join('\n\n');
    var evidence=(snapshot.evidenceChecks||[]).map(function(r){return (r.isChecked?'☒ ':'☐ ')+(r.label||r.checkTypeId)+(r.observation?' — '+r.observation:'');}).join('\n');
    return {DOCUMENT_TITLE:{ANNEX_1:'ANEXO 1 — REGISTRO DE OBSERVACIÓN',ANNEX_2:'ANEXO 2 — FICHA DE OBSERVACIÓN',ANNEX_3:'ANEXO 3 — RÚBRICA',ANNEX_5:'ANEXO 5 — RETROALIMENTACIÓN',FULL_PACKAGE:'EXPEDIENTE DE OBSERVACIÓN — ANEXOS 1, 2, 3 Y 5'}[type],VISIT_ID:snapshot.visitCode,INSTITUTION_NAME:snapshot.institutionNameSnapshot,VISIT_DATE:snapshot.visitDate,TEACHER_NAME:snapshot.teacherNameSnapshot,COURSE:line_([snapshot.gradeCourse,snapshot.parallel]),SUBJECT:snapshot.subject,CONTENT_TOPIC:snapshot.contentTopic,LOCATION:line_([snapshot.location,snapshot.zone,snapshot.district,snapshot.circuit]),SHIFT:snapshot.shift,STUDENT_COUNT:snapshot.studentCount,OBSERVATION_RECORD:snapshot.observationRecord,EVIDENCE_CHECKS:evidence,GENERAL_CRITERIA_TABLE:general,RUBRIC_SELECTIONS_TABLE:rubric,STRENGTHS:snapshot.strengths,IMPROVEMENTS:snapshot.improvements,DIRECTIVE_COMMITMENTS:snapshot.directiveCommitments,TEACHER_COMMITMENTS:snapshot.teacherCommitments,FINAL_OBSERVATIONS:snapshot.finalObservations||''};
  }
  function replace_(body,key,value){body.replaceText('\\{\\{'+key+'\\}\\}',String(value==null?'':value).replace(/\\/g,'\\\\').replace(/\$/g,'\\$'));}
  function render(templateId,outputName,snapshot,type,tempFolderId,outputFolderId){
    if(!templateId) throw AppErrors.document('No se configuró la plantilla para '+type+'.');
    var copy=DriveApp.getFileById(templateId).makeCopy(outputName+'-TEMP',DriveApp.getFolderById(tempFolderId)),doc=DocumentApp.openById(copy.getId()),body=doc.getBody(),values=replacements(snapshot,type);
    Object.keys(values).forEach(function(k){replace_(body,k,values[k]);});if(/\{\{[A-Z0-9_]+\}\}/.test(body.getText())){doc.saveAndClose();copy.setTrashed(true);throw AppErrors.document('La plantilla contiene marcadores sin resolver.');}doc.saveAndClose();
    var blob=copy.getAs(MimeType.PDF).setName(outputName),file=DriveApp.getFolderById(outputFolderId).createFile(blob);copy.setTrashed(true);return file;
  }
  return {render:render,replacements:replacements};
})();
