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
  function userRoles_(user) {
    return String(user.role || '').split(',').map(function (r) { return r.trim().toUpperCase(); });
  }
  function hasRole(user, role) {
    var roles = userRoles_(user);
    return roles.indexOf('ADMIN') >= 0 || roles.indexOf(String(role).toUpperCase()) >= 0;
  }
  function requireRoles(roles) {
    var user = current();
    var userRoles = userRoles_(user);
    var has = userRoles.indexOf('ADMIN') >= 0 || roles.some(function (r) { return userRoles.indexOf(String(r).toUpperCase()) >= 0; });
    if (!has) throw AppErrors.forbidden();
    return user;
  }
  function canAccessVisit(user, visit) {
    var userRoles = userRoles_(user);
    if (userRoles.indexOf('ADMIN') >= 0 || userRoles.indexOf('VIEWER') >= 0) return true;
    if (String(visit.evaluator_user_id) === String(user.user_id)) return true;
    if (visit.co_evaluator_user_id && String(visit.co_evaluator_user_id) === String(user.user_id)) return true;
    if (String(visit.teacher_id) === String(user.user_id)) return true;
    return false;
  }
  function assertVisit(user, visit, edit) {
    if (!canAccessVisit(user, visit)) throw AppErrors.forbidden();
    var userRoles = userRoles_(user);
    if (edit) {
      if (userRoles.indexOf('ADMIN') >= 0) return;
      if (userRoles.indexOf('VIEWER') >= 0) throw AppErrors.forbidden();
      var isLead = String(visit.evaluator_user_id) === String(user.user_id);
      var isCo = visit.co_evaluator_user_id && String(visit.co_evaluator_user_id) === String(user.user_id);
      if (!isLead && !isCo) throw AppErrors.forbidden();
    }
  }
  return { current: current, requireRoles: requireRoles, assertVisit: assertVisit, canAccessVisit: canAccessVisit, hasRole: hasRole };
})();

