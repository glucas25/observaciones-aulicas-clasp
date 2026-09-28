var Audit = (function () {
  function write(actor, action, entityType, entityId, version, requestId, result, message, metadata) {
    try {
      SheetsRepository.append('AUDIT_LOG', {
        event_id: Utilities.getUuid(), occurred_at: JsonUtil.now(), actor_user_id: actor ? actor.user_id : '',
        actor_email: actor ? actor.email : '', actor_role: actor ? actor.role : '', action: action,
        entity_type: entityType || '', entity_id: entityId || '', data_version: version || '', request_id: requestId || '',
        result: result || 'SUCCESS', message: message || '', metadata_json: JSON.stringify(metadata || {})
      });
    } catch (e) { console.error('AUDIT_FAILURE ' + e.message); }
  }
  return { write: write };
})();

