'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../src/gateways/DocsGateway.gs'),'utf8'),context);
test('proyecta una selección idéntica para anexos 2 y 3',()=>{const snapshot={visitCode:'VIS-2026-000001',institutionNameSnapshot:'Colegio',visitDate:'2026-01-01',teacherNameSnapshot:'Docente',generalResponses:[],evidenceChecks:[],rubricResponses:[{criterionCode:'CRI-01',criterionTitle:'Motivación',level:'ACHIEVED',descriptorSnapshot:'Descriptor oficial'}]};const a=context.DocsGateway.replacements(snapshot,'ANNEX_2');const b=context.DocsGateway.replacements(snapshot,'ANNEX_3');assert.equal(a.RUBRIC_SELECTIONS_TABLE,b.RUBRIC_SELECTIONS_TABLE);assert.match(a.RUBRIC_SELECTIONS_TABLE,/Descriptor oficial/);});
test('el expediente excluye Anexo 4',()=>{const title=context.DocsGateway.replacements({generalResponses:[],rubricResponses:[],evidenceChecks:[]},'FULL_PACKAGE').DOCUMENT_TITLE;assert.doesNotMatch(title,/ANEXO 4/);});
