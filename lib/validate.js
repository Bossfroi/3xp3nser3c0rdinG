export function validate(d){const ids=new Set(),seen=new Set();let D=0,C=0;
for(const a of d.accounts){if(!a||typeof a.id!=='string'||!a.name||!['Asset','Liability','Equity','Income','Expense'].includes(a.type))return'Invalid account.';if(ids.has(a.id))return'Duplicate account id.';if(a.openingBalance)return'Opening balances must be journal entries.';ids.add(a.id)}
for(const x of d.transactions){if(!x||typeof x.id!=='string'||seen.has(x.id))return'Invalid or duplicate entry id.';seen.add(x.id);
 if(!Number.isFinite(x.amount)||x.amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(x.date||''))return'Entry has an invalid amount or date.';
 if(!ids.has(x.debitAccountId)||!ids.has(x.creditAccountId)||x.debitAccountId===x.creditAccountId)return'Each entry needs two different existing accounts.';
 D+=Math.round(x.amount*100);C+=Math.round(x.amount*100)}
return D===C?null:'Total debits must equal total credits.'}
