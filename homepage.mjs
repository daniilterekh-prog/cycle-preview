const header=document.querySelector('.site-header'),menu=document.querySelector('.menu-toggle');
function closeMenu(){header.removeAttribute('data-menu-open');menu.setAttribute('aria-expanded','false');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));header.toggleAttribute('data-menu-open',open);});
document.querySelectorAll('#primary-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.hasAttribute('data-menu-open')){closeMenu();menu.focus();}});
const wide=matchMedia('(min-width:901px)');wide.addEventListener('change',closeMenu);
const buttons=[...document.querySelectorAll('[data-seek]')];
const map={strategy:'strategy',branding:'71',design:'135',digital:'167',systems:'191',final:'239'};
function syncStage(){buttons.forEach(b=>{const active=map[document.documentElement.dataset.stage]===b.dataset.seek;b.setAttribute('aria-pressed',String(active));});}
new MutationObserver(syncStage).observe(document.documentElement,{attributes:true,attributeFilter:['data-stage']});syncStage();
const form=document.querySelector('#contact-form'),result=document.querySelector('#contact-result');
form.addEventListener('input',()=>{result.hidden=true;});
form.addEventListener('submit',e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const d=new FormData(form),body=`Имя: ${d.get('name')}\nEmail: ${d.get('email')}\nЭтап: ${d.get('stage')}\n\n${d.get('message')}`;
 document.querySelector('#email-draft').value=body;
 document.querySelector('#open-email').href='mailto:daniilterekh@gmail.com?subject='+encodeURIComponent('Проект для CYCLE')+'&body='+encodeURIComponent(body);
 result.hidden=false;
});
