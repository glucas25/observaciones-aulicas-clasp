var CatalogService = (function () {
  function active_(name) {
    return SheetsRepository.filter(name, function (r) { return String(r.active).toLowerCase() !== 'false'; });
  }
  function getAll() {
    var user = Auth.current();
    var users = active_('USERS');
    var teachers = users.map(function (u) {
      return {
        teacher_id: u.user_id,
        teacher_code: u.user_code || ('DOC-' + String(u.user_id).slice(0, 6).toUpperCase()),
        institution_id: u.institution_id,
        identity_reference: u.identity_reference || '',
        full_name: u.display_name,
        email: u.email || '',
        position: u.position || 'Docente',
        role: u.role,
        active: u.active
      };
    });
    if (teachers.length === 0) {
      try { teachers = active_('TEACHERS'); } catch (e) {}
    }
    var userRoles = String(user.role || '').split(',').map(function (r) { return r.trim().toUpperCase(); });
    if (userRoles.indexOf('ADMIN') < 0) teachers = teachers.filter(function (t) { return String(t.institution_id) === String(user.institution_id); });

    var evaluators = users.filter(function (u) {
      var roles = String(u.role || '').split(',').map(function (r) { return r.trim().toUpperCase(); });
      return roles.indexOf('ADMIN') >= 0 || roles.indexOf('DIRECTIVE') >= 0 || roles.indexOf('EVALUATOR') >= 0;
    }).map(function (u) {
      return {
        user_id: u.user_id,
        display_name: u.display_name,
        email: u.email || '',
        position: u.position || '',
        role: u.role,
        institution_id: u.institution_id
      };
    });
    if (userRoles.indexOf('ADMIN') < 0) {
      evaluators = evaluators.filter(function (e) { return String(e.institution_id) === String(user.institution_id); });
    }

    var assignments = [];
    try {
      var allAssignments = active_('EVALUATOR_ASSIGNMENTS');
      var userMap = {};
      users.forEach(function (u) { userMap[u.user_id] = u; });
      teachers.forEach(function (t) { userMap[t.teacher_id] = t; });
      assignments = allAssignments.map(function (a) {
        var ev = userMap[a.evaluator_user_id] || {};
        var co = a.co_evaluator_user_id ? (userMap[a.co_evaluator_user_id] || {}) : null;
        var tch = userMap[a.teacher_id] || {};
        return {
          assignment_id: a.assignment_id,
          evaluator_user_id: a.evaluator_user_id,
          evaluator_name: ev.display_name || ev.full_name || a.evaluator_user_id,
          evaluator_position: ev.position || '',
          co_evaluator_user_id: a.co_evaluator_user_id || '',
          co_evaluator_name: co ? (co.display_name || co.full_name || a.co_evaluator_user_id) : '',
          co_evaluator_position: co ? (co.position || '') : '',
          teacher_id: a.teacher_id,
          teacher_name: tch.full_name || tch.display_name || a.teacher_id,
          teacher_position: tch.position || 'Docente',
          effective_from: a.effective_from || '',
          effective_to: a.effective_to || '',
          active: a.active
        };
      });
    } catch (e) {
      console.warn('EVALUATOR_ASSIGNMENTS unavailable: ' + e.message);
    }

    return {
      teachers: teachers,
      evaluators: evaluators,
      assignments: assignments,
      institutions: active_('INSTITUTIONS'),
      generalCriteria: active_('GENERAL_CRITERIA').sort(function (a,b) { return Number(a.sort_order)-Number(b.sort_order); }),
      rubricCriteria: active_('RUBRIC_CRITERIA').sort(function (a,b) { return Number(a.sort_order)-Number(b.sort_order); }),
      evidenceChecks: active_('EVIDENCE_CHECK_TYPES').sort(function (a,b) { return Number(a.sort_order)-Number(b.sort_order); }),
      aiEnabled: AppConfig.get().aiEnabled
    };
  }
  return { getAll: getAll };
})();

