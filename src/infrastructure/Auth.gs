var Auth = (function () {
  function email_() { return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); }
  function current() {
    var email = email_();
    if (!email) throw AppErrors.auth();
    var user = SheetsRepository.find('USERS', 'email', email);
    if (!user || String(user.active).toLowerCase() === 'false') throw AppErrors.forbidden();
    user.email = email;
    return user;
  }
  function requireRoles(roles) {
    var user = current();
    if (roles.indexOf(String(user.role)) < 0) throw AppErrors.forbidden();
    return user;
  }
  function teacherForUser(user) {
    var email = String(user && user.email || '').trim().toLowerCase();
    if (!email) return null;
    return SheetsRepository.filter('TEACHERS', function (teacher) {
      return String(teacher.email || '').trim().toLowerCase() === email &&
        String(teacher.active).toLowerCase() !== 'false';
    })[0] || null;
  }
  function isReceivedVisit_(user, visit) {
    var teacher = teacherForUser(user);
    return !!teacher && String(visit.teacher_id) === String(teacher.teacher_id);
  }
  function isPublished_(visit) {
    return ['FINALIZED','DOCUMENTS_GENERATED'].indexOf(String(visit.status)) >= 0;
  }
  function canViewVisit(user, visit) {
    if (user.role === 'ADMIN') return true;
    if (user.role === 'DIRECTIVE') return String(visit.institution_id) === String(user.institution_id);
    if (String(visit.evaluator_user_id) === String(user.user_id)) return true;
    return isReceivedVisit_(user, visit) && isPublished_(visit);
  }
  function canEditVisit(user, visit) {
    if (user.role === 'ADMIN') return true;
    return ['DIRECTIVE','EVALUATOR'].indexOf(String(user.role)) >= 0 &&
      String(visit.evaluator_user_id) === String(user.user_id);
  }
  function assertVisit(user, visit, edit) {
    if (!(edit ? canEditVisit(user, visit) : canViewVisit(user, visit))) throw AppErrors.forbidden();
  }
  function hasActiveAssignment(user, teacher, visitDate) {
    if (user.role === 'ADMIN') return true;
    if (['DIRECTIVE','EVALUATOR'].indexOf(String(user.role)) < 0) return false;
    var date = String(visitDate || '').slice(0,10);
    return SheetsRepository.filter('EVALUATOR_ASSIGNMENTS', function (row) {
      return String(row.active).toLowerCase() !== 'false' &&
        String(row.evaluator_user_id) === String(user.user_id) &&
        String(row.teacher_id) === String(teacher.teacher_id) &&
        (!row.effective_from || String(row.effective_from).slice(0,10) <= date) &&
        (!row.effective_to || String(row.effective_to).slice(0,10) >= date);
    }).length > 0;
  }
  function assertCanCreate(user, teacher, visitDate) {
    if (user.role !== 'ADMIN' && String(teacher.institution_id) !== String(user.institution_id)) throw AppErrors.forbidden();
    if (user.role !== 'ADMIN' && String(teacher.email || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase()) {
      throw AppErrors.forbidden('No puede crear una evaluación para usted mismo.');
    }
    if (!hasActiveAssignment(user, teacher, visitDate)) throw AppErrors.forbidden('El docente no está asignado a este evaluador para la fecha indicada.');
  }
  return {
    current:current, requireRoles:requireRoles, teacherForUser:teacherForUser,
    canViewVisit:canViewVisit, canEditVisit:canEditVisit, assertVisit:assertVisit,
    hasActiveAssignment:hasActiveAssignment, assertCanCreate:assertCanCreate
  };
})();
