export const stages=[
 {id:'branding',start:0,end:71,phase:'Сборка каркаса'},
 {id:'design',start:72,end:135,phase:'Фактура снизу вверх'},
 {id:'digital',start:136,end:167,phase:'Живая среда проекта'},
 {id:'systems',start:168,end:191,phase:'IT & CRM — система работает'},
 {id:'final',start:192,end:239,phase:'Полный цикл — финальное отдаление'}
];
export function stageForFrame(index){const frame=Math.max(0,Math.min(239,Math.round(Number(index)||0)));return stages.find(stage=>frame<=stage.end);}
