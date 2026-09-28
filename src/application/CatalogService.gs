var CatalogService = (function () {
  function active_(name) {
    return SheetsRepository.filter(name, function (r) { return String(r.active).toLowerCase() !== 'false'; });
  }
  function getAll() {
    var user = Auth.current();
    var teachers = active_('TEACHERS');
    if (user.role !== 'ADMIN') teachers = teachers.filter(function (t) { return String(t.institution_id) === String(user.institution_id); });
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

