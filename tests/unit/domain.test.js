'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
const context={console,Set,Date};vm.createContext(context);
for(const rel of ['src/domain/Errors.gs','src/domain/VisitState.gs','src/domain/Validation.gs'])vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),context,{filename:rel});
test('permite las transiciones publicadas',()=>{assert.doesNotThrow(()=>context.VisitState.assertTransition('DRAFT','IN_REVIEW'));assert.doesNotThrow(()=>context.VisitState.assertTransition('FINALIZED','REOPENED'));});
test('rechaza saltar de borrador a finalizada',()=>{assert.throws(()=>context.VisitState.assertTransition('DRAFT','FINALIZED'),e=>e.code==='VALIDATION_ERROR');});
test('exige argumento para desacuerdo',()=>{assert.throws(()=>context.Validation.validateVisitDraft({generalResponses:[{result:'DISAGREE',argument:''}]}),e=>e.code==='VALIDATION_ERROR');});
test('exige justificación para No aplica',()=>{assert.throws(()=>context.Validation.validateVisitDraft({rubricResponses:[{level:'NOT_APPLICABLE',observation:''}]}),e=>e.code==='VALIDATION_ERROR');});
test('protege valores de fórmula para Sheets',()=>{assert.equal(context.Validation.safeCell('=IMPORTXML("x")'),'\'=IMPORTXML("x")');assert.equal(context.Validation.safeCell('texto'),'texto');});
test('valida un agregado final completo',()=>{const v={visitDate:'2020-01-02',teacherId:'t',gradeCourse:'1',subject:'Matemática',contentTopic:'Tema',shift:'Matutina',observationRecord:'Registro',strengths:'Fortaleza',improvements:'Mejora',directiveCommitments:'Compromiso',teacherCommitments:'Compromiso',generalResponses:Array.from({length:6},(_,i)=>({generalCriterionId:'g'+i,result:'FULLY_AGREE'})),rubricResponses:Array.from({length:15},(_,i)=>({criterionId:'r'+i,level:'ACHIEVED'})),aiUsed:false};assert.equal(context.Validation.validateForFinalization(v),true);});
test('permite finalizar sin registro narrativo opcional',()=>{const v={visitDate:'2020-01-02',teacherId:'t',gradeCourse:'1',subject:'Matemática',contentTopic:'Tema',shift:'Matutina',observationRecord:'',strengths:'Fortaleza',improvements:'Mejora',directiveCommitments:'Compromiso',teacherCommitments:'Compromiso',generalResponses:Array.from({length:6},(_,i)=>({generalCriterionId:'g'+i,result:'FULLY_AGREE'})),rubricResponses:Array.from({length:15},(_,i)=>({criterionId:'r'+i,level:'ACHIEVED'})),aiUsed:false};assert.equal(context.Validation.validateForFinalization(v),true);});
test('permite pasar a revisión colaborativa sin compromiso docente previo',()=>{const v={visitDate:'2020-01-02',teacherId:'t',gradeCourse:'1',subject:'Matemática',contentTopic:'Tema',shift:'Matutina',strengths:'Fortaleza',improvements:'Mejora',directiveCommitments:'Compromiso directivo',teacherCommitments:'',generalResponses:Array.from({length:6},(_,i)=>({generalCriterionId:'g'+i,result:'FULLY_AGREE'})),rubricResponses:Array.from({length:15},(_,i)=>({criterionId:'r'+i,level:'ACHIEVED'})),aiUsed:false};assert.equal(context.Validation.validateForReview(v),true);assert.throws(()=>context.Validation.validateForFinalization(v),e=>e.code==='VALIDATION_ERROR');});

