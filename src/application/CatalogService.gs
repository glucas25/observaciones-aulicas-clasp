var CatalogService = (function () {
  function active_(name) {
    return SheetsRepository.filter(name, function (r) { return String(r.active).toLowerCase() !== 'false'; });
  }
  function getAll() {
    var user = Auth.current();
    var teachers = active_('TEACHERS');
    if (user.role !== 'ADMIN') {
      var assigned = {}, today = new Date().toISOString().slice(0,10);
      active_('EVALUATOR_ASSIGNMENTS').forEach(function (row) {
        if (String(row.evaluator_user_id) === String(user.user_id) && (!row.effective_from || String(row.effective_from).slice(0,10) <= today) && (!row.effective_to || String(row.effective_to).slice(0,10) >= today)) assigned[String(row.teacher_id)] = true;
      });
      teachers = teachers.filter(function (teacher) {
        return assigned[String(teacher.teacher_id)] && String(teacher.institution_id) === String(user.institution_id) && String(teacher.email || '').trim().toLowerCase() !== String(user.email || '').trim().toLowerCase();
      });
    }
    return {
      teachers: teachers,
      institutions: active_('INSTITUTIONS'),
      generalCriteria: active_('GENERAL_CRITERIA').sort(function (a,b) { return Number(a.sort_order)-Number(b.sort_order); }),
      rubricCriteria: active_('RUBRIC_CRITERIA').sort(function (a,b) { return Number(a.sort_order)-Number(b.sort_order); }),
      evidenceChecks: active_('EVIDENCE_CHECK_TYPES').sort(function (a,b) { return Number(a.sort_order)-Number(b.sort_order); }),
      aiEnabled: AppConfig.get().aiEnabled
    };
  }
  return { getAll: getAll };
})();

