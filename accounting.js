// SINGLE SOURCE OF TRUTH. Every balance, card, chart and report is derived from posted journal lines here.
const DEBIT=['Asset','Expense'],PL=['Income','Expense'],OBE_ID='sys-obe';
const normalBalance=t=>DEBIT.includes(t)?'debit':'credit'; // the ONLY place normal balance is defined
function delta(a,x){const s=normalBalance(a.type)==='debit'?1:-1;return((x.debitAccountId===a.id?1:0)-(x.creditAccountId===a.id?1:0))*s*x.amount}
const AC=(()=>{const c=n=>Math.round(n*100),sg=a=>normalBalance(a.type)==='debit'?1:-1;
function validateTx(x,accts){const m=new Set(accts.map(a=>a.id));
 if(!(Number.isFinite(x.amount)&&x.amount>0))return'amount';if(!/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))return'date';
 if(!m.has(x.debitAccountId)||!m.has(x.creditAccountId))return'account';return x.debitAccountId===x.creditAccountId?'same':null}
function compute(accts,txs,from,to){
 const y0=+from.slice(0,4),m0=+from.slice(5,7)-1,N=Math.max(1,Math.min(60,(+to.slice(0,4)-y0)*12+ +to.slice(5,7)-1-m0+1)),
 months=Array.from({length:N},(_,i)=>{const k=y0*12+m0+i;return`${Math.floor(k/12)}-${String(k%12+1).padStart(2,'0')}`}),
 by=new Map(accts.map(a=>[a.id,a])),Z=()=>Array(N).fill(0),st={},act={},dr={},cr={},issues=[],seen=new Set(),cf=months.map(()=>({in:0,out:0})),
 cash=new Set(accts.filter(a=>a.isCash&&!a.deleted).map(a=>a.id));let has=false;
 accts.forEach(a=>{st[a.id]=0;act[a.id]=Z();dr[a.id]=0;cr[a.id]=0});
 txs.forEach(x=>{const e=validateTx(x,accts);if(e||seen.has(x.id)){issues.push({level:'error',code:e?'bad':'dup',tx:x,reason:e||'id'});return}seen.add(x.id);
  if(x.date>to)return;const amt=c(x.amount),inR=x.date>=from,i=months.indexOf(x.date.slice(0,7));
  dr[x.debitAccountId]+=amt;cr[x.creditAccountId]+=amt;
  [[x.debitAccountId,1],[x.creditAccountId,-1]].forEach(([id,d])=>{const v=d*sg(by.get(id))*amt;if(inR&&i>=0)act[id][i]+=v;else st[id]+=v});
  if(inR){has=true;const di=cash.has(x.debitAccountId);if(i>=0&&di!==cash.has(x.creditAccountId))di?cf[i].in+=x.amount:cf[i].out+=x.amount}});
 const sum=id=>act[id].reduce((s,v)=>s+v,0),end={},period={},shown={};
 accts.forEach(a=>{period[a.id]=sum(a.id)/100;end[a.id]=(st[a.id]+sum(a.id))/100;shown[a.id]=PL.includes(a.type)?period[a.id]:end[a.id]});
 const inc=Z(),exp=Z(),nw=Z(),run={...st};
 months.forEach((k,i)=>{let A=0,L=0;accts.forEach(a=>{const v=act[a.id][i];run[a.id]+=v;if(a.type==='Income')inc[i]+=v/100;if(a.type==='Expense')exp[i]+=v/100;if(a.type==='Asset')A+=run[a.id];if(a.type==='Liability')L+=run[a.id]});nw[i]=(A-L)/100});
 const of=(ty,m)=>accts.filter(a=>a.type===ty&&!a.deleted).map(a=>({id:a.id,name:a.name,v:m[a.id]})),tot=l=>Math.round(l.reduce((s,o)=>s+o.v*100,0))/100;
 const A=of('Asset',end),Lb=of('Liability',end),E=of('Equity',end),I=of('Income',end),X=of('Expense',end),Ip=of('Income',period),Xp=of('Expense',period);
 const assets=tot(A),liab=tot(Lb),eqAcc=tot(E),earnings=Math.round((tot(I)-tot(X))*100)/100,equity=Math.round((eqAcc+earnings)*100)/100;
 let Dc=0,Cc=0;const rows=accts.map(a=>{const n=dr[a.id]-cr[a.id];n>0?Dc+=n:Cc-=n;return{id:a.id,name:a.name,type:a.type,d:n>0?n/100:0,c:n<0?-n/100:0}}).filter(r=>r.d||r.c);
 if(Dc!==Cc)issues.push({level:'error',code:'tb',diff:(Dc-Cc)/100,accounts:rows.map(r=>r.name)});
 const bs=Math.round((assets-liab-equity)*100);if(bs)issues.push({level:'error',code:'bs',diff:bs/100,accounts:[...A,...Lb,...E].filter(o=>o.v).map(o=>o.name)});
 const raw={};accts.forEach(a=>{raw[a.id]=(dr[a.id]-cr[a.id])/100;const nb=normalBalance(a.type);if(a.deleted||a.system||!raw[a.id])return;
  if(nb==='debit'?raw[a.id]<0:raw[a.id]>0)issues.push({level:'warn',code:'abn',name:a.name,type:a.type,norm:nb,side:nb==='debit'?'credit':'debit',amt:Math.abs(raw[a.id]),entries:txs.filter(x=>x.date<=to&&(x.debitAccountId===a.id||x.creditAccountId===a.id)&&!validateTx(x,accts)).slice(0,6).map(x=>({id:x.id,date:x.date,desc:x.description,amount:x.amount,side:x.debitAccountId===a.id?'debit':'credit',opening:!!x.opening}))})});
 const ex=o=>o.filter(r=>r.v>0).sort((p,q)=>q.v-p.v);
 return{from,to,months,inc,exp,nw,cf,end,period,shown,assets,liab,equity,eqAcc,earnings,income:tot(Ip),expense:tot(Xp),expBy:ex(Xp),incBy:ex(Ip),expPos:tot(ex(Xp)),incPos:tot(ex(Ip)),raw,
  lists:{A,Lb,E,Ip,Xp},tb:{rows,D:Dc/100,C:Cc/100},issues,hasCash:cash.size>0,has}}
return{validateTx,compute}})();
