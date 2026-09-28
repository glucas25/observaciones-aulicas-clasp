var SeedData = (function () {
  var general = [
    'La clase se inicia con puntualidad de acuerdo con el horario institucional.',
    'El docente desarrolla su clase en un ambiente limpio y organizado.',
    'Las actividades desarrolladas en clase guardan relación con la planificación microcurricular entregada.',
    'El objetivo se da a conocer durante el desarrollo de la clase.',
    'La relación entre los elementos del currículo se evidencia durante el desarrollo de las actividades.',
    'El tiempo es distribuido de modo que se cumplan los objetivos propuestos mediante las actividades planificadas.'
  ];
  var rubric = [
    ['CRI-01','INITIAL','Relación motivación-objetivo de la clase','La actividad de motivación se relaciona con el objetivo de la clase y despierta el interés de los estudiantes.','La actividad de motivación se relaciona con el objetivo de la clase, pero no genera interés de los estudiantes.','No hay actividad de motivación, o la que se aplica no está relacionada con el objetivo de la clase.'],
    ['CRI-02','INITIAL','Conocimientos previos o prerrequisitos','Formula preguntas o aplica actividades que permiten explorar los conocimientos previos de los estudiantes.','Las preguntas que formula o actividades que aplica para explorar los conocimientos previos de los estudiantes no logran el propósito.','No aplica preguntas ni actividades para explorar los conocimientos previos de los estudiantes.'],
    ['CRI-03','DEVELOPMENT','Estimulación del pensamiento crítico y creativo','Se estimula constantemente el pensamiento crítico y creativo a través de preguntas y otro tipo de actividades que generan indagación, problematización y reflexión del estudiante.','Ocasionalmente se efectúan actividades que estimulan el pensamiento crítico y creativo del estudiante.','No se efectúan actividades que estimulan el pensamiento crítico y creativo del estudiante.'],
    ['CRI-04','DEVELOPMENT','Ambiente interactivo y colaborativo','Se plantean actividades que permiten que los estudiantes construyan el conocimiento mediante la interacción (estudiante-docente, estudiante-estudiante) y el trabajo colaborativo.','El docente no promueve el trabajo colaborativo; sin embargo, construye el conocimiento mediante diálogo heurístico con los estudiantes.','El docente utiliza un método esencialmente explicativo-ilustrativo, que no promueve la participación activa de los estudiantes en la construcción del conocimiento.'],
    ['CRI-05','DEVELOPMENT','Dominio del conocimiento disciplinar','El docente demuestra conocimiento y dominio del tema que se está estudiando. Aborda los contenidos y desarrolla las actividades a través de una estructura lógica, con fluidez y coherencia.','El docente demuestra conocimiento del tema que se está estudiando, aunque no dominio. Los contenidos y actividades que propone son pertinentes, pero se presentan de manera desorganizada.','El docente no demuestra conocimiento del tema que se está estudiando. Los contenidos y las actividades los desarrolla sin estructura lógica ni coherencia.'],
    ['CRI-06','DEVELOPMENT','Interdisciplinariedad','Las actividades permiten al estudiante evidenciar claramente la relación del nuevo conocimiento con su entorno u otras áreas del saber.','Las actividades desarrolladas son poco relevantes o no son pertinentes, lo que no permite a los estudiantes establecer clara relación del nuevo conocimiento con su entorno u otras áreas del saber.','En el desarrollo de la clase no se genera interrelación del nuevo conocimiento con su entorno u otras áreas del saber.'],
    ['CRI-07','DEVELOPMENT','Recursos didácticos','Los recursos didácticos, materiales y metodológicos empleados facilitan el logro del objetivo de la clase.','Los recursos didácticos, materiales y metodológicos empleados permiten un logro parcial del objetivo de la clase.','El empleo inadecuado de los recursos didácticos, o la falta de alguno de ellos, impide que se logre el objetivo de la clase.'],
    ['CRI-08','DEVELOPMENT','Conclusiones, definiciones y otras generalizaciones','Las conclusiones, definiciones y otras generalizaciones son elaboradas en su totalidad por los estudiantes.','Las conclusiones, definiciones y otras generalizaciones son elaboradas en un mínimo porcentaje por los estudiantes.','Las conclusiones, definiciones y generalizaciones son elaboradas en su totalidad por el docente.'],
    ['CRI-09','CONSOLIDATION','Retroalimentación del docente','Las participaciones de los estudiantes son retroalimentadas y enriquecidas por el docente y sus pares, de manera total, oportuna y eficaz.','Las participaciones de los estudiantes son retroalimentadas y enriquecidas por el docente y sus pares, eventualmente, de manera parcial o no eficaz.','Las participaciones de los estudiantes no son retroalimentadas o enriquecidas por el docente ni sus pares.'],
    ['CRI-10','CONSOLIDATION','Evaluación formativa','Se evalúa sobre los procesos y resultados de las actividades que realizan los estudiantes, mediante reflexiones, producto, autoevaluaciones y coevaluaciones.','Se evalúa sobre los procesos y resultados de las actividades que realizan los estudiantes, solo mediante las reflexiones propuestas por el docente.','No se evalúa, o se evalúa esporádicamente, los procesos y resultados de las actividades que realizan los estudiantes.'],
    ['CRI-11','CONSOLIDATION','Evaluación sumativa','La evaluación es acorde al objetivo de la clase y el instrumento empleado permite evidenciar el logro de la destreza con criterio de desempeño.','La evaluación es acorde al objetivo de la clase, pero el instrumento empleado no permite evidenciar en forma clara y específica el logro de la destreza con criterio de desempeño.','La evaluación no es acorde al objetivo de la clase y el instrumento empleado no permite evidenciar el logro de la destreza con criterio de desempeño.'],
    ['CRI-12','CLASSROOM_CLIMATE','Promoción del respeto','El lenguaje verbal y no verbal que emplea el docente crea un ambiente de respeto y calidez.','El docente mantiene un ambiente de respeto, pero se nota un clima de tensión y desconfianza entre los estudiantes.','El docente no genera serenidad ni crea un ambiente de calidez y confianza.'],
    ['CRI-13','CLASSROOM_CLIMATE','Manejo del comportamiento de los estudiantes','El docente monitorea en forma preventiva; hay mínimas interrupciones de clase y la respuesta del docente a las actitudes es adecuada.','La forma en que el docente maneja la disciplina de los estudiantes es apropiada; sin embargo, ocasionalmente algunos estudiantes interrumpen la clase.','El docente ignora el comportamiento de los estudiantes que interrumpen el normal desenvolvimiento de la clase.'],
    ['CRI-14','CLASSROOM_CLIMATE','Ambiente democrático','El docente ofrece oportunidades para que todos los estudiantes expresen sus propias ideas sin distinción y participen en igualdad de condiciones.','El docente ofrece oportunidades, pero se promueve la participación solo de un grupo de estudiantes.','El docente ofrece escasas oportunidades de participación a los estudiantes, centrando el protagonismo en el docente y no en el estudiante.'],
    ['CRI-15','CLASSROOM_CLIMATE','Atención a estudiantes con necesidades educativas especiales (NEE)','El docente adapta las estrategias pedagógicas para atender a los estudiantes con NEE.','El docente adapta parcialmente las estrategias pedagógicas para atender a los estudiantes con NEE.','El docente no adapta las estrategias pedagógicas para atender a los estudiantes con NEE.']
  ];
  return { general: general, rubric: rubric };
})();

function seedCatalogs() {
  var now = JsonUtil.now(), versionId = 'rubric-v1';
  SheetsRepository.upsert('RUBRIC_VERSIONS', ['rubric_version_id'], {
    rubric_version_id: versionId, version_code: 'RUB-1.0', name: 'Rúbrica Anexo 3 V1', status: 'DRAFT',
    source_document: '06-CATALOGO-RUBRICA.md', approved_by: '', approved_at: ''
  });
  SeedData.rubric.forEach(function (r, i) {
    SheetsRepository.upsert('RUBRIC_CRITERIA', ['criterion_id'], {
      criterion_id: 'rubric-v1-' + r[0].toLowerCase(), rubric_version_id: versionId, criterion_code: r[0], group_code: r[1],
      sort_order: i + 1, title: r[2], descriptor_achieved: r[3], descriptor_in_progress: r[4], descriptor_beginning: r[5], allows_na: true, active: true
    });
  });
  SeedData.general.forEach(function (value, i) {
    SheetsRepository.upsert('GENERAL_CRITERIA', ['general_criterion_id'], {
      general_criterion_id: 'general-v1-' + String(i + 1), catalog_version: 'GEN-1.0', criterion_code: 'GEN-' + ('0' + (i + 1)).slice(-2),
      sort_order: i + 1, text: value, active: true
    });
  });
  [['PLAN','Planificación microcurricular'],['ATTENDANCE','Registro de asistencia'],['RESOURCES','Recursos didácticos previstos']].forEach(function (item, i) {
    SheetsRepository.upsert('EVIDENCE_CHECK_TYPES', ['check_type_id'], {
      check_type_id: 'evidence-v1-' + item[0].toLowerCase(), catalog_version: 'EVI-1.0-DRAFT', check_code: item[0], label: item[1], sort_order: i + 1, active: true
    });
  });
  SheetsRepository.upsert('SETTINGS', ['key'], { key: 'SCHEMA_VERSION', value: '1', value_type: 'NUMBER', environment: AppConfig.get().environment, description: 'Versión del esquema', updated_at: now, updated_by: 'setup' });
  return { rubricCriteria: 15, generalCriteria: 6, evidenceChecks: 3, status: 'DRAFT_REQUIRES_INSTITUTIONAL_APPROVAL' };
}
