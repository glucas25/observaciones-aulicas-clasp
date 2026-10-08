var DocsGateway = (function () {
  var labels = {
    ACHIEVED: 'Logrado',
    IN_PROGRESS: 'En proceso',
    BEGINNING: 'En inicio',
    NOT_APPLICABLE: 'No aplica',
    FULLY_AGREE: 'Totalmente de acuerdo',
    DISAGREE: 'En desacuerdo'
  };

  var DocColors = {
    PURPLE_DARK: '#A02B93',
    PURPLE_MID: '#D86DCB',
    PURPLE_LIGHT: '#F2CEED',
    GRAY_HEADER: '#DDD9C3',
    BORDER: '#777777'
  };

  var MOMENT_CONFIG = [
    { key: 'INITIAL', title: 'MOMENTO INICIAL (ANTICIPACIÓN)', criteria: [1, 2] },
    { key: 'DEVELOPMENT', title: 'MOMENTO DE DESARROLLO (CONSTRUCCIÓN DEL CONOCIMIENTO)', criteria: [3, 4, 5, 6, 7, 8] },
    { key: 'CONSOLIDATION', title: 'MOMENTO DE CONSOLIDACIÓN Y EVALUACIÓN', criteria: [9, 10, 11] },
    { key: 'CLASSROOM_CLIMATE', title: 'CLIMA DE AULA', criteria: [12, 13, 14, 15] }
  ];

  function line_(values) {
    return (values || []).filter(function (v) { return v !== '' && v != null; }).join(' · ');
  }

  function cleanName_(name) {
    return String(name || '').replace(/\s*\([^)]*\)/g, '').trim();
  }

  function getEvaluatorRoleLabel_(nameSnapshot, explicitPosition) {
    var pos = explicitPosition || '';
    if (!pos && nameSnapshot) {
      var match = String(nameSnapshot).match(/\(([^)]+)\)/);
      if (match) pos = match[1].trim();
    }
    if (!pos) return 'DIRECTIVO O SU DELEGADO';

    var pLower = pos.toLowerCase();
    if (pLower.indexOf('docente') >= 0 || pLower.indexOf('profesor') >= 0) {
      return 'DELEGADO';
    }
    if (pLower.indexOf('vicerrec') >= 0) return 'VICERRECTOR';
    if (pLower.indexOf('rector') >= 0) return 'RECTOR';
    if (pLower.indexOf('dece') >= 0) return 'DECE';
    if (pLower.indexOf('coordinad') >= 0) return 'COORDINADOR DE ÁREA';
    if (pLower.indexOf('inspector') >= 0) return 'INSPECTOR GENERAL';
    if (pLower.indexOf('directiv') >= 0 || pLower.indexOf('autoridad') >= 0) return 'DIRECTIVO';
    if (pLower.indexOf('administrati') >= 0) return 'ADMINISTRATIVO';

    return pos.toUpperCase();
  }

  function signaturesBlock_(snapshot) {
    var rawEv1 = snapshot.evaluatorNameSnapshot || 'Evaluador / Directivo';
    var rawTeacher = snapshot.teacherNameSnapshot || 'Docente';
    var rawCo = snapshot.coEvaluatorNameSnapshot;
    var evRole = getEvaluatorRoleLabel_(rawEv1, snapshot.evaluatorPosition);
    var coRole = rawCo ? getEvaluatorRoleLabel_(rawCo, snapshot.coEvaluatorPosition) : '';
    var ev1 = cleanName_(rawEv1);
    var teacher = cleanName_(rawTeacher);
    var co = rawCo ? cleanName_(rawCo) : '';
    if (co) {
      return '\n\n____________________________          ____________________________          ____________________________\n' +
        evRole + ':                   ' + coRole + ':                     DOCENTE:\n' +
        ev1 + '                     ' + co + '                     ' + teacher;
    }
    return '\n\n____________________________                                ____________________________\n' +
      evRole + ':                                      DOCENTE:\n' +
      ev1 + '                                              ' + teacher;
  }

  function replacements(snapshot, type) {
    snapshot = snapshot || {};
    var general = (snapshot.generalResponses || []).map(function (r, i) {
      return (r.criterionCode || i + 1) + '. ' + (r.criterionText || '') + '\n' +
        (labels[r.result] || r.result) + (r.argument ? ' — ' + r.argument : '');
    }).join('\n\n');

    var rubric = (snapshot.rubricResponses || []).map(function (r, i) {
      return (r.criterionCode || i + 1) + '. ' + (r.criterionTitle || '') + '\n' +
        (labels[r.level] || r.level) +
        (r.descriptorSnapshot ? ' — ' + r.descriptorSnapshot : '') +
        (r.observation ? ' | Obs.: ' + r.observation : '');
    }).join('\n\n');

    var evidence = (snapshot.evidenceChecks || []).map(function (r) {
      return (r.isChecked ? '☒ ' : '☐ ') + (r.label || r.checkTypeId) + (r.observation ? ' — ' + r.observation : '');
    }).join('\n');

    return {
      DOCUMENT_TITLE: {
        ANNEX_1: 'ANEXO 1 — REGISTRO DE OBSERVACIÓN',
        ANNEX_2: 'ANEXO 2 — FICHA DE OBSERVACIÓN',
        ANNEX_3: 'ANEXO 3 — RÚBRICA',
        ANNEX_5: 'ANEXO 5 — RETROALIMENTACIÓN',
        FULL_PACKAGE: 'EXPEDIENTE DE OBSERVACIÓN — ANEXOS 1, 2, 3 Y 5'
      }[type],
      VISIT_ID: snapshot.visitCode || '',
      FORM_NUMBER: snapshot.formNumber || snapshot.visitCode || '',
      INSTITUTION_NAME: snapshot.institutionNameSnapshot || '',
      VISIT_DATE: snapshot.visitDate || '',
      CLASS_START_TIME: snapshot.classStartTime || '',
      TEACHER_NAME: cleanName_(snapshot.teacherNameSnapshot || ''),
      COURSE: line_([snapshot.gradeCourse, snapshot.parallel]),
      PARALLEL: snapshot.parallel || '',
      SUBLEVEL: snapshot.sublevel || '',
      AREA: snapshot.area || '',
      SUBJECT: snapshot.subject || '',
      CONTENT_TOPIC: snapshot.contentTopic || '',
      LOCATION: line_([snapshot.location, snapshot.zone, snapshot.district, snapshot.circuit]),
      ZONE: snapshot.zone || '',
      DISTRICT: snapshot.district || '',
      CIRCUIT: snapshot.circuit || '',
      ADDRESS: snapshot.institutionAddress || snapshot.location || '',
      SHIFT: snapshot.shift || 'Matutina',
      STUDENT_COUNT: snapshot.studentCount || '',
      OBSERVATION_RECORD: snapshot.observationRecord || 'Sin observaciones narrativas adicionales.',
      EVIDENCE_CHECKS: evidence || 'Sin verificación de evidencias documentales registradas.',
      GENERAL_CRITERIA_TABLE: general,
      RUBRIC_SELECTIONS_TABLE: rubric,
      STRENGTHS: snapshot.strengths || '',
      IMPROVEMENTS: snapshot.improvements || '',
      DIRECTIVE_COMMITMENTS: snapshot.directiveCommitments || '',
      TEACHER_COMMITMENTS: snapshot.teacherCommitments || '',
      FINAL_OBSERVATIONS: snapshot.finalObservations || '',
      EVALUATOR_NAME: cleanName_(snapshot.evaluatorNameSnapshot || ''),
      CO_EVALUATOR_NAME: cleanName_(snapshot.coEvaluatorNameSnapshot || ''),
      SIGNATURES_BLOCK: signaturesBlock_(snapshot)
    };
  }

  function styleCell_(cell, bgColor, align, isBold, fontSize, textColor) {
    if (bgColor) cell.setBackgroundColor(bgColor);
    cell.setPaddingTop(3);
    cell.setPaddingBottom(3);
    cell.setPaddingLeft(4);
    cell.setPaddingRight(4);
    var numChildren = cell.getNumChildren();
    for (var i = 0; i < numChildren; i++) {
      var child = cell.getChild(i);
      if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
        var p = child.asParagraph();
        if (align != null) p.setAlignment(align);
        var t = p.editAsText();
        t.setFontFamily('Arial');
        if (fontSize) t.setFontSize(fontSize);
        if (isBold != null) t.setBold(isBold);
        if (textColor) t.setForegroundColor(textColor);
      }
    }
  }

  var memBlobCache_ = {};

  function parseDriveFileId_(input) {
    if (!input || typeof input !== 'string') return '';
    var str = input.trim();
    var match = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    match = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) return str;
    return str;
  }

  function getLogoBlob_(logoId) {
    if (!logoId) return null;
    if (memBlobCache_[logoId]) return memBlobCache_[logoId];

    try {
      if (typeof CacheService !== 'undefined') {
        var scriptCache = CacheService.getScriptCache();
        var cached = scriptCache.get('LOGO_' + logoId);
        if (cached) {
          var parsed = JSON.parse(cached);
          var blobFromCache = Utilities.newBlob(Utilities.base64Decode(parsed.data), parsed.mimeType, 'logo');
          memBlobCache_[logoId] = blobFromCache;
          return blobFromCache;
        }
      }
    } catch (eCache) {
      console.warn('CacheService read failed: ' + eCache.message);
    }

    try {
      if (typeof DriveApp !== 'undefined') {
        var file = DriveApp.getFileById(logoId);
        var blob = file.getBlob();
        memBlobCache_[logoId] = blob;

        try {
          if (typeof CacheService !== 'undefined') {
            var bytes = blob.getBytes();
            if (bytes.length <= 75000) {
              var payload = JSON.stringify({
                mimeType: blob.getContentType(),
                data: Utilities.base64Encode(bytes)
              });
              CacheService.getScriptCache().put('LOGO_' + logoId, payload, 21600);
            }
          }
        } catch (eCacheWrite) {
          console.warn('CacheService write failed: ' + eCacheWrite.message);
        }

        return blob;
      }
    } catch (eDrive) {
      console.warn('DriveApp.getFileById failed for logo ' + logoId + ': ' + eDrive.message);
    }

    return null;
  }

  function clearLogoCache_(logoId) {
    if (logoId) {
      delete memBlobCache_[logoId];
      try {
        if (typeof CacheService !== 'undefined') {
          CacheService.getScriptCache().remove('LOGO_' + logoId);
        }
      } catch (e) {}
    } else {
      memBlobCache_ = {};
    }
  }

  function resolveInstitutionLogoId_(snapshot) {
    if (snapshot && (snapshot.institutionLogoDriveId || snapshot.logoDriveId)) {
      return parseDriveFileId_(snapshot.institutionLogoDriveId || snapshot.logoDriveId);
    }
    try {
      if (typeof SheetsRepository !== 'undefined') {
        var institutions = SheetsRepository.all('INSTITUTIONS');
        if (institutions && institutions.length > 0) {
          var inst = institutions[0];
          return parseDriveFileId_(inst.logo_drive_id || inst.logo_file_id || inst.logo_drive_url || '');
        }
      }
    } catch (e) {
      console.warn('Could not lookup institution logo from SheetsRepository: ' + e.message);
    }
    return '';
  }

  function appendInstitutionalHeader_(body, snapshot, logoBlob) {
    var instName = String(snapshot.institutionNameSnapshot || 'INSTITUCIÓN EDUCATIVA').toUpperCase();
    var locationParts = [];
    if (snapshot.district) locationParts.push('Distrito ' + snapshot.district);
    if (snapshot.circuit) locationParts.push('Circuito ' + snapshot.circuit);
    if (snapshot.zone) locationParts.push('Zona ' + snapshot.zone);
    if (!locationParts.length && snapshot.location) locationParts.push(snapshot.location);
    var subLocation = locationParts.join(' · ');

    var table = body.appendTable();
    table.setBorderColor('#FFFFFF');
    table.setBorderWidth(0);

    var row = table.appendTableRow();
    var hasLogo = false;

    if (logoBlob) {
      try {
        var cellLogo = row.appendTableCell();
        cellLogo.setPaddingTop(2).setPaddingBottom(4).setPaddingLeft(0).setPaddingRight(6);
        var img = cellLogo.appendImage(logoBlob);
        var origW = (img && img.getWidth) ? img.getWidth() : 100;
        var origH = (img && img.getHeight) ? img.getHeight() : 50;
        var maxW = 100;
        var maxH = 46;
        var ratio = Math.min(maxW / origW, maxH / origH, 1);
        if (img && img.setWidth) img.setWidth(Math.round(origW * ratio));
        if (img && img.setHeight) img.setHeight(Math.round(origH * ratio));
        if (cellLogo.getNumChildren() > 1 && cellLogo.getChild(0).getType && cellLogo.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH) {
          var firstP = cellLogo.getChild(0).asParagraph();
          if (firstP.getText && firstP.getText() === '') {
            firstP.removeFromParent();
          }
        }
        cellLogo.setWidth(105);
        hasLogo = true;
      } catch (eImg) {
        console.warn('No se pudo insertar la imagen del logo: ' + eImg.message);
        hasLogo = false;
      }
    }

    var cellText = row.appendTableCell();
    cellText.setPaddingTop(2).setPaddingBottom(4).setPaddingLeft(hasLogo ? 6 : 0).setPaddingRight(0);
    cellText.setWidth(hasLogo ? 435 : 540);

    var pName = cellText.getChild(0).asParagraph();
    pName.setText(instName);
    pName.setFontFamily('Arial').setFontSize(10.5).setBold(true);
    pName.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    if (subLocation) {
      var pLoc = cellText.appendParagraph(subLocation);
      pLoc.setFontFamily('Arial').setFontSize(7.5).setForegroundColor('#475569');
      pLoc.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    }

    var pSub = cellText.appendParagraph('SISTEMA DE GESTIÓN Y SEGUIMIENTO A LA PRÁCTICA PEDAGÓGICA');
    pSub.setFontFamily('Arial').setFontSize(7.5).setBold(true).setForegroundColor('#166534');
    pSub.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    try {
      var pDivider = body.appendParagraph('');
      if (pDivider.setSpacingAfter) pDivider.setSpacingAfter(4);
      if (pDivider.setSpacingBefore) pDivider.setSpacingBefore(0);
    } catch (e) {}
  }

  function appendBannerBox_(body, title, subtitle) {
    var table = body.appendTable([
      [title + (subtitle ? ' ' + subtitle : '')]
    ]);
    table.setBorderColor(DocColors.PURPLE_DARK);
    table.setBorderWidth(0.5);
    var cell = table.getCell(0, 0);
    cell.setBackgroundColor(DocColors.PURPLE_DARK);
    cell.setPaddingTop(5);
    cell.setPaddingBottom(5);
    var p = cell.getChild(0).asParagraph();
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    var t = p.editAsText();
    t.setForegroundColor('#FFFFFF');
    t.setFontFamily('Arial');
    t.setFontSize(10.5);
    t.setBold(true);
    cell.setWidth(540);
  }

  function appendSectionHeader_(body, title, bgColor, textColor) {
    var table = body.appendTable([[title]]);
    table.setBorderColor(DocColors.BORDER);
    table.setBorderWidth(0.5);
    var cell = table.getCell(0, 0);
    cell.setBackgroundColor(bgColor || DocColors.GRAY_HEADER);
    cell.setPaddingTop(4);
    cell.setPaddingBottom(4);
    var p = cell.getChild(0).asParagraph();
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    var t = p.editAsText();
    t.setForegroundColor(textColor || '#000000');
    t.setFontFamily('Arial');
    t.setFontSize(9);
    t.setBold(true);
    cell.setWidth(540);
  }

  function buildGeneralCriteriaTable_(table, snapshot) {
    var hRow = table.appendTableRow();
    hRow.appendTableCell('CRITERIOS GENERALES\nEstos criterios se relacionan con los tres momentos de los procesos de enseñanza y aprendizaje (excepto el criterio No 1)');
    hRow.appendTableCell('Totalmente de acuerdo');
    hRow.appendTableCell('En desacuerdo\n(Argumente la respuesta)');
    styleCell_(hRow.getCell(0), DocColors.GRAY_HEADER, DocumentApp.HorizontalAlignment.LEFT, true, 8, '#000000');
    styleCell_(hRow.getCell(1), DocColors.GRAY_HEADER, DocumentApp.HorizontalAlignment.CENTER, true, 8, '#000000');
    styleCell_(hRow.getCell(2), DocColors.GRAY_HEADER, DocumentApp.HorizontalAlignment.CENTER, true, 8, '#000000');
    hRow.getCell(0).setWidth(300);
    hRow.getCell(1).setWidth(100);
    hRow.getCell(2).setWidth(140);

    var responses = snapshot.generalResponses || [];
    var seedGeneral = (typeof SeedData !== 'undefined' && SeedData.general) ? SeedData.general : [];
    for (var i = 0; i < 6; i++) {
      var r = responses[i] || {};
      var gText = r.criterionText || seedGeneral[i] || ('Criterio general ' + (i + 1));
      var row = table.appendTableRow();
      var cText = (i + 1) + '. ' + gText;
      var cAgree = r.result === 'FULLY_AGREE' ? '[ X ]' : '[   ]';
      var cDisagree = r.result === 'DISAGREE' ? ('[ X ] ' + (r.argument ? '\n' + r.argument : '')) : '[   ]';
      row.appendTableCell(cText);
      row.appendTableCell(cAgree);
      row.appendTableCell(cDisagree);
      styleCell_(row.getCell(0), null, DocumentApp.HorizontalAlignment.LEFT, false, 7.5, '#000000');
      styleCell_(row.getCell(1), null, DocumentApp.HorizontalAlignment.CENTER, r.result === 'FULLY_AGREE', 8, '#000000');
      styleCell_(row.getCell(2), null, DocumentApp.HorizontalAlignment.LEFT, r.result === 'DISAGREE', 7.5, '#000000');
      row.getCell(0).setWidth(300);
      row.getCell(1).setWidth(100);
      row.getCell(2).setWidth(140);
    }
  }

  function buildAnnex2RubricTable_(table, snapshot) {
    var hRow = table.appendTableRow();
    hRow.appendTableCell('CRITERIOS');
    hRow.appendTableCell('LOGRADO');
    hRow.appendTableCell('EN PROCESO');
    hRow.appendTableCell('EN INICIO');
    hRow.appendTableCell('NO APLICA');
    hRow.appendTableCell('OBSERVACIÓN');
    for (var c = 0; c < 6; c++) {
      styleCell_(hRow.getCell(c), DocColors.PURPLE_LIGHT, DocumentApp.HorizontalAlignment.CENTER, true, 7.5, '#000000');
    }
    hRow.getCell(0).setWidth(180);
    hRow.getCell(1).setWidth(55);
    hRow.getCell(2).setWidth(55);
    hRow.getCell(3).setWidth(55);
    hRow.getCell(4).setWidth(55);
    hRow.getCell(5).setWidth(140);

    var responses = snapshot.rubricResponses || [];
    MOMENT_CONFIG.forEach(function (m) {
      var sRow = table.appendTableRow();
      sRow.appendTableCell(m.title);
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      for (var k = 0; k < 6; k++) {
        styleCell_(sRow.getCell(k), DocColors.PURPLE_MID, DocumentApp.HorizontalAlignment.LEFT, true, 8, '#FFFFFF');
      }

      m.criteria.forEach(function (num) {
        var r = responses[num - 1] || {};
        var seedItem = (typeof SeedData !== 'undefined' && SeedData.rubric && SeedData.rubric[num - 1]) ? SeedData.rubric[num - 1] : null;
        var row = table.appendTableRow();
        var cTitle = num + '. ' + String(r.criterionTitle || (seedItem ? seedItem[2] : ('Criterio ' + num))).toUpperCase();
        row.appendTableCell(cTitle);
        row.appendTableCell(r.level === 'ACHIEVED' ? '[ X ]' : '[   ]');
        row.appendTableCell(r.level === 'IN_PROGRESS' ? '[ X ]' : '[   ]');
        row.appendTableCell(r.level === 'BEGINNING' ? '[ X ]' : '[   ]');
        row.appendTableCell(r.level === 'NOT_APPLICABLE' ? '[ X ]' : '[   ]');
        row.appendTableCell(r.observation || '');

        styleCell_(row.getCell(0), null, DocumentApp.HorizontalAlignment.LEFT, true, 7, '#000000');
        styleCell_(row.getCell(1), null, DocumentApp.HorizontalAlignment.CENTER, r.level === 'ACHIEVED', 7.5, '#000000');
        styleCell_(row.getCell(2), null, DocumentApp.HorizontalAlignment.CENTER, r.level === 'IN_PROGRESS', 7.5, '#000000');
        styleCell_(row.getCell(3), null, DocumentApp.HorizontalAlignment.CENTER, r.level === 'BEGINNING', 7.5, '#000000');
        styleCell_(row.getCell(4), null, DocumentApp.HorizontalAlignment.CENTER, r.level === 'NOT_APPLICABLE', 7.5, '#000000');
        styleCell_(row.getCell(5), null, DocumentApp.HorizontalAlignment.LEFT, false, 7, '#000000');

        row.getCell(0).setWidth(180);
        row.getCell(1).setWidth(55);
        row.getCell(2).setWidth(55);
        row.getCell(3).setWidth(55);
        row.getCell(4).setWidth(55);
        row.getCell(5).setWidth(140);
      });
    });
  }

  function buildAnnex3RubricTable_(table, snapshot) {
    var hRow = table.appendTableRow();
    hRow.appendTableCell('CRITERIOS');
    hRow.appendTableCell('LOGRADO');
    hRow.appendTableCell('EN PROCESO');
    hRow.appendTableCell('EN INICIO');
    hRow.appendTableCell('No aplica\na la clase observada');
    for (var c = 0; c < 5; c++) {
      styleCell_(hRow.getCell(c), DocColors.PURPLE_LIGHT, DocumentApp.HorizontalAlignment.CENTER, true, 7.5, '#000000');
    }
    hRow.getCell(0).setWidth(110);
    hRow.getCell(1).setWidth(135);
    hRow.getCell(2).setWidth(135);
    hRow.getCell(3).setWidth(110);
    hRow.getCell(4).setWidth(50);

    var responses = snapshot.rubricResponses || [];
    MOMENT_CONFIG.forEach(function (m) {
      var sRow = table.appendTableRow();
      sRow.appendTableCell(m.title);
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      sRow.appendTableCell('');
      for (var k = 0; k < 5; k++) {
        styleCell_(sRow.getCell(k), DocColors.PURPLE_MID, DocumentApp.HorizontalAlignment.LEFT, true, 8, '#FFFFFF');
      }

      m.criteria.forEach(function (num) {
        var r = responses[num - 1] || {};
        var seedItem = (typeof SeedData !== 'undefined' && SeedData.rubric && SeedData.rubric[num - 1]) ? SeedData.rubric[num - 1] : null;
        var cTitle = num + '. ' + String(r.criterionTitle || (seedItem ? seedItem[2] : ('Criterio ' + num))).toUpperCase();

        var descAchieved = r.descriptorAchieved || (seedItem ? seedItem[3] : '');
        var descInProgress = r.descriptorInProgress || (seedItem ? seedItem[4] : '');
        var descBeginning = r.descriptorBeginning || (seedItem ? seedItem[5] : '');

        var achMark = r.level === 'ACHIEVED' ? '[ X ]' : '[   ]';
        var progMark = r.level === 'IN_PROGRESS' ? '[ X ]' : '[   ]';
        var begMark = r.level === 'BEGINNING' ? '[ X ]' : '[   ]';
        var naMark = r.level === 'NOT_APPLICABLE' ? '[ X ]' : '[   ]';

        var achText = (descAchieved ? descAchieved + '\n\n' : '') + achMark;
        var progText = (descInProgress ? descInProgress + '\n\n' : '') + progMark;
        var begText = (descBeginning ? descBeginning + '\n\n' : '') + begMark;
        var naText = naMark;

        var row = table.appendTableRow();
        row.appendTableCell(cTitle);
        row.appendTableCell(achText);
        row.appendTableCell(progText);
        row.appendTableCell(begText);
        row.appendTableCell(naText);

        styleCell_(row.getCell(0), null, DocumentApp.HorizontalAlignment.LEFT, true, 7, '#000000');
        styleCell_(row.getCell(1), null, DocumentApp.HorizontalAlignment.LEFT, false, 7, '#000000');
        styleCell_(row.getCell(2), null, DocumentApp.HorizontalAlignment.LEFT, false, 7, '#000000');
        styleCell_(row.getCell(3), null, DocumentApp.HorizontalAlignment.LEFT, false, 7, '#000000');
        styleCell_(row.getCell(4), null, DocumentApp.HorizontalAlignment.CENTER, r.level === 'NOT_APPLICABLE', 7.5, '#000000');

        row.getCell(0).setWidth(110);
        row.getCell(1).setWidth(135);
        row.getCell(2).setWidth(135);
        row.getCell(3).setWidth(110);
        row.getCell(4).setWidth(50);
      });
    });
  }

  function buildSignaturesTable_(table, snapshot) {
    var rawEv1 = snapshot.evaluatorNameSnapshot || 'Evaluador / Directivo';
    var rawTeacher = snapshot.teacherNameSnapshot || 'Docente';
    var rawCo = snapshot.coEvaluatorNameSnapshot;

    var evRoleLabel = getEvaluatorRoleLabel_(rawEv1, snapshot.evaluatorPosition);
    var coRoleLabel = rawCo ? getEvaluatorRoleLabel_(rawCo, snapshot.coEvaluatorPosition) : '';

    var ev1Clean = cleanName_(rawEv1);
    var teacherClean = cleanName_(rawTeacher);
    var coClean = rawCo ? cleanName_(rawCo) : '';

    var cols = rawCo ? 3 : 2;
    var colWidth = rawCo ? 180 : 270;

    var hRow = table.appendTableRow();
    hRow.appendTableCell('FIRMAS');
    hRow.appendTableCell('');
    if (rawCo) hRow.appendTableCell('');
    for (var i = 0; i < cols; i++) {
      styleCell_(hRow.getCell(i), DocColors.GRAY_HEADER, DocumentApp.HorizontalAlignment.CENTER, true, 8.5, '#000000');
      hRow.getCell(i).setWidth(colWidth);
    }

    var rRoles = table.appendTableRow();
    if (rawCo) {
      rRoles.appendTableCell(evRoleLabel);
      rRoles.appendTableCell(coRoleLabel || 'SEGUNDO EVALUADOR');
      rRoles.appendTableCell('DOCENTE');
    } else {
      rRoles.appendTableCell(evRoleLabel);
      rRoles.appendTableCell('DOCENTE');
    }
    for (var j = 0; j < cols; j++) {
      styleCell_(rRoles.getCell(j), null, DocumentApp.HorizontalAlignment.CENTER, true, 8, '#000000');
      rRoles.getCell(j).setWidth(colWidth);
    }

    var rSign = table.appendTableRow();
    if (rSign.setMinimumHeight) {
      try { rSign.setMinimumHeight(60); } catch (e) {}
    }
    if (rawCo) {
      rSign.appendTableCell('');
      rSign.appendTableCell('');
      rSign.appendTableCell('');
    } else {
      rSign.appendTableCell('');
      rSign.appendTableCell('');
    }
    for (var s = 0; s < cols; s++) {
      styleCell_(rSign.getCell(s), null, DocumentApp.HorizontalAlignment.CENTER, false, 7.5, '#666666');
      rSign.getCell(s).setWidth(colWidth);
    }

    var rNames = table.appendTableRow();
    if (rawCo) {
      rNames.appendTableCell('NOMBRE: ' + ev1Clean);
      rNames.appendTableCell('NOMBRE: ' + coClean);
      rNames.appendTableCell('NOMBRE: ' + teacherClean);
    } else {
      rNames.appendTableCell('NOMBRE: ' + ev1Clean);
      rNames.appendTableCell('NOMBRE: ' + teacherClean);
    }
    for (var n = 0; n < cols; n++) {
      styleCell_(rNames.getCell(n), null, DocumentApp.HorizontalAlignment.LEFT, true, 8, '#000000');
      rNames.getCell(n).setWidth(colWidth);
    }
  }

  function buildAnnex1Section_(body, snapshot, logoBlob) {
    appendInstitutionalHeader_(body, snapshot, logoBlob);
    var pTop = body.appendParagraph('Anexo 1: Registro de la observación de clase.');
    pTop.setFontFamily('Arial').setFontSize(9.5).setBold(true);

    appendBannerBox_(body, 'REGISTRO DE LA OBSERVACIÓN DE CLASE');

    var courseStr = line_([snapshot.gradeCourse, snapshot.parallel]);
    var teacherNameClean = cleanName_(snapshot.teacherNameSnapshot || '');
    var infoTable = body.appendTable([
      ['Institución educativa: ' + (snapshot.institutionNameSnapshot || ''), 'Fecha: ' + (snapshot.visitDate || '')],
      ['Docente: ' + teacherNameClean, 'Grado o curso: ' + (courseStr || '')]
    ]);
    infoTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    for (var r = 0; r < infoTable.getNumRows(); r++) {
      var row = infoTable.getRow(r);
      for (var c = 0; c < row.getNumCells(); c++) {
        var cell = row.getCell(c);
        cell.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(5).setPaddingRight(5);
        var p = cell.getChild(0).asParagraph();
        p.setFontFamily('Arial').setFontSize(8.5);
      }
      row.getCell(0).setWidth(330);
      row.getCell(1).setWidth(210);
    }

    var objTable = body.appendTable([
      ['OBJETIVO: Registrar información, fielmente recogida en el momento de la observación, como insumo para procesar la Rúbrica para la ficha de observación de clase y para la retroalimentación al docente observado.'],
      ['INSTRUCCIONES: Anotar en forma descriptiva, con objetividad y exactitud los hechos relevantes, relacionados con los criterios contenidos en la ficha de observación de clase y su correspondiente rúbrica.']
    ]);
    objTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    for (var ro = 0; ro < objTable.getNumRows(); ro++) {
      var cObj = objTable.getRow(ro).getCell(0);
      cObj.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(5).setPaddingRight(5);
      var pObj = cObj.getChild(0).asParagraph();
      pObj.setFontFamily('Arial').setFontSize(8).setItalic(true);
      cObj.setWidth(540);
    }

    appendSectionHeader_(body, 'REGISTRO NARRATIVO DESCRIPTIVO', DocColors.GRAY_HEADER);

    var textTable = body.appendTable([
      [(snapshot.observationRecord || 'Sin observaciones narrativas registradas.')]
    ]);
    textTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    if (textTable.getRow(0).setMinimumHeight) {
      try { textTable.getRow(0).setMinimumHeight(240); } catch (e) {}
    }
    var cNarr = textTable.getCell(0, 0);
    cNarr.setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(6).setPaddingRight(6);
    cNarr.getChild(0).asParagraph().setFontFamily('Arial').setFontSize(8.5);
    cNarr.setWidth(540);

    body.appendParagraph('');
    var sigTable = body.appendTable();
    sigTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildSignaturesTable_(sigTable, snapshot);
  }

  function buildAnnex2Section_(body, snapshot, logoBlob) {
    appendInstitutionalHeader_(body, snapshot, logoBlob);
    var pTop = body.appendParagraph('Anexo 2: ficha de observación de clase.');
    pTop.setFontFamily('Arial').setFontSize(9.5).setBold(true);

    var fNum = snapshot.formNumber || snapshot.visitCode || '';
    appendBannerBox_(body, 'FICHA DE OBSERVACIÓN DE CLASE', fNum ? ('No. ' + fNum) : '');

    appendSectionHeader_(body, 'DATOS INFORMATIVOS', DocColors.GRAY_HEADER);

    // Fila 1: Datos de la Institución (7 columnas)
    var tableInst = body.appendTable([
      [
        'NOMBRE DE LA INSTITUCIÓN:\n' + (snapshot.institutionNameSnapshot || ''),
        'UBICACIÓN:\n' + (snapshot.location || ''),
        'ZONA:\n' + (snapshot.zone || ''),
        'DISTRITO:\n' + (snapshot.district || ''),
        'CIRCUITO:\n' + (snapshot.circuit || ''),
        'DIRECCIÓN INSTITUCIÓN:\n' + (snapshot.institutionAddress || snapshot.location || ''),
        'JORNADA:\n' + (snapshot.shift || 'Matutina')
      ]
    ]);
    tableInst.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    var colWidthsInst = [140, 80, 45, 55, 50, 105, 65];
    for (var c1 = 0; c1 < 7; c1++) {
      var cell1 = tableInst.getRow(0).getCell(c1);
      cell1.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(3).setPaddingRight(3);
      cell1.getChild(0).asParagraph().setFontFamily('Arial').setFontSize(7.5);
      cell1.setWidth(colWidthsInst[c1]);
    }

    // Fila 2: Docente, Contenido, Área, Asignatura y Fecha (5 columnas)
    var teacherClean = cleanName_(snapshot.teacherNameSnapshot || '');
    var tableDoc = body.appendTable([
      [
        'NOMBRE DEL DOCENTE:\n' + teacherClean,
        'CONTENIDO:\n' + (snapshot.contentTopic || ''),
        'ÁREA:\n' + (snapshot.area || ''),
        'ASIGNATURA:\n' + (snapshot.subject || ''),
        'FECHA:\n' + (snapshot.visitDate || '')
      ]
    ]);
    tableDoc.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    var colWidthsDoc = [150, 125, 90, 95, 80];
    for (var c2 = 0; c2 < 5; c2++) {
      var cell2 = tableDoc.getRow(0).getCell(c2);
      cell2.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(3).setPaddingRight(3);
      cell2.getChild(0).asParagraph().setFontFamily('Arial').setFontSize(7.5);
      cell2.setWidth(colWidthsDoc[c2]);
    }

    // Fila 3: Grado o Curso, Paralelo, Subnivel y No. de Estudiantes (4 columnas)
    var tableGrade = body.appendTable([
      [
        'GRADO O CURSO:\n' + (snapshot.gradeCourse || ''),
        'PARALELO:\n' + (snapshot.parallel || ''),
        'SUBNIVEL:\n' + (snapshot.sublevel || ''),
        'No. DE ESTUDIANTES:\n' + (snapshot.studentCount || '')
      ]
    ]);
    tableGrade.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    var colWidthsGrade = [150, 70, 160, 160];
    for (var c3 = 0; c3 < 4; c3++) {
      var cell3 = tableGrade.getRow(0).getCell(c3);
      cell3.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(3).setPaddingRight(3);
      cell3.getChild(0).asParagraph().setFontFamily('Arial').setFontSize(7.5);
      cell3.setWidth(colWidthsGrade[c3]);
    }

    var objTable = body.appendTable([
      ['OBJETIVO DE LA FICHA: Recolectar información de los procesos enseñanza y aprendizaje durante el período de clase.'],
      ['INSTRUCCIONES: Marque una x en el casillero que corresponda a su conformidad con alguno de los criterios enunciados.']
    ]);
    objTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    for (var ro = 0; ro < objTable.getNumRows(); ro++) {
      var cObj = objTable.getRow(ro).getCell(0);
      cObj.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(4).setPaddingRight(4);
      var pObjCell = cObj.getChild(0).asParagraph();
      pObjCell.setFontFamily('Arial').setFontSize(7.5);
      if (ro === 0) pObjCell.setBold(true);
      if (ro === 1) pObjCell.setItalic(true);
      cObj.setWidth(540);
    }

    body.appendParagraph('');
    var genTable = body.appendTable();
    genTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildGeneralCriteriaTable_(genTable, snapshot);

    body.appendParagraph('');
    appendSectionHeader_(body, 'PROCESOS DE ENSEÑANZA Y APRENDIZAJE', DocColors.GRAY_HEADER);

    var pInst2 = body.appendParagraph('INSTRUCCIONES: Marque una x en el casillero que corresponda a su conformidad con alguno de los criterios enunciados.');
    pInst2.setFontFamily('Arial').setFontSize(7.5).setItalic(true);

    var rubTable = body.appendTable();
    rubTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildAnnex2RubricTable_(rubTable, snapshot);

    body.appendParagraph('');
    var sigTable = body.appendTable();
    sigTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildSignaturesTable_(sigTable, snapshot);
  }

  function buildAnnex3Section_(body, snapshot, logoBlob) {
    appendInstitutionalHeader_(body, snapshot, logoBlob);
    var pTop = body.appendParagraph('Anexo 3: Rúbrica para la ficha de observación de clase:');
    pTop.setFontFamily('Arial').setFontSize(9.5).setBold(true);

    appendBannerBox_(body, 'RÚBRICA PARA LA FICHA DE OBSERVACIÓN DE CLASE');

    var objTable = body.appendTable([
      ['OBJETIVO: Describir el grado de desempeño del docente en el aula, durante su práctica pedagógica.'],
      ['INSTRUCCIONES: Marque con una X la columna que corresponda al valor seleccionado para el criterio respectivo.']
    ]);
    objTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    for (var ro = 0; ro < objTable.getNumRows(); ro++) {
      var cObj = objTable.getRow(ro).getCell(0);
      cObj.setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(4).setPaddingRight(4);
      var pObjCell = cObj.getChild(0).asParagraph();
      pObjCell.setFontFamily('Arial').setFontSize(7.5);
      if (ro === 0) pObjCell.setBold(true);
      if (ro === 1) pObjCell.setItalic(true);
      cObj.setWidth(540);
    }

    body.appendParagraph('');
    var rubTable = body.appendTable();
    rubTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildAnnex3RubricTable_(rubTable, snapshot);

    body.appendParagraph('');
    var sigTable = body.appendTable();
    sigTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildSignaturesTable_(sigTable, snapshot);
  }

  function buildAnnex5Section_(body, snapshot, logoBlob) {
    appendInstitutionalHeader_(body, snapshot, logoBlob);
    var pTop = body.appendParagraph('Anexo 5: Registro para la reflexión pedagógica.');
    pTop.setFontFamily('Arial').setFontSize(9.5).setBold(true);

    appendBannerBox_(body, 'REGISTRO PARA LA REFLEXIÓN PEDAGÓGICA');

    var objTable = body.appendTable([
      ['OBJETIVO: Analizar en forma conjunta, docente y equipo de observadores, la información recolectada a través de la ficha de observación de clase y de la actividad de reflexión del docente, para el mejoramiento de la práctica pedagógica en aula.'],
      ['INSTRUMENTOS DE FUNDAMENTACIÓN:\n1. Ficha de observación de clase.      2. Rúbrica para la ficha de observación de clase.      3. Guion de reflexión.']
    ]);
    objTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    for (var ro = 0; ro < objTable.getNumRows(); ro++) {
      var cObj = objTable.getRow(ro).getCell(0);
      cObj.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(5).setPaddingRight(5);
      var pObjCell = cObj.getChild(0).asParagraph();
      pObjCell.setFontFamily('Arial').setFontSize(8);
      if (ro === 1) pObjCell.setBold(true);
      cObj.setWidth(540);
    }

    appendSectionHeader_(body, 'ANÁLISIS DEL DESARROLLO DEL PROCESO PEDAGÓGICO', DocColors.GRAY_HEADER);

    var pDesc = body.appendParagraph('En el espacio en blanco que se encuentra a continuación redacte brevemente las fortalezas y los aspectos a mejorar evidenciados durante la observación de la clase, que considere relevantes.');
    pDesc.setFontFamily('Arial').setFontSize(7.5).setItalic(true);

    var tableAnalysis = body.appendTable([
      ['FORTALEZAS', 'ASPECTOS A MEJORAR'],
      [(snapshot.strengths || 'Ninguna registrada.'), (snapshot.improvements || 'Ninguno registrado.')]
    ]);
    tableAnalysis.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    tableAnalysis.getRow(0).getCell(0).setBackgroundColor(DocColors.PURPLE_LIGHT);
    tableAnalysis.getRow(0).getCell(1).setBackgroundColor(DocColors.PURPLE_LIGHT);
    if (tableAnalysis.getRow(1).setMinimumHeight) {
      try { tableAnalysis.getRow(1).setMinimumHeight(130); } catch (e) {}
    }
    for (var r1 = 0; r1 < tableAnalysis.getNumRows(); r1++) {
      var row1 = tableAnalysis.getRow(r1);
      for (var c1 = 0; c1 < row1.getNumCells(); c1++) {
        var cell1 = row1.getCell(c1);
        cell1.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(5).setPaddingRight(5);
        var p1 = cell1.getChild(0).asParagraph();
        p1.setFontFamily('Arial').setFontSize(8);
        if (r1 === 0) { p1.setAlignment(DocumentApp.HorizontalAlignment.CENTER); p1.setBold(true); }
        cell1.setWidth(270);
      }
    }

    appendSectionHeader_(body, 'COMPROMISOS DEL DOCENTE Y DE LOS DIRECTIVOS DE LA INSTITUCIÓN EDUCATIVA', DocColors.GRAY_HEADER);

    var tableCompromisos = body.appendTable([
      ['DIRECTIVO', 'DOCENTE'],
      [(snapshot.directiveCommitments || 'Sin compromisos registrados.'), (snapshot.teacherCommitments || 'Sin compromisos registrados.')]
    ]);
    tableCompromisos.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    tableCompromisos.getRow(0).getCell(0).setBackgroundColor(DocColors.PURPLE_LIGHT);
    tableCompromisos.getRow(0).getCell(1).setBackgroundColor(DocColors.PURPLE_LIGHT);
    if (tableCompromisos.getRow(1).setMinimumHeight) {
      try { tableCompromisos.getRow(1).setMinimumHeight(100); } catch (e) {}
    }
    for (var r2 = 0; r2 < tableCompromisos.getNumRows(); r2++) {
      var row2 = tableCompromisos.getRow(r2);
      for (var c2 = 0; c2 < row2.getNumCells(); c2++) {
        var cell2 = row2.getCell(c2);
        cell2.setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(5).setPaddingRight(5);
        var p2 = cell2.getChild(0).asParagraph();
        p2.setFontFamily('Arial').setFontSize(8);
        if (r2 === 0) { p2.setAlignment(DocumentApp.HorizontalAlignment.CENTER); p2.setBold(true); }
        cell2.setWidth(270);
      }
    }

    appendSectionHeader_(body, 'OBSERVACIONES', DocColors.GRAY_HEADER);

    var tableObs = body.appendTable([
      [(snapshot.finalObservations || 'Ninguna')]
    ]);
    tableObs.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    if (tableObs.getRow(0).setMinimumHeight) {
      try { tableObs.getRow(0).setMinimumHeight(70); } catch (e) {}
    }
    var cellObs = tableObs.getCell(0, 0);
    cellObs.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(5).setPaddingRight(5);
    cellObs.getChild(0).asParagraph().setFontFamily('Arial').setFontSize(8);
    cellObs.setWidth(540);

    body.appendParagraph('');
    var sigTable = body.appendTable();
    sigTable.setBorderColor(DocColors.BORDER).setBorderWidth(0.5);
    buildSignaturesTable_(sigTable, snapshot);
  }

  function buildFullPackage_(body, snapshot, logoBlob) {
    buildAnnex1Section_(body, snapshot, logoBlob);
    body.appendPageBreak();
    buildAnnex2Section_(body, snapshot, logoBlob);
    body.appendPageBreak();
    buildAnnex3Section_(body, snapshot, logoBlob);
    body.appendPageBreak();
    buildAnnex5Section_(body, snapshot, logoBlob);
  }

  function buildDocument_(body, snapshot, type, logoBlob) {
    if (type === 'ANNEX_1') {
      buildAnnex1Section_(body, snapshot, logoBlob);
    } else if (type === 'ANNEX_2') {
      buildAnnex2Section_(body, snapshot, logoBlob);
    } else if (type === 'ANNEX_3') {
      buildAnnex3Section_(body, snapshot, logoBlob);
    } else if (type === 'ANNEX_5') {
      buildAnnex5Section_(body, snapshot, logoBlob);
    } else if (type === 'FULL_PACKAGE') {
      buildFullPackage_(body, snapshot, logoBlob);
    }
  }

  function render(templateId, outputName, snapshot, type, tempFolderId, outputFolderId) {
    if (!templateId) throw AppErrors.document('No se configuró la plantilla para ' + type + '.');
    var copy = DriveApp.getFileById(templateId).makeCopy(outputName + '-TEMP', DriveApp.getFolderById(tempFolderId));
    var doc = DocumentApp.openById(copy.getId());
    var body = doc.getBody();

    body.clear();
    try {
      body.setMarginTop(36);
      body.setMarginBottom(36);
      body.setMarginLeft(36);
      body.setMarginRight(36);
    } catch (e) {}

    var logoId = resolveInstitutionLogoId_(snapshot);
    var logoBlob = getLogoBlob_(logoId);

    buildDocument_(body, snapshot, type, logoBlob);

    if (body.getNumChildren() > 1 && body.getChild(0).getType() === DocumentApp.ElementType.PARAGRAPH) {
      var firstP = body.getChild(0).asParagraph();
      if (firstP.getText() === '') {
        firstP.removeFromParent();
      }
    }

    doc.saveAndClose();
    var blob = copy.getAs(MimeType.PDF).setName(outputName);
    var file = DriveApp.getFolderById(outputFolderId).createFile(blob);
    copy.setTrashed(true);
    return file;
  }

  return {
    render: render,
    replacements: replacements,
    parseDriveFileId: parseDriveFileId_,
    getLogoBlob: getLogoBlob_,
    clearLogoCache: clearLogoCache_,
    resolveInstitutionLogoId: resolveInstitutionLogoId_,
    appendInstitutionalHeader: appendInstitutionalHeader_
  };
})();
