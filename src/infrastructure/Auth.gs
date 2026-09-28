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
  function canAccessVisit(user, visit) {
    return user.role === 'ADMIN' || user.role === 'VIEWER' || String(visit.evaluator_user_id) === String(user.user_id);
  }
  function assertVisit(user, visit, edit) {
    if (!canAccessVisit(user, visit)) throw AppErrors.forbidden();
    if (edit && user.role === 'VIEWER') throw AppErrors.forbidden();
  }
  return { current: current, requireRoles: requireRoles, assertVisit: assertVisit };
})();

