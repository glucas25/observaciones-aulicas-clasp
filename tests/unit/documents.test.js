'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../src/gateways/DocsGateway.gs'),'utf8'),context);
test('proyecta una selección idéntica para anexos 2 y 3',()=>{const snapshot={visitCode:'VIS-2026-000001',institutionNameSnapshot:'Colegio',visitDate:'2026-01-01',teacherNameSnapshot:'Docente',generalResponses:[],evidenceChecks:[],rubricResponses:[{criterionCode:'CRI-01',criterionTitle:'Motivación',level:'ACHIEVED',descriptorSnapshot:'Descriptor oficial'}]};const a=context.DocsGateway.replacements(snapshot,'ANNEX_2');const b=context.DocsGateway.replacements(snapshot,'ANNEX_3');assert.equal(a.RUBRIC_SELECTIONS_TABLE,b.RUBRIC_SELECTIONS_TABLE);assert.match(a.RUBRIC_SELECTIONS_TABLE,/Descriptor oficial/);});
test('el expediente excluye Anexo 4',()=>{const title=context.DocsGateway.replacements({generalResponses:[],rubricResponses:[],evidenceChecks:[]},'FULL_PACKAGE').DOCUMENT_TITLE;assert.doesNotMatch(title,/ANEXO 4/);});

test('DocumentService reutiliza documento existente de Drive cuando force es false',()=>{
  const docContext={
    AppErrors:{validation:msg=>new Error(msg),document:msg=>new Error(msg)},
    Auth:{current:()=>({user_id:'user-1'}),assertVisit:()=>true},
    VisitService:{raw:()=>({visit_id:'v-1',data_version:1,status:'FINALIZED',row_version:1})},
    VisitState:{values:{FINALIZED:'FINALIZED',DOCUMENTS:'DOCUMENTS_GENERATED'}},
    AppConfig:{validate:()=>({templateVersion:'tpl-1',templateIds:{FULL_PACKAGE:'t-1'}})},
    SheetsRepository:{
      filter:(table,pred)=>{
        if(table==='VISIT_SNAPSHOTS')return [{visit_id:'v-1',data_version:1,snapshot_hash:'hash-1',snapshot_json:'{}'}];
        if(table==='DOCUMENTS')return [{
          document_id:'doc-1',
          visit_id:'v-1',
          data_version:1,
          document_type:'FULL_PACKAGE',
          template_version:'tpl-1',
          snapshot_hash:'hash-1',
          status:'READY',
          drive_file_id:'file-drive-123',
          superseded_at:''
        }].filter(pred);
        return [];
      },
      upsert:()=>{}
    },
    DriveApp:{
      getFileById:(id)=>({getUrl:()=>`https://drive.google.com/file/d/${id}/view`})
    },
    Utilities:{getUuid:()=>'uuid-test'},
    JsonUtil:{now:()=>'2026-10-07T00:00:00Z'},
    Audit:{write:()=>{}},
    DocsGateway:{render:()=>{throw new Error('No debe llamar a render si existe en Drive');}},
    MimeType:{PDF:'application/pdf'}
  };
  vm.createContext(docContext);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../../src/application/DocumentService.gs'),'utf8'),docContext);
  const result=docContext.DocumentService.generate('v-1','FULL_PACKAGE',{force:false});
  assert.equal(result.reused,true);
  assert.equal(result.drive_file_id,'file-drive-123');
  assert.equal(result.url,'https://drive.google.com/file/d/file-drive-123/view');
});
