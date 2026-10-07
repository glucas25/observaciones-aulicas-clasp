'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');

test('habilitar un docente reutiliza la cuenta y guarda el vínculo',()=>{
  const teacher={teacher_id:'teacher-1',teacher_code:'DOC-1',institution_id:'inst-1',full_name:'Ana Docente',email:'ANA@EXAMPLE.COM',active:true,created_at:'old',updated_at:'old',user_id:''};
  const existingUser={user_id:'user-1',email:'ana@example.com',display_name:'Ana',role:'EVALUATOR',institution_id:'inst-1',active:true,created_at:'old',updated_at:'old',last_access_at:''};
  const writes=[];
  const context={
    console,
    Utilities:{getUuid:()=> 'new-id'},
    Auth:{requireRoles:()=>({user_id:'admin-1'})},
    JsonUtil:{now:()=> 'now'},
    Validation:{required:(value,label)=>{if(!String(value||'').trim())throw new Error(label);return String(value).trim();}},
    AppErrors:{validation:message=>Object.assign(new Error(message),{code:'VALIDATION_ERROR'})},
    Audit:{write:()=>{}},
    SheetSchema:{all:{TEACHERS:['teacher_id','user_id']}},
    SheetsRepository:{
      ensureColumns:()=>{},
      find:(name,field,value)=>name==='TEACHERS'&&String(value)==='teacher-1'?teacher:null,
      filter:(name,predicate)=>name==='USERS'?[existingUser].filter(predicate):[],
      upsert:(name,keys,row)=>{writes.push({name,row:Object.assign({},row)});return row;},
      all:()=>[],recent:()=>[]
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'src/application/AdminService.gs'),'utf8'),context,{filename:'AdminService.gs'});
  const result=context.AdminService.enableTeacherEvaluator({teacherId:'teacher-1'},'request-1');
  assert.equal(result.user.user_id,'user-1');
  assert.equal(result.teacher.user_id,'user-1');
  assert.equal(writes.filter(write=>write.name==='USERS').length,1);
  assert.equal(writes.find(write=>write.name==='TEACHERS').row.user_id,'user-1');
});

test('el esquema docente incorpora el vínculo al final para migración compatible',()=>{
  const context={};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root,'src/repositories/sheets/Schema.gs'),'utf8'),context);
  const headers=Array.from(context.SheetSchema.all.TEACHERS);
  assert.equal(headers.at(-1),'user_id');
});
