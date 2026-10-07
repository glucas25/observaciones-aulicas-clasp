function setupProject(options) {
  options = options || {};

  var props = PropertiesService.getScriptProperties();

  if (options.properties) props.setProperties(options.properties, false);

  var config = AppConfig.get();
  var ss = config.spreadsheetId ? SpreadsheetApp.openById(config.spreadsheetId) : SpreadsheetApp.create('Visitas Aulicas - ' + config.environment);
  if (!config.spreadsheetId) props.setProperty('SPREADSHEET_ID', ss.getId());
  upgradeSheetSchema();
  var defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('Hoja 1');
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet);
  seedCatalogs();
  return { spreadsheetId: ss.getId(), url: ss.getUrl() };
}

function upgradeSheetSchema() {
  var config = AppConfig.get();
  if (!config.spreadsheetId) throw AppErrors.validation('Configure SPREADSHEET_ID antes de migrar el esquema.');
  var ss = SpreadsheetApp.openById(config.spreadsheetId);
  var report = {};
  SheetSchema.names().forEach(function (name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    var expected = SheetSchema.all[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, expected.length).setValues([expected]).setFontWeight('bold');
      sheet.setFrozenRows(1);
      report[name] = 'Creada con ' + expected.length + ' columnas';
    } else {
      var actual = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var missing = expected.filter(function (col) { return actual.indexOf(col) < 0; });
      if (missing.length > 0) {
        var startCol = actual.length + 1;
        sheet.getRange(1, startCol, 1, missing.length).setValues([missing]).setFontWeight('bold');
        report[name] = 'Agregadas: ' + missing.join(', ');
      } else {
        report[name] = 'Al día';
      }
    }
  });
  return report;
}

function migrateProjectSchema() {
  Auth.requireRoles(['ADMIN']);
  SheetSchema.names().forEach(function (name) { SheetsRepository.ensureColumns(name, SheetSchema.all[name]); });
  return { migrated: true, schemaVersion: 2 };
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
    user_id: Utilities.getUuid(), email: normalized, display_name: displayName || normalized, role: 'ADMIN,EVALUATOR', position: 'Rector / Rectora',
    institution_id: institution.institution_id, active: true, created_at: JsonUtil.now(), updated_at: JsonUtil.now()
  });
}
