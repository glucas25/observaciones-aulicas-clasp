'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'../..');
const context={
  console:{error:()=>{},warn:()=>{},log:()=>{}},
  Date,
  isFinite,
  isNaN,
  Utilities:{getUuid:()=> 'request-1'}
};
vm.createContext(context);
for(const rel of ['src/infrastructure/Json.gs','src/controllers/ApiController.gs']){
  vm.runInContext(fs.readFileSync(path.join(root,rel),'utf8'),context,{filename:rel});
}

test('normaliza fechas anidadas antes de responder a google.script.run',()=>{
  const result=context.ApiController.invoke(()=>({
    createdAt:new Date('2026-09-30T12:34:56.000Z'),
    rows:[{updatedAt:new Date('2026-09-29T01:02:03.000Z')}]
  }));
  assert.equal(result.ok,true);
  assert.equal(result.data.createdAt,'2026-09-30T12:34:56.000Z');
  assert.equal(result.data.rows[0].updatedAt,'2026-09-29T01:02:03.000Z');
});

test('normaliza fechas en los detalles de un error',()=>{
  const result=context.ApiController.invoke(()=>{throw {code:'TEST_ERROR',message:'falló',details:{when:new Date('2026-09-30T00:00:00.000Z')}};});
  assert.equal(result.ok,false);
  assert.equal(result.error.code,'TEST_ERROR');
  assert.equal(result.error.details.when,'2026-09-30T00:00:00.000Z');
});
