var ApiController = (function () {
  function invoke(action,payload){var requestId=Utilities.getUuid();try{var data=action(payload||{},requestId);return {ok:true,data:data,error:null,requestId:requestId,serverTime:JsonUtil.now()};}catch(e){console.error(requestId+' '+(e.stack||e.message));var known=e&&e.code;return {ok:false,data:null,error:{code:known?e.code:'INTERNAL_ERROR',message:known?e.message:'Ocurrió un error inesperado. Use el identificador de solicitud para soporte.',details:known?e.details:null},requestId:requestId,serverTime:JsonUtil.now()};}}
  return {invoke:invoke};
})();

function apiBootstrap(){return ApiController.invoke(function(){var user=Auth.current();return {user:{userId:user.user_id,email:user.email,displayName:user.display_name,role:user.role,teacherId:(Auth.teacherForUser(user)||{}).teacher_id||''},catalogs:CatalogService.getAll(),visits:VisitService.list({limit:100}),app:{version:AppConfig.get().version,environment:AppConfig.get().environment}};});}
function apiListVisits(payload){return ApiController.invoke(function(p){return VisitService.list(p.filters);},payload);}
function apiGetVisit(payload){return ApiController.invoke(function(p){return VisitService.get(p.visitId);},payload);}
function apiCreateVisit(payload){return ApiController.invoke(function(p,r){return VisitService.create(p.visit,r);},payload);}
function apiSaveVisit(payload){return ApiController.invoke(function(p,r){return VisitService.save(p.visitId,p.visit,p.expectedVersion,r);},payload);}
function apiChangeVisitStatus(payload){return ApiController.invoke(function(p,r){return FinalizationService.changeStatus(p.visitId,p.status,p.expectedVersion,r);},payload);}
function apiFinalizeVisit(payload){return ApiController.invoke(function(p,r){return FinalizationService.finalize(p.visitId,p.expectedVersion,r);},payload);}
function apiReopenVisit(payload){return ApiController.invoke(function(p,r){return FinalizationService.reopen(p.visitId,p.reason,r);},payload);}
function apiAnnulVisit(payload){return ApiController.invoke(function(p,r){return FinalizationService.annul(p.visitId,p.reason,r);},payload);}
function apiGenerateDocument(payload){return ApiController.invoke(function(p,r){return DocumentService.generate(p.visitId,p.type,r);},payload);}
function apiListDocuments(payload){return ApiController.invoke(function(p){return DocumentService.list(p.visitId);},payload);}
function apiGenerateAiDraft(payload){return ApiController.invoke(function(p,r){return AiDraftService.draft(p.visitId,r);},payload);}
function apiAcceptAiDraft(payload){return ApiController.invoke(function(p,r){return AiDraftService.accept(p.aiRequestId,p.humanEdited,r);},payload);}
function apiAdminData(){return ApiController.invoke(function(){return AdminService.data();});}
function apiSaveInstitution(payload){return ApiController.invoke(function(p,r){return AdminService.saveInstitution(p,r);},payload);}
function apiSaveUser(payload){return ApiController.invoke(function(p,r){return AdminService.saveUser(p,r);},payload);}
function apiSaveTeacher(payload){return ApiController.invoke(function(p,r){return AdminService.saveTeacher(p,r);},payload);}
function apiSaveAssignment(payload){return ApiController.invoke(function(p,r){return AdminService.saveAssignment(p,r);},payload);}

