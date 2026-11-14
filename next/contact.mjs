export function draftInquiry({name='',contact='',engagement='',message=''}={},t=value=>value){
 const label={full:'Полный цикл',single:'Отдельная задача',undecided:'Пока определяем задачу'}[engagement]||engagement||'Пока определяем задачу';
 return `${t('Имя')}: ${name.trim()}\n${t('Контакт')}: ${contact.trim()}\n${t('Формат')}: ${t(label)}\n\n${message.trim() || t('Обсудить задачу на знакомстве.')}`;
}
export async function deliverInquiry({endpoint,payload,fetcher=fetch,signal}){
 if(!endpoint)throw Error('Отправка с сайта ещё не подключена.');
 const response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal});
 if(!response.ok)throw Error('Не удалось отправить обращение. Данные сохранены — попробуйте ещё раз или напишите на почту.');
 let result;try{result=await response.json();}catch(error){if(error.name==='AbortError')throw error;throw Error('Сервис не подтвердил получение. Проверьте отправку или свяжитесь по почте.');}
 if(result?.accepted!==true)throw Error('Сервис не подтвердил получение. Проверьте отправку или свяжитесь по почте.');
 return result;
}
