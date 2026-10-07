'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const source=fs.readFileSync(path.resolve(__dirname,'../../src/ui/App.html'),'utf8');

test('incluye el módulo de asignación de docentes a evaluadores',()=>{
  assert.match(source,/Asignación de docentes a evaluadores/);
  assert.match(source,/id="as-evaluator"/);
  assert.match(source,/id="as-teacher"/);
  assert.match(source,/Api\.call\('apiSaveAssignment'/);
  assert.match(source,/toggle-assignment/);
});

test('permite habilitar una cuenta evaluadora desde la ficha docente',()=>{
  assert.match(source,/Habilitar como evaluador/);
  assert.match(source,/Api\.call\('apiEnableTeacherEvaluator'/);
  assert.match(source,/Sin cuenta vinculada/);
  assert.match(source,/Ingrese el correo institucional/);
});
