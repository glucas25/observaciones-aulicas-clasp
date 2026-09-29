'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const teachers=[{teacher_id:'t-eval',email:'eval@school.edu',active:true},{teacher_id:'t-other',email:'other@school.edu',active:true}];
const assignments=[{evaluator_user_id:'u-eval',teacher_id:'t-other',effective_from:'2026-01-01',effective_to:'2026-12-31',active:true}];
const context={console,Session:{getActiveUser:()=>({getEmail:()=>''})},SheetsRepository:{
  find:()=>null,
  filter:(name,predicate)=>({TEACHERS:teachers,EVALUATOR_ASSIGNMENTS:assignments}[name]||[]).filter(predicate)
}};
vm.createContext(context);
for(const rel of ['src/domain/Errors.gs','src/infrastructure/Auth.gs'])vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),context,{filename:rel});
const evaluator={user_id:'u-eval',email:'eval@school.edu',role:'EVALUATOR'};
const directive={user_id:'u-dir',email:'dir@school.edu',role:'DIRECTIVE',institution_id:'i1'};
const teacher={user_id:'u-teacher',email:'other@school.edu',role:'TEACHER'};
const own={evaluator_user_id:'u-eval',teacher_id:'t-other',institution_id:'i1',status:'DRAFT'};
const receivedFinal={evaluator_user_id:'someone',teacher_id:'t-other',status:'FINALIZED'};
const receivedDraft={evaluator_user_id:'someone',teacher_id:'t-other',status:'DRAFT'};
test('evaluador solo crea para asignaciones vigentes',()=>{assert.equal(context.Auth.hasActiveAssignment(evaluator,teachers[1],'2026-09-01'),true);assert.equal(context.Auth.hasActiveAssignment(evaluator,teachers[1],'2027-01-01'),false);});
test('directivo ve todas pero solo edita las propias',()=>{assert.equal(context.Auth.canViewVisit(directive,own),true);assert.equal(context.Auth.canEditVisit(directive,own),false);assert.equal(context.Auth.canEditVisit({...directive,user_id:'u-eval'},own),true);});
assert.equal(context.Auth.canViewVisit(directive,{...own,institution_id:'i2'}),false);
test('docente ve una evaluación recibida solo al finalizar',()=>{assert.equal(context.Auth.canViewVisit(teacher,receivedFinal),true);assert.equal(context.Auth.canViewVisit(teacher,receivedDraft),false);assert.equal(context.Auth.canEditVisit(teacher,receivedFinal),false);});
test('evaluador no puede autoevaluarse',()=>{assert.throws(()=>context.Auth.assertCanCreate(evaluator,teachers[0],'2026-09-01'),e=>e.code==='FORBIDDEN');});
