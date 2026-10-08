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

test('incluye campo para configurar el logo institucional desde enlace de Drive',()=>{
  assert.match(source,/Logo de la institución \(enlace de Google Drive\)/);
  assert.match(source,/id="i-logo"/);
  assert.match(source,/logoDriveUrl:\s*\$\('#i-logo'\)\?\.value/);
});

test('AdminService.saveInstitution procesa enlace de Drive y almacena logo_drive_id',()=>{
  const vm=require('node:vm');
  const writes=[];
  let cacheRemovedKey = null;
  const context={
    console,
    Utilities:{getUuid:()=> 'inst-uuid-1'},
    Auth:{requireRoles:()=>({user_id:'admin-1'})},
    JsonUtil:{now:()=> '2026-10-08T00:00:00Z'},
    Validation:{
      required:(val)=>val,
      text:(val)=>val||''
    },
    Audit:{write:()=>{}},
    CacheService:{
      getScriptCache:()=>({
        remove:(k)=>{ cacheRemovedKey = k; }
      })
    },
    SheetsRepository:{
      find:()=>({institution_id:'inst-1',logo_drive_id:'old-logo-id'}),
      upsert:(table,keys,row)=>{ writes.push({table,row}); return row; }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../src/application/AdminService.gs'),'utf8'),context);

  const saved = context.AdminService.saveInstitution({
    institutionId: 'inst-1',
    name: 'Colegio Nacional',
    logoDriveUrl: 'https://drive.google.com/file/d/1XyZ9876543210_NEW-LOGO/view?usp=sharing'
  }, 'req-1');

  assert.equal(saved.logo_drive_id, '1XyZ9876543210_NEW-LOGO');
  assert.equal(saved.logo_drive_url, 'https://drive.google.com/file/d/1XyZ9876543210_NEW-LOGO/view?usp=sharing');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].row.logo_drive_id, '1XyZ9876543210_NEW-LOGO');
  assert.equal(cacheRemovedKey, 'LOGO_old-logo-id');
});
