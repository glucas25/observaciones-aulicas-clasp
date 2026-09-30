var AdminService = (function () {
  function saveInstitution(dto, requestId) {
    var actor=Auth.requireRoles(['ADMIN']),now=JsonUtil.now(),current=dto.institutionId?SheetsRepository.find('INSTITUTIONS','institution_id',dto.institutionId):null;
    var row={ institution_id:dto.institutionId||Utilities.getUuid(),institution_code:dto.institutionCode||(current&&current.institution_code)||'INS-001',name:Validation.required(dto.name||(current&&current.name),'Nombre de institución',250),location:Validation.text(dto.location!=null?dto.location:(current&&current.location),250),zone:Validation.text(dto.zone!=null?dto.zone:(current&&current.zone),50),district:Validation.text(dto.district!=null?dto.district:(current&&current.district),50),circuit:Validation.text(dto.circuit!=null?dto.circuit:(current&&current.circuit),50),address:Validation.text(dto.address!=null?dto.address:(current&&current.address),500),default_shift:Validation.text(dto.defaultShift!=null?dto.defaultShift:(current&&current.default_shift),50),active:dto.active!==false,created_at:current?current.created_at:now,updated_at:now };
    SheetsRepository.upsert('INSTITUTIONS',['institution_id'],row); Audit.write(actor,'INSTITUTION_SAVED','INSTITUTION',row.institution_id,'',requestId,'SUCCESS','Institución guardada'); return row;
  }
  function saveUser(dto,requestId) {
    var actor=Auth.requireRoles(['ADMIN']),role=String(dto.role||''); if(['ADMIN','EVALUATOR','VIEWER'].indexOf(role)<0) throw AppErrors.validation('Rol inválido.');
    var email=Validation.required(dto.email,'Correo',250).toLowerCase(),current=SheetsRepository.find('USERS','email',email),now=JsonUtil.now();
    var row={user_id:current?current.user_id:Utilities.getUuid(),email:email,display_name:Validation.required(dto.displayName,'Nombre',250),role:role,institution_id:Validation.required(dto.institutionId,'Institución',100),active:dto.active!==false,created_at:current?current.created_at:now,updated_at:now,last_access_at:current?current.last_access_at:''};
    SheetsRepository.upsert('USERS',['email'],row); Audit.write(actor,'USER_SAVED','USER',row.user_id,'',requestId,'SUCCESS','Usuario guardado'); return row;
  }
  function saveTeacher(dto,requestId) {
    var actor=Auth.requireRoles(['ADMIN']),current=dto.teacherId?SheetsRepository.find('TEACHERS','teacher_id',dto.teacherId):null,now=JsonUtil.now();
    var row={teacher_id:dto.teacherId||Utilities.getUuid(),teacher_code:dto.teacherCode||('DOC-'+Utilities.getUuid().slice(0,6).toUpperCase()),institution_id:Validation.required(dto.institutionId,'Institución',100),identity_reference:Validation.text(dto.identityReference,100),full_name:Validation.required(dto.fullName,'Nombre del docente',250),email:Validation.text(dto.email,250).toLowerCase(),active:dto.active!==false,created_at:current?current.created_at:now,updated_at:now};
    SheetsRepository.upsert('TEACHERS',['teacher_id'],row); Audit.write(actor,'TEACHER_SAVED','TEACHER',row.teacher_id,'',requestId,'SUCCESS','Docente guardado'); return row;
  }
  function data() {
    Auth.requireRoles(['ADMIN']);
    var auditRows = [];
    try { auditRows = SheetsRepository.all('AUDIT_LOG').slice(-200).reverse(); } catch(e) { console.warn('AUDIT_LOG unavailable: ' + e.message); }
    return {
      users: SheetsRepository.all('USERS'),
      teachers: SheetsRepository.all('TEACHERS'),
      institutions: SheetsRepository.all('INSTITUTIONS'),
      audit: auditRows
    };
  }
  return {saveInstitution:saveInstitution,saveUser:saveUser,saveTeacher:saveTeacher,data:data};
})();
