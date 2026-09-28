var VisitService = (function () {
  var map = {
    institutionId:'institution_id', teacherId:'teacher_id', evaluatorUserId:'evaluator_user_id', dataVersion:'data_version', rowVersion:'row_version',
    rubricVersionId:'rubric_version_id', generalCatalogVersion:'general_catalog_version', evidenceCatalogVersion:'evidence_catalog_version',
    formNumber:'form_number', visitDate:'visit_date', classStartTime:'class_start_time', teacherNameSnapshot:'teacher_name_snapshot',
    institutionNameSnapshot:'institution_name_snapshot', institutionAddress:'institution_address', gradeCourse:'grade_course', contentTopic:'content_topic',
    studentCount:'student_count', observationRecord:'observation_record', directiveCommitments:'directive_commitments', teacherCommitments:'teacher_commitments',
    finalObservations:'final_observations', aiUsed:'ai_used', reviewedByHuman:'reviewed_by_human'
  };
  function toCamel_(row) {
    var reverse = {}; Object.keys(map).forEach(function (k) { reverse[map[k]] = k; });
    var out = {};
    Object.keys(row || {}).forEach(function (key) { out[reverse[key] || key.replace(/_([a-z])/g, function (_, c) { return c.toUpperCase(); })] = row[key]; });
    return out;
  }
  function visitRow_(dto, base) {
    var out = Object.assign({}, base || {});
    var editable=['formNumber','visitDate','classStartTime','shift','gradeCourse','parallel','sublevel','area','subject','contentTopic','studentCount','observationRecord','strengths','improvements','directiveCommitments','teacherCommitments','finalObservations','aiUsed','reviewedByHuman'];
    editable.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(dto,key)) out[map[key] || key.replace(/[A-Z]/g, function (c) { return '_' + c.toLowerCase(); })] = dto[key];
    });
    return out;
  }
  function raw_(visitId) {
    var row = SheetsRepository.find('VISITS', 'visit_id', visitId);
    if (!row) throw AppErrors.notFound('La evaluación');
    return row;
  }
  function aggregate_(row) {
    var dto = toCamel_(row);
    dto.generalResponses = SheetsRepository.filter('VISIT_GENERAL_RESPONSES', function (r) { return String(r.visit_id) === String(row.visit_id); }).map(toCamel_);
    dto.rubricResponses = SheetsRepository.filter('VISIT_RUBRIC_RESPONSES', function (r) { return String(r.visit_id) === String(row.visit_id); }).map(toCamel_);
    dto.evidenceChecks = SheetsRepository.filter('VISIT_EVIDENCE_CHECKS', function (r) { return String(r.visit_id) === String(row.visit_id); }).map(toCamel_);
    return dto;
  }
  function create(dto, requestId) {
    var actor = Auth.requireRoles(['ADMIN','EVALUATOR']);
    dto = dto || {};
    var teacher = SheetsRepository.find('TEACHERS', 'teacher_id', dto.teacherId);
    if (!teacher || String(teacher.active).toLowerCase() === 'false') throw AppErrors.validation('Seleccione un docente activo.');
    var institution = SheetsRepository.find('INSTITUTIONS', 'institution_id', teacher.institution_id);
    if (!institution) throw AppErrors.validation('La institución del docente no existe.');
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      var year = new Date().getFullYear(), sequence = SheetsRepository.nextSequence('VISIT', year);
      var id = Utilities.getUuid(), now = JsonUtil.now();
      var row = visitRow_(dto, {
        visit_id:id, visit_code:'VIS-' + year + '-' + ('000000' + sequence).slice(-6), institution_id:institution.institution_id,
        teacher_id:teacher.teacher_id, evaluator_user_id:actor.user_id, status:VisitState.values.DRAFT, data_version:1, row_version:1,
        rubric_version_id:'rubric-v1', general_catalog_version:'GEN-1.0', evidence_catalog_version:'EVI-1.0-DRAFT',
        teacher_name_snapshot:teacher.full_name, institution_name_snapshot:institution.name, location:institution.location, zone:institution.zone,
        district:institution.district, circuit:institution.circuit, institution_address:institution.address, shift:dto.shift || institution.default_shift,
        ai_used:false, reviewed_by_human:false, created_at:now, created_by:actor.user_id, updated_at:now, updated_by:actor.user_id
      });
      SheetsRepository.append('VISITS', row);
      Audit.write(actor,'VISIT_CREATED','VISIT',id,1,requestId,'SUCCESS','Evaluación creada');
      return aggregate_(row);
    } finally { lock.releaseLock(); }
  }
  function replaceChildren_(visitId, dto, actor, now) {
    var rubricById={},generalById={},evidenceById={};
    SheetsRepository.all('RUBRIC_CRITERIA').forEach(function(r){rubricById[r.criterion_id]=r;});
    SheetsRepository.all('GENERAL_CRITERIA').forEach(function(r){generalById[r.general_criterion_id]=r;});
    SheetsRepository.all('EVIDENCE_CHECK_TYPES').forEach(function(r){evidenceById[r.check_type_id]=r;});
    var specs = [
      ['VISIT_GENERAL_RESPONSES','generalResponses','general_criterion_id','generalCriterionId','response_id'],
      ['VISIT_RUBRIC_RESPONSES','rubricResponses','criterion_id','criterionId','response_id'],
      ['VISIT_EVIDENCE_CHECKS','evidenceChecks','check_type_id','checkTypeId','visit_check_id']
    ];
    specs.forEach(function (spec) {
      if (!Object.prototype.hasOwnProperty.call(dto, spec[1])) return;
      var prepared=(dto[spec[1]] || []).map(function (item) {
        var row = {};
        Object.keys(item).forEach(function (key) { row[key.replace(/[A-Z]/g,function(c){return '_'+c.toLowerCase();})] = item[key]; });
        row[spec[4]] = item[spec[4]] || Utilities.getUuid(); row.visit_id = visitId; row[spec[2]] = item[spec[3]];
        row.created_at = item.createdAt || now; row.updated_at = now; row.updated_by = actor.user_id;
        if(spec[0]==='VISIT_RUBRIC_RESPONSES'){var criterion=rubricById[item.criterionId];if(!criterion)throw AppErrors.validation('Un criterio de rúbrica no existe.');var descriptorFields={ACHIEVED:'descriptor_achieved',IN_PROGRESS:'descriptor_in_progress',BEGINNING:'descriptor_beginning'};row.descriptor_snapshot=item.level==='NOT_APPLICABLE'?'':criterion[descriptorFields[item.level]];}
        if(spec[0]==='VISIT_GENERAL_RESPONSES'&&!generalById[item.generalCriterionId])throw AppErrors.validation('Un criterio general no existe.');
        if(spec[0]==='VISIT_EVIDENCE_CHECKS'&&!evidenceById[item.checkTypeId])throw AppErrors.validation('Un check documental no existe.');
        return row;
      });
      SheetsRepository.removeWhere(spec[0], function (r) { return String(r.visit_id) === String(visitId); });
      prepared.forEach(function(row){SheetsRepository.append(spec[0],row);});
    });
  }
  function descriptorFor_(criterionId, level) {
    if (level === 'NOT_APPLICABLE') return '';
    var criterion = SheetsRepository.find('RUBRIC_CRITERIA','criterion_id',criterionId);
    if (!criterion) throw AppErrors.validation('Un criterio de rúbrica no existe.');
    var fields = { ACHIEVED:'descriptor_achieved', IN_PROGRESS:'descriptor_in_progress', BEGINNING:'descriptor_beginning' };
    return criterion[fields[level]] || '';
  }
  function save(visitId, dto, expectedVersion, requestId) {
    var actor = Auth.requireRoles(['ADMIN','EVALUATOR']); Validation.validateVisitDraft(dto);
    var lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      var current = raw_(visitId); Auth.assertVisit(actor,current,true);
      if (!VisitState.isEditable(current.status)) throw AppErrors.validation('La evaluación está bloqueada para edición.');
      if (Number(current.row_version) !== Number(expectedVersion)) { Audit.write(actor,'VERSION_CONFLICT','VISIT',visitId,current.data_version,requestId,'ERROR','Conflicto de versión'); throw AppErrors.conflict(); }
      var now = JsonUtil.now(), next = visitRow_(dto,current);
      next.visit_id = visitId; next.row_version = Number(current.row_version) + 1; next.updated_at = now; next.updated_by = actor.user_id;
      replaceChildren_(visitId,dto,actor,now); SheetsRepository.upsert('VISITS',['visit_id'],next);
      Audit.write(actor,'VISIT_SAVED','VISIT',visitId,next.data_version,requestId,'SUCCESS','Borrador guardado');
      return aggregate_(next);
    } finally { lock.releaseLock(); }
  }
  function get(visitId) {
    var actor = Auth.current(), row = raw_(visitId); Auth.assertVisit(actor,row,false); return aggregate_(row);
  }
  function list(filters) {
    var actor = Auth.current(), f = filters || {};
    return SheetsRepository.filter('VISITS', function (v) {
      if (!Auth.canAccessVisit(actor,v)) return false;
      if (f.status && v.status !== f.status) return false;
      if (f.teacherId && String(v.teacher_id) !== String(f.teacherId)) return false;
      if (f.from && String(v.visit_date) < f.from) return false;
      if (f.to && String(v.visit_date) > f.to) return false;
      if (f.search && (String(v.visit_code)+' '+String(v.teacher_name_snapshot)).toLowerCase().indexOf(String(f.search).toLowerCase()) < 0) return false;
      return true;
    }).sort(function(a,b){ return String(b.updated_at).localeCompare(String(a.updated_at)); }).slice(0, Number(f.limit || 100)).map(toCamel_);
  }
  return { create:create, save:save, get:get, list:list, raw:raw_, aggregate:aggregate_, toCamel:toCamel_, descriptorFor:descriptorFor_ };
})();
