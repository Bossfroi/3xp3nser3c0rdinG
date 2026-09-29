const TYPES=['Asset','Liability','Equity','Income','Expense'];
const L={en:{title:'Ledger',signin:'Sign in',lang:'Tagalog',month:'Month',signout:'Sign out',assets:'Total assets',liab:'Total liabilities',equity:'Equity / net worth',net:'Net income (period)',coa:'Chart of accounts',add:'Add account',save:'Save account',entry:'Journal entry',post:'Post entry',update:'Update entry',cancel:'Cancel',ledger:'Account ledger',all:'All transactions',tb:'Trial balance',user:'Username',pass:'Password',name:'Account name',memo:'Memo',amount:'Amount',debit:'Debit account',credit:'Credit account',all_acc:'All accounts',date:'Date',bal:'Balance',dr:'Debit',cr:'Credit',total:'Total',diff:'Out of balance by',ok:'Balanced',edit:'Edit',del:'Delete',type:'Type',acct:'Account',saving:'Saving…',saved:'All changes saved',nosave:'Not saved: ',expired:'Session expired. Please sign in again.',same:'Debit and credit accounts must be different.',hasTx:'This account has transactions and cannot be deleted.',none:'No entries yet. Post one using the journal entry form.',confirm:'Delete this?',opening:'Opening balance',from:'From',to:'To'},
tl:{title:'Talaan',signin:'Mag-sign in',lang:'English',month:'Buwan',signout:'Mag-sign out',assets:'Kabuuang ari-arian',liab:'Kabuuang utang',equity:'Equity / net worth',net:'Netong kita (panahon)',coa:'Talaan ng mga account',add:'Magdagdag ng account',save:'I-save ang account',entry:'Journal entry',post:'I-post ang entry',update:'I-update ang entry',cancel:'Kanselahin',ledger:'Ledger ng account',all:'Lahat ng transaksyon',tb:'Trial balance',user:'Username',pass:'Password',name:'Pangalan ng account',memo:'Memo',amount:'Halaga',debit:'Debit na account',credit:'Credit na account',all_acc:'Lahat ng account',date:'Petsa',bal:'Balanse',dr:'Debit',cr:'Credit',total:'Kabuuan',diff:'Hindi balanse ng',ok:'Balanse',edit:'I-edit',del:'Burahin',type:'Uri',acct:'Account',saving:'Sine-save…',saved:'Nai-save na lahat',nosave:'Hindi nai-save: ',expired:'Nag-expire ang session. Mag-sign in muli.',same:'Dapat magkaiba ang debit at credit na account.',hasTx:'May transaksyon ang account na ito kaya hindi mabubura.',none:'Wala pang entry. Mag-post gamit ang form.',confirm:'Burahin ito?',opening:'Panimulang balanse',from:'Mula',to:'Hanggang'}};
let lang=localStorage.lang||'en',S={accounts:[],transactions:[]},editAcc=null,editTx=null;
const $=id=>document.getElementById(id),t=k=>L[lang][k]||k,esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const money=n=>(n<0?'-':'')+'₱'+Math.abs(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const live=()=>S.accounts.filter(a=>!a.deleted),acc=id=>S.accounts.find(a=>a.id===id);
const uid=()=>crypto.randomUUID();let MIG=[];
const fmt=(s,o)=>s.replace(/\{(\w+)\}/g,(_,k)=>o[k]);
const issueText=i=>fmt(t('i_'+i.code),{n:i.name||'',ty:i.type||'',side:t(i.side==='debit'?'sd':'sc'),norm:t(i.norm==='debit'?'sd':'sc'),amt:money(i.amt||0),diff:money(Math.abs(i.diff||0)),a:(i.accounts||[]).join(', '),d:i.tx?i.tx.date:'',m:i.tx?i.tx.description:'',r:i.reason||''});
function openingOf(a){const x=S.transactions.find(y=>y.opening&&y.accountId===a.id);return x?Math.round(delta(a,x)*100)/100:0}
// Opening balances are real journal entries against the system 'Opening Balance Equity' account.
function syncOpening(a,amt,date){S.transactions=S.transactions.filter(y=>!(y.opening&&y.accountId===a.id));if(!amt)return;const ad=(amt>0)===DEBIT.includes(a.type);
 S.transactions.push({id:uid(),date:date||ymd(new Date()),description:t('opening'),amount:Math.abs(amt),debitAccountId:ad?a.id:OBE_ID,creditAccountId:ad?OBE_ID:a.id,opening:true,accountId:a.id})}
function normalize(){let ch=false;MIG=[];if(!S.accounts.some(a=>a.id===OBE_ID)){S.accounts.push({id:OBE_ID,name:'Opening Balance Equity',type:'Equity',system:true});ch=true}
 const first=S.transactions.map(x=>x.date).sort()[0]||ymd(new Date());
 S.accounts.forEach(a=>{if(!('openingBalance' in a))return;const ob=Math.round((+a.openingBalance||0)*100)/100;delete a.openingBalance;ch=true;if(ob){syncOpening(a,ob,first);MIG.push(fmt(t('i_mig'),{n:a.name,v:money(ob),d:first}))}});return ch}
function pres(){const o=S.transactions.find(y=>y.id===editTx);return o&&o.opening?{opening:true,accountId:o.accountId}:{}}
const sorted=()=>[...S.transactions].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
async function api(path,opt){const r=await fetch(path,{headers:{'Content-Type':'application/json'},...opt});const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||r.status),{status:r.status});return j}
async function persist(){const s=$('status');s.className='';s.textContent=t('saving');try{await api('/api/data',{method:'PUT',body:JSON.stringify(S)});s.textContent=t('saved')}catch(e){if(e.status===401){show(false);$('lerr').textContent=t('expired');return}s.className='err';s.textContent=t('nosave')+e.message}}
function show(on){$('app').classList.toggle('hidden',!on);$('login').classList.toggle('hidden',on)}
async function load(){try{S=await api('/api/data');show(true);init();const ch=normalize();render();if(ch)persist()}catch{show(false)}}
function applyLang(){document.documentElement.lang=lang;document.querySelectorAll('[data-t]').forEach(e=>e.textContent=t(e.dataset.t));document.querySelectorAll('[data-p]').forEach(e=>e.placeholder=t(e.dataset.p));$('tsv').textContent=t(editTx?'update':'post');$('asv').textContent=t(editAcc?'save':'add')}
function init(){$('at').innerHTML=TYPES.map(x=>`<option>${x}</option>`).join('');initCharts();if(!$('td').value)$('td').value=new Date().toISOString().slice(0,10)}
function opts(sel,all){const cur=sel.value;sel.innerHTML=(all?`<option value="">${t('all_acc')}</option>`:'')+live().map(a=>`<option value="${a.id}">${esc(a.name)} (${a.type})</option>`).join('');if([...sel.options].some(o=>o.value===cur))sel.value=cur}
function rowsTable(head,rows){return rows.length?`<table><tr>${head}</tr>${rows.join('')}</table>`:`<p>${t('none')}</p>`}
function txRow(x,extra=''){const d=acc(x.debitAccountId),c=acc(x.creditAccountId);return`<tr><td>${x.date}</td><td>${esc(x.description)}${x.opening?` <small>(${t('otag')})</small>`:''}</td><td>${esc(d?.name)}</td><td>${esc(c?.name)}</td><td class="n">${money(x.amount)}</td>${extra}<td><button class="link" data-e="${x.id}">${t('edit')}</button> <button class="link neg" data-d="${x.id}">${t('del')}</button></td></tr>`}
function render(){applyLang();const R=report();
$('hA').textContent=money(R.assets);$('hL').textContent=money(R.liab);$('hE').textContent=money(R.equity);$('hN').textContent=money(R.income-R.expense);$('hN').className=R.income-R.expense<0?'neg':'pos';
$('accts').innerHTML=rowsTable(`<th>${t('acct')}</th><th>${t('type')}</th><th class="n">${t('bal')}</th><th></th>`,live().map(a=>`<tr><td>${esc(a.name)}</td><td class="${a.type}">${a.type}</td><td class="n">${money(R.shown[a.id])}${PL.includes(a.type)?' <small>'+t('ptag')+'</small>':''}</td><td>${a.system?'':`<button class="link" data-ae="${a.id}">${t('edit')}</button> <button class="link neg" data-ad="${a.id}">${t('del')}</button>`}</td></tr>`));
['tdb','tcr'].forEach((id,i)=>{opts($(id));});$('tdb').options[0]&&($('tdb').title=t('debit'));$('tcr').title=t('credit');
opts($('lsel'));opts($('fsel'),true);
const la=acc($('lsel').value);let run=0;
$('lout').innerHTML=la?rowsTable(`<th>${t('date')}</th><th>Memo</th><th>${t('dr')}</th><th>${t('cr')}</th><th class="n">${t('amount')}</th><th class="n">${t('bal')}</th><th></th>`,
[...sorted().filter(x=>(x.debitAccountId===la.id||x.creditAccountId===la.id)&&x.date<=R.to).map(x=>{run+=delta(la,x);return txRow(x,`<td class="n">${money(run)}</td>`)})]):'';
const f=$('fsel').value,ff=$('ff').value,ft=$('ft').value;
$('aout').innerHTML=rowsTable(`<th>${t('date')}</th><th>Memo</th><th>${t('dr')}</th><th>${t('cr')}</th><th class="n">${t('amount')}</th><th></th>`,
sorted().filter(x=>(!f||x.debitAccountId===f||x.creditAccountId===f)&&(!ff||x.date>=ff)&&(!ft||x.date<=ft)).map(x=>txRow(x)));
const tb=R.tb,row=(n,v,b)=>`<tr><${b?'th':'td'}>${esc(n)}</${b?'th':'td'}><${b?'th':'td'} class="n">${money(v)}</${b?'th':'td'}></tr>`,sec=(h,l)=>`<tr><th colspan="2">${h}</th></tr>`+l.filter(o=>o.v).map(o=>row(o.name,o.v)).join('');
$('tbout').innerHTML=`<table><tr><th>${t('acct')} (${t('asof')} ${R.to})</th><th class="n">${t('dr')}</th><th class="n">${t('cr')}</th></tr>${tb.rows.map(r=>`<tr><td>${esc(r.name)}</td><td class="n">${r.d?money(r.d):''}</td><td class="n">${r.c?money(r.c):''}</td></tr>`).join('')}<tr><th>${t('total')}</th><th class="n">${money(tb.D)}</th><th class="n">${money(tb.C)}</th></tr></table><p class="${tb.D!==tb.C?'neg':'pos'}">${tb.D!==tb.C?t('diff')+' '+money(Math.abs(tb.D-tb.C)):'✓ '+t('ok')}</p>`;
const Ls=R.lists,ni=Math.round((R.income-R.expense)*100)/100;
$('isout').innerHTML=`<table>${sec(t('income'),Ls.Ip)}${row(t('totInc'),R.income,1)}${sec(t('expense'),Ls.Xp)}${row(t('totExp'),R.expense,1)}${row(t('net'),ni,1)}</table><p>${R.from} – ${R.to}</p>`;
const chk=Math.round((R.assets-R.liab-R.equity)*100);
$('bsout').innerHTML=`<table>${sec(t('assets'),Ls.A)}${row(t('totA'),R.assets,1)}${sec(t('liab'),Ls.Lb)}${row(t('totL'),R.liab,1)}${sec(t('equity'),Ls.E)}${row(t('earn'),R.earnings)}${row(t('totE'),R.equity,1)}${row(t('le'),R.liab+R.equity,1)}</table><p class="${chk?'neg':'pos'}">${chk?t('diff')+' '+money(Math.abs(chk)/100):'✓ '+t('ok')} (${t('asof')} ${R.to})</p>`;
$('integ').innerHTML=(R.issues.length?R.issues.map(i=>`<p class="${i.level==='error'?'neg':'warn'}">⚠ ${esc(issueText(i))}</p>`+(i.entries||[]).map(en=>`<p class="ent">${en.date} · ${esc(en.desc)}${en.opening?' ('+t('otag')+')':''} · ${t(en.side==='debit'?'sd':'sc')} ${money(en.amount)} <button class="link" data-sw="${en.id}">${t('swap')}</button></p>`).join('')).join(''):`<p class="pos">✓ ${t('okAll')}</p>`)+MIG.map(m=>`<p class="warn">ℹ ${esc(m)}</p>`).join('');
drawCharts(R)}
document.addEventListener('click',async e=>{const d=e.target.dataset;if(!d)return;
if(d.sw){if(confirm(t('swapq'))){const x=S.transactions.find(y=>y.id===d.sw);if(x){[x.debitAccountId,x.creditAccountId]=[x.creditAccountId,x.debitAccountId];render();persist()}}return}
if(d.e){const x=S.transactions.find(y=>y.id===d.e);editTx=x.id;$('td').value=x.date;$('tm').value=x.description;$('ta').value=x.amount;$('tdb').value=x.debitAccountId;$('tcr').value=x.creditAccountId;$('tcx').classList.remove('hidden');applyLang();$('tf').scrollIntoView()}
if(d.d&&confirm(t('confirm'))){S.transactions=S.transactions.filter(y=>y.id!==d.d);render();persist()}
if(d.ae){const a=acc(d.ae);editAcc=a.id;$('an').value=a.name;$('at').value=a.type;$('ao').value=openingOf(a);$('ac').checked=!!a.isCash;applyLang()}
if(d.ad){$('aerr').textContent='';const a=acc(d.ad);if(a.system||S.transactions.some(x=>!(x.opening&&x.accountId===d.ad)&&(x.debitAccountId===d.ad||x.creditAccountId===d.ad)))return void($('aerr').textContent=t('hasTx'));if(confirm(t('confirm'))){S.transactions=S.transactions.filter(x=>!(x.opening&&x.accountId===d.ad));a.deleted=true;render();persist()}}});
function resetTx(){editTx=null;$('tf').reset();$('td').value=new Date().toISOString().slice(0,10);$('tcx').classList.add('hidden');$('terr').textContent=''}
$('tcx').onclick=()=>{resetTx();applyLang()};
$('tf').onsubmit=e=>{e.preventDefault();const x={id:editTx||uid(),date:$('td').value,description:$('tm').value.trim(),amount:Math.round(+$('ta').value*100)/100,debitAccountId:$('tdb').value,creditAccountId:$('tcr').value,...pres()};const er=AC.validateTx(x,live());if(er)return void($('terr').textContent=t(er==='same'?'same':'bad'));
S.transactions=editTx?S.transactions.map(y=>y.id===editTx?x:y):[...S.transactions,x];resetTx();render();persist()};
$('af').onsubmit=e=>{e.preventDefault();$('aerr').textContent='';const v={name:$('an').value.trim(),type:$('at').value,isCash:$('ac').checked&&$('at').value==='Asset'},ob=Math.round((+$('ao').value||0)*100)/100;
let a=editAcc?acc(editAcc):null;if(a&&a.system)return;const cur=a?openingOf(a):0;
if(ob!==cur&&ob!==0&&PL.includes(v.type))return void($('aerr').textContent=t('noOpenPL'));
if(a)Object.assign(a,v);else{a={id:uid(),...v};S.accounts.push(a)}
if(ob!==cur)syncOpening(a,ob);editAcc=null;$('af').reset();render();persist()};
['lsel','fsel','ff','ft'].forEach(id=>$(id).onchange=render);
document.querySelectorAll('.lang').forEach(b=>b.onclick=e=>{e.preventDefault();lang=lang==='en'?'tl':'en';localStorage.lang=lang;applyLang();S.accounts.length&&render()});
$('lf').onsubmit=async e=>{e.preventDefault();$('lerr').textContent='';try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({username:$('u').value,password:$('p').value})});$('p').value='';load()}catch(err){$('lerr').textContent=err.message}};
$('out').onclick=async()=>{await api('/api/auth/logout',{method:'POST'}).catch(()=>{});show(false)};
applyLang();load();
