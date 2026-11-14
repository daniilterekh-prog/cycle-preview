import {draftInquiry,deliverInquiry} from './contact.mjs';
import {siteConfig} from './site-config.mjs';
import {installLanguages,translator} from './language.mjs?v=story-access-1';
const t=translator();installLanguages();
const header=document.querySelector('.site-header'),menu=document.querySelector('.menu-toggle');
function closeMenu(){header.removeAttribute('data-menu-open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));header.toggleAttribute('data-menu-open',open);});
document.querySelectorAll('#primary-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.hasAttribute('data-menu-open')){closeMenu();menu.focus();}});
matchMedia('(min-width:901px)').addEventListener('change',closeMenu);
const buttons=[...document.querySelectorAll('[data-seek]')];
const map={strategy:'strategy',branding:'71',design:'135',digital:'167',systems:'191',final:'239'};
function syncStage(){buttons.forEach(b=>b.setAttribute('aria-pressed',String(map[document.documentElement.dataset.stage]===b.dataset.seek)));}
new MutationObserver(syncStage).observe(document.documentElement,{attributes:true,attributeFilter:['data-stage']});syncStage();
// Local semantic events; no tracking vendor, storage or personal data transmission.
const signal=(name,detail={})=>document.dispatchEvent(new CustomEvent('cycle:interaction',{detail:{name,...detail}}));
document.querySelectorAll('.case-detail').forEach(el=>el.addEventListener('toggle',()=>{if(el.open)signal('case_open',{caseId:el.closest('.case-card').id});}));
document.querySelectorAll('a[href="#contact"]').forEach(a=>a.addEventListener('click',()=>signal('contact_open')));
const form=document.querySelector('#contact-form'),result=document.querySelector('#contact-result'),status=result.querySelector('[role="status"]'),submit=form.querySelector('[type="submit"]'),openEmail=document.querySelector('#open-email');
let pending=false,lastPayload='',submissionId='';
form.addEventListener('input',()=>{if(!pending)result.hidden=true;});
for(const a of document.querySelectorAll('[data-engagement]'))a.addEventListener('click',()=>{form.elements.engagement.value=a.dataset.engagement;result.hidden=true;});
if(siteConfig.contactEndpoint){submit.querySelector('span').textContent=t('Отправить обращение');document.querySelector('#delivery-note').textContent=t('Ответим по указанному контакту и уточним задачу.');}
for(const field of form.querySelectorAll('input,textarea,select')){
 field.addEventListener('invalid',()=>field.setCustomValidity(t(field.validity.valueMissing?'Заполните это поле.':'Проверьте введённые данные.')));
 field.addEventListener('input',()=>field.setCustomValidity(''));
 field.addEventListener('change',()=>field.setCustomValidity(''));
}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(pending||!form.reportValidity())return;
 const d=Object.fromEntries(new FormData(form)),body=draftInquiry(d,t);
 document.querySelector('#email-draft').value=body;
 openEmail.href='mailto:'+siteConfig.email+'?subject='+encodeURIComponent(t('Проект для CYCLE'))+'&body='+encodeURIComponent(body);
 result.hidden=false;openEmail.hidden=false;
 if(!siteConfig.contactEndpoint){status.textContent=t('Черновик готов. Письмо ещё не отправлено.');status.focus({preventScroll:true});signal('contact_draft');return;}
 const serialized=JSON.stringify(d);if(serialized!==lastPayload){submissionId=crypto.randomUUID();lastPayload=serialized;}
 pending=true;submit.disabled=true;form.setAttribute('aria-busy','true');status.textContent=t('Отправляем обращение…');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{await deliverInquiry({endpoint:siteConfig.contactEndpoint,payload:{...d,locale:document.documentElement.dataset.locale||'ru',submissionId},signal:controller.signal});status.textContent=t('Обращение получено. Свяжемся с вами по указанному контакту.');openEmail.hidden=true;signal('contact_received');}
 catch(error){status.textContent=t(error.name==='AbortError'?'Не удалось подтвердить получение вовремя. Данные сохранены — повторите попытку или напишите на почту.':error instanceof TypeError?'Не удалось отправить обращение. Данные сохранены — попробуйте ещё раз или напишите на почту.':error.message);}
 finally{clearTimeout(timer);pending=false;submit.disabled=false;form.removeAttribute('aria-busy');status.focus({preventScroll:true});}
});
