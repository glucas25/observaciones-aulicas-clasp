var SheetsRepository = (function () {
  function spreadsheet_() {
    var id = AppConfig.get().spreadsheetId;
    if (!id) throw AppErrors.validation('Configure SPREADSHEET_ID antes de usar la aplicación.');
    return SpreadsheetApp.openById(id);
  }
  function sheet_(name) {
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet) throw AppErrors.notFound('La hoja ' + name);
    return sheet;
  }
  function header_(sheet) {
    if (sheet.getLastColumn() === 0) return [];
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  function toObject_(headers, row) {
    var out = {};
    headers.forEach(function (h, i) { out[h] = row[i]; });
    return out;
  }
  function all(name) {
    var sheet = sheet_(name), headers = header_(sheet), last = sheet.getLastRow();
    if (last < 2) return [];
    return sheet.getRange(2, 1, last - 1, headers.length).getValues().map(function (r) { return toObject_(headers, r); });
  }
  function find(name, field, value) {
    var rows = all(name);
    for (var i = 0; i < rows.length; i++) if (String(rows[i][field]) === String(value)) return rows[i];
    return null;
  }
  function filter(name, predicate) { return all(name).filter(predicate); }
  function append(name, object) {
    var sheet = sheet_(name), headers = header_(sheet);
    sheet.appendRow(headers.map(function (h) { return Validation.safeCell(object[h]); }));
    return object;
  }
  function upsert(name, keyFields, object) {
    var sheet = sheet_(name), headers = header_(sheet), last = sheet.getLastRow(), rows = last < 2 ? [] : sheet.getRange(2, 1, last - 1, headers.length).getValues();
    var rowIndex = -1;
    rows.some(function (row, i) {
      var current = toObject_(headers, row);
      var match = keyFields.every(function (key) { return String(current[key]) === String(object[key]); });
      if (match) rowIndex = i + 2;
      return match;
    });
    var values = headers.map(function (h) { return Validation.safeCell(object[h]); });
    if (rowIndex < 0) sheet.appendRow(values);
    else sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
    return object;
  }
  function removeWhere(name, predicate) {
    var sheet = sheet_(name), headers = header_(sheet), last = sheet.getLastRow();
    if (last < 2) return;
    var kept = sheet.getRange(2, 1, last - 1, headers.length).getValues().filter(function (r) { return !predicate(toObject_(headers, r)); });
    sheet.getRange(2, 1, last - 1, headers.length).clearContent();
    if (kept.length) sheet.getRange(2, 1, kept.length, headers.length).setValues(kept);
  }
  function nextSequence(name, year) {
    var row = find('SEQUENCES', 'sequence_name', name);
    var value = row && Number(row.year) === Number(year) ? Number(row.last_value) + 1 : 1;
    upsert('SEQUENCES', ['sequence_name'], { sequence_name: name, year: year, last_value: value, updated_at: JsonUtil.now() });
    return value;
  }
  return { spreadsheet: spreadsheet_, all: all, find: find, filter: filter, append: append, upsert: upsert, removeWhere: removeWhere, nextSequence: nextSequence };
})();

