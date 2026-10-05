var SheetsRepository = (function () {
  var _ss = null;
  var _sheets = {};
  function spreadsheet_() {
    if (_ss) return _ss;
    var id = AppConfig.get().spreadsheetId;
    if (!id) throw AppErrors.validation('Configure SPREADSHEET_ID antes de usar la aplicación.');
    _ss = SpreadsheetApp.openById(id);
    return _ss;
  }
  function sheet_(name) {
    if (_sheets[name]) return _sheets[name];
    var sheet = spreadsheet_().getSheetByName(name);
    if (!sheet) throw AppErrors.notFound('La hoja ' + name);
    _sheets[name] = sheet;
    return sheet;
  }
  function header_(sheet) {
    if (sheet.getLastColumn() === 0) return [];
    return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  function toObject_(headers, row) {
    var out = {};
    headers.forEach(function (h, i) {
      var val = row[i];
      if (val instanceof Date) {
        if (isNaN(val.getTime())) {
          val = '';
        } else if (h === 'visit_date' || h === 'effective_from' || h === 'effective_to') {
          try {
            val = Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Guayaquil', 'yyyy-MM-dd');
          } catch(e) {
            var y = val.getFullYear(), m = ('0' + (val.getMonth() + 1)).slice(-2), d = ('0' + val.getDate()).slice(-2);
            val = y + '-' + m + '-' + d;
          }
        } else if (h === 'class_start_time') {
          try {
            val = Utilities.formatDate(val, Session.getScriptTimeZone() || 'America/Guayaquil', 'HH:mm');
          } catch(e) {
            var hr = ('0' + val.getHours()).slice(-2), mn = ('0' + val.getMinutes()).slice(-2);
            val = hr + ':' + mn;
          }
        } else {
          val = val.toISOString();
        }
      } else if (typeof val === 'string' && val) {
        if ((h === 'visit_date' || h === 'effective_from' || h === 'effective_to') && val.indexOf('T') >= 0) {
          val = val.slice(0, 10);
        } else if (h === 'class_start_time') {
          var tm = val.match(/(\d{2}:\d{2})/);
          if (tm) val = tm[1];
        }
      }
      out[h] = (val === undefined || val === null) ? '' : val;
    });
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
    _sheets[name] = null; // invalida cache tras escritura
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
    _sheets[name] = null; // invalida cache tras escritura
    return object;
  }
  function removeWhere(name, predicate) {
    var sheet = sheet_(name), headers = header_(sheet), last = sheet.getLastRow();
    if (last < 2) return;
    var kept = sheet.getRange(2, 1, last - 1, headers.length).getValues().filter(function (r) { return !predicate(toObject_(headers, r)); });
    sheet.getRange(2, 1, last - 1, headers.length).clearContent();
    if (kept.length) sheet.getRange(2, 1, kept.length, headers.length).setValues(kept);
    _sheets[name] = null; // invalida cache tras escritura
  }
  function nextSequence(name, year) {
    var row = find('SEQUENCES', 'sequence_name', name);
    var value = row && Number(row.year) === Number(year) ? Number(row.last_value) + 1 : 1;
    upsert('SEQUENCES', ['sequence_name'], { sequence_name: name, year: year, last_value: value, updated_at: JsonUtil.now() });
    return value;
  }
  return { spreadsheet: spreadsheet_, all: all, find: find, filter: filter, append: append, upsert: upsert, removeWhere: removeWhere, nextSequence: nextSequence };
})();



