var AiGateway = (function () {
  var outputSchema={type:'object',additionalProperties:false,properties:{strengths:{type:'string'},improvements:{type:'string'},directiveCommitments:{type:'string'},teacherCommitments:{type:'string'},observations:{type:'string'},warnings:{type:'array',items:{type:'string'}}},required:['strengths','improvements','directiveCommitments','teacherCommitments','observations','warnings']};
  function extract_(response) {
    if(response.output_text) return response.output_text;
    var output=response.output||[];
    for(var i=0;i<output.length;i++) for(var j=0;j<(output[i].content||[]).length;j++) if(output[i].content[j].text) return output[i].content[j].text;
    throw AppErrors.ai('El proveedor no devolvió contenido utilizable.');
  }
  function generate(input) {
    var config=AppConfig.get();
    if(!config.aiEnabled) throw AppErrors.ai('La asistencia de IA está desactivada.');
    if(config.aiProvider!=='OPENAI'||!config.aiApiKey||!config.aiModel) throw AppErrors.ai('La asistencia de IA no está configurada.');
    var prompt='Redacta cinco bloques profesionales para retroalimentación pedagógica. Usa exclusivamente los hechos dados; no cambies niveles, no inventes hechos, no diagnostiques ni infieras atributos personales. Contexto anonimizado:\n'+JSON.stringify(input);
    var payload={model:config.aiModel,store:false,input:[{role:'system',content:'Eres un asistente de redacción pedagógica prudente. Devuelve solo el JSON solicitado.'},{role:'user',content:prompt}],text:{format:{type:'json_schema',name:'pedagogical_draft',strict:true,schema:outputSchema}}};
    var cache=CacheService.getScriptCache(),blockedUntil=Number(cache.get('AI_BLOCKED_UNTIL')||0);if(blockedUntil>Date.now())throw AppErrors.ai('La asistencia de IA está temporalmente pausada tras varios fallos.');
    var options={method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+config.aiApiKey},payload:JSON.stringify(payload),muteHttpExceptions:true},response;
    for(var attempt=0;attempt<2;attempt++){response=UrlFetchApp.fetch(config.aiEndpoint,options);var code=response.getResponseCode();if(code>=200&&code<300)break;if(attempt===0&&(code===429||code>=500)){Utilities.sleep(500);continue;}cache.put('AI_BLOCKED_UNTIL',String(Date.now()+60000),60);break;}
    if(response.getResponseCode()<200||response.getResponseCode()>=300) throw AppErrors.ai('El proveedor de IA rechazó la solicitud.');
    var parsed=JSON.parse(response.getContentText()),result=JSON.parse(extract_(parsed));
    ['strengths','improvements','directiveCommitments','teacherCommitments','observations'].forEach(function(k){ result[k]=Validation.text(result[k],5000); });
    result.warnings=Array.isArray(result.warnings)?result.warnings.map(function(v){return Validation.text(v,500);}):[];
    return result;
  }
  return {generate:generate};
})();
