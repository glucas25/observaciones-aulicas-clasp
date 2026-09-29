function setupProject(options) {
  options = options || {};
  var props = PropertiesService.getScriptProperties();
  if (options.properties) props.setProperties(options.properties, false);
  var config = AppConfig.get();
  var ss = config.spreadsheetId ? SpreadsheetApp.openById(config.spreadsheetId) : SpreadsheetApp.create('Visitas Aulicas - ' + config.environment);
  if (!config.spreadsheetId) props.setProperty('SPREADSHEET_ID', ss.getId());
  SheetSchema.names().forEach(function (name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var expected = SheetSchema.all[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, expected.length).setValues([expected]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    } else {
      var actual = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw AppErrors.validation('El esquema de ' + name + ' no coincide.');
    }
  });
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
  seedCatalogs();
  return { spreadsheetId: ss.getId(), url: ss.getUrl() };
}

function bootstrapAdmin(email, displayName) {
  var normalized = String(email || '').trim().toLowerCase();
  if (!normalized) throw AppErrors.validation('Indique el correo del administrador.');
  var institutions = SheetsRepository.all('INSTITUTIONS');
  var institution = institutions[0] || {
    institution_id: Utilities.getUuid(), institution_code: 'INS-001', name: 'Institución por configurar', active: true,
    created_at: JsonUtil.now(), updated_at: JsonUtil.now()
  };
  SheetsRepository.upsert('INSTITUTIONS', ['institution_id'], institution);
  return SheetsRepository.upsert('USERS', ['email'], {
    user_id: Utilities.getUuid(), email: normalized, display_name: displayName || normalized, role: 'ADMIN',
    institution_id: institution.institution_id, active: true, created_at: JsonUtil.now(), updated_at: JsonUtil.now()
  });
}

/**
 * Punto de entrada sin argumentos para crear el primer administrador desde el
 * editor de Apps Script. Usa la identidad de la cuenta que ejecuta la función.
 */
function bootstrapCurrentUserAsAdmin() {
  var email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) {
    throw AppErrors.auth('No se pudo obtener el correo de la cuenta ejecutora. Use una cuenta institucional autorizada.');
  }
  return bootstrapAdmin(email, email);
}
