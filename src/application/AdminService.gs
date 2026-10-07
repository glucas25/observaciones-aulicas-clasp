var AdminService = (function () {
  function saveInstitution(dto, requestId) {
    var actor = Auth.requireRoles(['ADMIN']), now = JsonUtil.now(), current = dto.institutionId ? SheetsRepository.find('INSTITUTIONS', 'institution_id', dto.institutionId) : null;
    var row = { institution_id: dto.institutionId || Utilities.getUuid(), institution_code: dto.institutionCode || (current && current.institution_code) || 'INS-001', name: Validation.required(dto.name || (current && current.name), 'Nombre de institución', 250), location: Validation.text(dto.location != null ? dto.location : (current && current.location), 250), zone: Validation.text(dto.zone != null ? dto.zone : (current && current.zone), 50), district: Validation.text(dto.district != null ? dto.district : (current && current.district), 50), circuit: Validation.text(dto.circuit != null ? dto.circuit : (current && current.circuit), 50), address: Validation.text(dto.address != null ? dto.address : (current && current.address), 500), default_shift: Validation.text(dto.defaultShift != null ? dto.defaultShift : (current && current.default_shift), 50), active: dto.active !== false, created_at: current ? current.created_at : now, updated_at: now };
    SheetsRepository.upsert('INSTITUTIONS', ['institution_id'], row); Audit.write(actor, 'INSTITUTION_SAVED', 'INSTITUTION', row.institution_id, '', requestId, 'SUCCESS', 'Institución guardada'); return row;
  }
  function saveUser(dto, requestId) {
    var actor = Auth.requireRoles(['ADMIN']);
    var rawRoles = Array.isArray(dto.roles) ? dto.roles.join(',') : String(dto.role || 'TEACHER');
    var rolesList = rawRoles.split(',').map(function (r) { return r.trim().toUpperCase(); }).filter(Boolean);
    if (rolesList.length === 0) rolesList = ['TEACHER'];
    var valid = ['ADMIN', 'DIRECTIVE', 'EVALUATOR', 'TEACHER', 'VIEWER'];
    rolesList.forEach(function (r) {
      if (valid.indexOf(r) < 0) throw AppErrors.validation('Rol inválido: ' + r);
    });
    var roleStr = rolesList.join(',');
    var email = Validation.text(dto.email, 250).toLowerCase();
    var userId = dto.userId || Utilities.getUuid();
    var current = null;
    if (dto.userId) {
      current = SheetsRepository.find('USERS', 'user_id', dto.userId);
    }
    if (!current && email) {
      current = SheetsRepository.find('USERS', 'email', email);
      if (current) userId = current.user_id;
    }
    if (email) {
      var dup = SheetsRepository.filter('USERS', function (u) {
        return String(u.email || '').trim().toLowerCase() === email && String(u.user_id) !== String(userId) && String(u.active).toLowerCase() !== 'false';
      })[0];
      if (dup) throw AppErrors.validation('El correo ya pertenece a otro usuario activo.');
    }
    var now = JsonUtil.now();
    var row = {
      user_id: userId,
      email: email,
      display_name: Validation.required(dto.displayName || (current && current.display_name), 'Nombre', 250),
      role: roleStr,
      position: Validation.text(dto.position != null ? dto.position : (current && current.position), 100) || 'Docente',
      user_code: dto.userCode || (current && current.user_code) || ('DOC-' + Utilities.getUuid().slice(0, 6).toUpperCase()),
      identity_reference: Validation.text(dto.identityReference != null ? dto.identityReference : (current && current.identity_reference), 100),
      institution_id: Validation.required(dto.institutionId || (current && current.institution_id), 'Institución', 100),
      active: dto.active !== false,
      created_at: current ? current.created_at : now,
      updated_at: now,
      last_access_at: current ? current.last_access_at : ''
    };
    SheetsRepository.upsert('USERS', ['user_id'], row);
    Audit.write(actor, 'USER_SAVED', 'USER', row.user_id, '', requestId, 'SUCCESS', 'Personal institucional guardado');
    return row;
  }
  function saveTeacher(dto, requestId) {
    var actor = Auth.requireRoles(['ADMIN']), current = dto.teacherId ? SheetsRepository.find('TEACHERS', 'teacher_id', dto.teacherId) : null, now = JsonUtil.now(), email = Validation.text(dto.email, 250).toLowerCase();
    var duplicate = email && SheetsRepository.filter('TEACHERS', function (t) { return String(t.email || '').trim().toLowerCase() === email && String(t.teacher_id) !== String(dto.teacherId || '') && String(t.active).toLowerCase() !== 'false'; })[0];
    if (duplicate) throw AppErrors.validation('El correo ya pertenece a otro docente activo.');
    var row = {
      teacher_id: dto.teacherId || Utilities.getUuid(),
      teacher_code: dto.teacherCode || (current && current.teacher_code) || ('DOC-' + Utilities.getUuid().slice(0, 6).toUpperCase()),
      institution_id: Validation.required(dto.institutionId || (current && current.institution_id), 'Institución', 100),
      identity_reference: Validation.text(dto.identityReference != null ? dto.identityReference : (current && current.identity_reference), 100),
      full_name: Validation.required(dto.fullName || (current && current.full_name), 'Nombre del docente', 250),
      email: email,
      active: dto.active !== false,
      created_at: current ? current.created_at : now,
      updated_at: now,
      user_id: dto.userId != null ? dto.userId : (current && current.user_id) || ''
    };
    SheetsRepository.upsert('TEACHERS', ['teacher_id'], row);
    Audit.write(actor, 'TEACHER_SAVED', 'TEACHER', row.teacher_id, '', requestId, 'SUCCESS', 'Docente guardado');
    return row;
  }
  function enableTeacherEvaluator(dto, requestId) {
    var actor = Auth.requireRoles(['ADMIN']);
    SheetsRepository.ensureColumns('TEACHERS', SheetSchema.all.TEACHERS);
    var teacher = SheetsRepository.find('TEACHERS', 'teacher_id', String(dto.teacherId || ''));
    if (!teacher || String(teacher.active).toLowerCase() === 'false') throw AppErrors.validation('Seleccione un docente activo.');
    var email = Validation.required(dto.email || teacher.email, 'Correo del docente', 250).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw AppErrors.validation('El correo del docente no es válido.');
    var duplicateTeacher = SheetsRepository.filter('TEACHERS', function (candidate) {
      return String(candidate.teacher_id) !== String(teacher.teacher_id) && String(candidate.email || '').trim().toLowerCase() === email && String(candidate.active).toLowerCase() !== 'false';
    })[0];
    if (duplicateTeacher) throw AppErrors.validation('El correo ya pertenece a otro docente activo.');
    var user = SheetsRepository.filter('USERS', function (candidate) { return String(candidate.email || '').trim().toLowerCase() === email; })[0] || null, now = JsonUtil.now();
    if (user && String(user.institution_id) !== String(teacher.institution_id)) throw AppErrors.validation('La cuenta existente pertenece a otra institución.');
    if (user && String(user.role) === 'ADMIN') throw AppErrors.validation('La cuenta corresponde a un administrador y no puede convertirse en evaluador.');
    var userRow = {
      user_id: user ? user.user_id : Utilities.getUuid(), email: email, display_name: teacher.full_name, role: user && ['DIRECTIVE', 'EVALUATOR'].indexOf(String(user.role)) >= 0 ? user.role : 'EVALUATOR',
      institution_id: teacher.institution_id, active: true, created_at: user ? user.created_at : now, updated_at: now, last_access_at: user ? user.last_access_at : ''
    };
    SheetsRepository.upsert('USERS', ['email'], userRow);
    teacher.email = email; teacher.user_id = userRow.user_id; teacher.updated_at = now;
    SheetsRepository.upsert('TEACHERS', ['teacher_id'], teacher);
    Audit.write(actor, 'TEACHER_EVALUATOR_ENABLED', 'TEACHER', teacher.teacher_id, '', requestId, 'SUCCESS', 'Docente habilitado como evaluador', { userId: userRow.user_id });
    return { teacher: teacher, user: userRow };
  }
  function saveAssignment(dto, requestId) {
    var actor = Auth.requireRoles(['ADMIN']), now = JsonUtil.now();
    var current = dto.assignmentId ? SheetsRepository.find('EVALUATOR_ASSIGNMENTS', 'assignment_id', String(dto.assignmentId)) : null;
    var activating = dto.active !== false;

    // Validar evaluador
    var evaluator = SheetsRepository.find('USERS', 'user_id', String(dto.evaluatorUserId || ''));
    if (!evaluator || (activating && String(evaluator.active).toLowerCase() === 'false')) throw AppErrors.validation('El evaluador no existe o está inactivo.');
    var evRoles = String(evaluator.role || '').split(',').map(function (r) { return r.trim().toUpperCase(); });
    var canEval = ['ADMIN', 'DIRECTIVE', 'EVALUATOR'].some(function (r) { return evRoles.indexOf(r) >= 0; });
    if (!canEval) throw AppErrors.validation('El usuario seleccionado no tiene permiso para evaluar (ADMIN, DIRECTIVE o EVALUATOR).');

    // Validar docente
    var teacher = SheetsRepository.find('TEACHERS', 'teacher_id', String(dto.teacherId || '')) || SheetsRepository.find('USERS', 'user_id', String(dto.teacherId || ''));
    if (!teacher || (activating && String(teacher.active).toLowerCase() === 'false')) throw AppErrors.validation('El docente no existe o está inactivo.');

    // Misma institución
    if (String(evaluator.institution_id) !== String(teacher.institution_id)) throw AppErrors.validation('El evaluador y el docente deben pertenecer a la misma institución.');

    // No autoevaluación
    var evId = String(evaluator.user_id), tchId = String(teacher.teacher_id || teacher.user_id);
    if (evId === tchId) throw AppErrors.validation('Un evaluador no puede ser asignado a observarse a sí mismo.');
    var evEmail = String(evaluator.email || '').trim().toLowerCase(), tchEmail = String(teacher.email || '').trim().toLowerCase();
    if (evEmail && tchEmail && evEmail === tchEmail) throw AppErrors.validation('Un evaluador no puede ser asignado a observarse a sí mismo.');

    // Vigencia coherente
    var from = dto.effectiveFrom ? String(dto.effectiveFrom).slice(0, 10) : '', to = dto.effectiveTo ? String(dto.effectiveTo).slice(0, 10) : '';
    if (from && to && from > to) throw AppErrors.validation('La fecha de inicio no puede ser posterior a la fecha de fin.');

    // Validar segundo evaluador si se envía
    var coId = '';
    if (dto.coEvaluatorUserId) {
      var coEvaluator = SheetsRepository.find('USERS', 'user_id', String(dto.coEvaluatorUserId));
      if (!coEvaluator || String(coEvaluator.active).toLowerCase() === 'false') throw AppErrors.validation('El segundo evaluador no existe o está inactivo.');
      if (String(coEvaluator.user_id) === evId) throw AppErrors.validation('El segundo evaluador no puede ser el mismo evaluador principal.');
      if (String(coEvaluator.user_id) === tchId) throw AppErrors.validation('El segundo evaluador no puede ser el docente observado.');
      var coRoles = String(coEvaluator.role || '').split(',').map(function (r) { return r.trim().toUpperCase(); });
      var canCoEval = ['ADMIN', 'DIRECTIVE', 'EVALUATOR'].some(function (r) { return coRoles.indexOf(r) >= 0; });
      if (!canCoEval) throw AppErrors.validation('El segundo evaluador no tiene permiso para evaluar.');
      if (String(coEvaluator.institution_id) !== String(teacher.institution_id)) throw AppErrors.validation('El segundo evaluador debe pertenecer a la misma institución.');
      coId = coEvaluator.user_id;
    }

    var row = {
      assignment_id: dto.assignmentId || Utilities.getUuid(),
      evaluator_user_id: evaluator.user_id,
      teacher_id: tchId,
      effective_from: from,
      effective_to: to,
      active: dto.active !== false,
      created_at: current ? current.created_at : now,
      created_by: current ? current.created_by : actor.user_id,
      co_evaluator_user_id: coId
    };
    SheetsRepository.upsert('EVALUATOR_ASSIGNMENTS', ['assignment_id'], row);
    Audit.write(actor, 'ASSIGNMENT_SAVED', 'EVALUATOR_ASSIGNMENT', row.assignment_id, '', requestId, 'SUCCESS', 'Asignación guardada');
    return row;
  }
  function data() {
    Auth.requireRoles(['ADMIN']);
    var users = [], teachers = [], institutions = [], assignments = [], auditRows = [];
    try { users = SheetsRepository.all('USERS'); } catch (e) { console.warn('USERS unavailable: ' + e.message); }
    try { institutions = SheetsRepository.all('INSTITUTIONS'); } catch (e) { console.warn('INSTITUTIONS unavailable: ' + e.message); }
    try { assignments = SheetsRepository.all('EVALUATOR_ASSIGNMENTS'); } catch (e) { console.warn('EVALUATOR_ASSIGNMENTS unavailable: ' + e.message); }
    try { teachers = SheetsRepository.all('TEACHERS'); } catch (e) { console.warn('TEACHERS unavailable: ' + e.message); }
    if (teachers.length === 0 && users.length > 0) {
      teachers = users.map(function (u) {
        return {
          teacher_id: u.user_id,
          teacher_code: u.user_code || ('DOC-' + String(u.user_id).slice(0, 6).toUpperCase()),
          institution_id: u.institution_id,
          identity_reference: u.identity_reference || '',
          full_name: u.display_name,
          email: u.email || '',
          position: u.position || 'Docente',
          role: u.role,
          active: u.active,
          user_id: u.user_id
        };
      });
    }
    try { auditRows = SheetsRepository.recent ? SheetsRepository.recent('AUDIT_LOG', 200).reverse() : SheetsRepository.all('AUDIT_LOG').slice(-200).reverse(); } catch (e) { console.warn('AUDIT_LOG unavailable: ' + e.message); }
    return {
      users: users || [],
      teachers: teachers || [],
      institutions: institutions || [],
      assignments: assignments || [],
      audit: auditRows || []
    };
  }
  function getAudit(limit) {
    Auth.requireRoles(['ADMIN']);
    var max = Math.min(Math.max(Number(limit) || 50, 1), 200);
    try {
      return SheetsRepository.recent ? SheetsRepository.recent('AUDIT_LOG', max).reverse() : SheetsRepository.all('AUDIT_LOG').slice(-max).reverse();
    } catch (e) {
      console.warn('AUDIT_LOG unavailable: ' + e.message);
      return [];
    }
  }
  return {
    saveInstitution: saveInstitution,
    saveUser: saveUser,
    saveTeacher: saveTeacher,
    enableTeacherEvaluator: enableTeacherEvaluator,
    saveAssignment: saveAssignment,
    data: data,
    getAudit: getAudit
  };
})();
