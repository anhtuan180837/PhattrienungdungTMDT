'use strict';
const $=s=>document.querySelector(s);
const categories={income:['Lương & thưởng','Thu nhập khác','Khác'],expense:['Ăn uống','Di chuyển','Học tập','Mua sắm','Sinh hoạt','Khác']};
const money=n=>new Intl.NumberFormat('vi-VN').format(n)+' ₫';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const current=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
$('#today').textContent=new Intl.DateTimeFormat('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date());
$('#month').value=current.slice(0,7);
let transactions=[],editing=null,deleting=null,view='list',busy=false;
async function request(path='',method='GET',data){
 const res=await fetch('/api/transactions'+path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});
 const body=await res.json();if(!res.ok)throw new Error(body.error||'Không thể thực hiện yêu cầu.');return body;
}
function notify(text){$('#toast').textContent=text;clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#toast').textContent='',2600);}
async function refresh(){
 try{transactions=await request();$('#error').hidden=true;render();}
 catch(e){$('#error').hidden=false;$('#error').textContent='Không thể tải dữ liệu. Vui lòng tải lại trang.';}
}
function render(){
 const query=$('#search').value.trim().toLocaleLowerCase('vi');
 const month=$('#month').value, kind=$('#kind').value, status=$('#status').value;
 const items=transactions.filter(t=>(!month||t.transaction_date.startsWith(month))&&(!kind||t.kind===kind)&&(!status||t.status===status)&&(!query||(t.title+' '+t.note).toLocaleLowerCase('vi').includes(query)));
 const completed=items.filter(t=>t.status==='completed');
 const income=completed.filter(t=>t.kind==='income').reduce((s,t)=>s+t.amount,0);
 const expense=completed.filter(t=>t.kind==='expense').reduce((s,t)=>s+t.amount,0);
 $('#income').textContent=money(income);$('#expense').textContent=money(expense);$('#balance').textContent=money(income-expense);
 $('#count').textContent=items.length+' giao dịch';
 $('#rows').innerHTML=items.map(t=>'<tr data-id="'+esc(t.id)+'"><td><div class="transaction"><div class="tx-icon '+esc(t.kind)+'">'+(t.kind==='income'?'↙':'↗')+'</div><div><div class="tx-title">'+esc(t.title)+'</div><div class="tx-note">'+esc(t.note|| (t.kind==='income'?'Khoản thu':'Khoản chi'))+'</div></div></div></td><td>'+t.transaction_date.split('-').reverse().join('/')+'</td><td><span class="category">'+esc(t.category)+'</span></td><td><select class="status '+esc(t.status)+'" aria-label="Trạng thái '+esc(t.title)+'"><option value="planned" '+(t.status==='planned'?'selected':'')+'>Dự kiến</option><option value="completed" '+(t.status==='completed'?'selected':'')+'>Đã thực hiện</option></select></td><td class="money amount-'+esc(t.kind)+'">'+(t.kind==='income'?'+ ':'− ')+money(t.amount)+'</td><td class="row-actions"><button class="icon-button" data-action="edit" aria-label="Sửa '+esc(t.title)+'" title="Sửa">✎</button><button class="icon-button" data-action="delete" aria-label="Xóa '+esc(t.title)+'" title="Xóa">✕</button></td></tr>').join('');
 $('#empty').hidden=items.length>0;
 const sums=new Map();
 for(const t of completed){const key=t.kind+'|'+t.category;const v=sums.get(key)||{kind:t.kind,category:t.category,count:0,total:0};v.count++;v.total+=t.amount;sums.set(key,v);}
 $('#statsRows').innerHTML=[...sums.values()].sort((a,b)=>b.total-a.total).map(x=>'<tr><td><span class="category">'+esc(x.category)+'</span></td><td>'+(x.kind==='income'?'Khoản thu':'Khoản chi')+'</td><td>'+x.count+'</td><td class="money amount-'+x.kind+'">'+money(x.total)+'</td></tr>').join('');
 $('#statsEmpty').hidden=sums.size>0;
 $('#listPanel').hidden=view!=='list';$('#statsPanel').hidden=view!=='stats';
 $('#navAll').classList.toggle('active',view==='list');$('#navStats').classList.toggle('active',view==='stats');
 $('#pageTitle').textContent=view==='list'?'Tổng quan thu chi':'Thống kê thu chi';$('#crumb').textContent=view==='list'?'Tổng quan':'Thống kê';$('#sectionTitle').textContent=view==='list'?'Các khoản thu chi':'Chi tiết thống kê';
}
function setCategories(selected){const select=$('#form').elements.category;const opts=categories[$('#form').elements.kind.value];select.innerHTML=opts.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');if(opts.includes(selected))select.value=selected;}
function editor(item){
 const f=$('#form');f.reset();editing=item?.id||null;
 f.elements.kind.value=item?.kind||'expense';setCategories(item?.category);
 for(const key of ['title','amount','transaction_date','status','note']) f.elements[key].value=item?.[key]??({transaction_date:current,status:'completed'}[key]||'');
 $('#formTitle').textContent=item?'Sửa giao dịch':'Thêm giao dịch';$('#editor .form-error').textContent='';$('#editor').showModal();f.elements.title.focus();
}
async function mutate(action,dialog,message){
 if(busy)return;busy=true;const target=dialog||$('#listPanel');target.inert=true;
 try{await action();if(dialog)dialog.close();await refresh();notify(message);}
 catch(e){if(dialog)dialog.querySelector('.form-error').textContent=e.message;else{notify(e.message);await refresh();}}
 finally{target.inert=false;busy=false;}
}
$('#add').onclick=()=>editor();$('#navAll').onclick=()=>{view='list';render()};$('#navStats').onclick=()=>{view='stats';render()};
for(const id of ['search','month','kind','status'])$('#'+id).addEventListener('input',render);
$('#clear').onclick=()=>{for(const id of ['search','month','kind','status'])$('#'+id).value='';render()};
$('#form').elements.kind.onchange=()=>setCategories();
$('#form').onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));d.amount=Number(d.amount);if(!d.title.trim()){$('#editor .form-error').textContent='Vui lòng nhập tên giao dịch.';return;}mutate(()=>request(editing?'/'+editing:'',editing?'PUT':'POST',d),$('#editor'),'Đã lưu giao dịch.');};
$('#rows').onclick=e=>{const b=e.target.closest('[data-action]');if(!b)return;const item=transactions.find(t=>t.id===b.closest('tr').dataset.id);if(b.dataset.action==='edit')editor(item);else{deleting=item.id;$('#deleteText').textContent='Bạn muốn xóa “'+item.title+'”?';$('#confirm .form-error').textContent='';$('#confirm').showModal();}};
$('#rows').onchange=e=>{if(!e.target.matches('.status'))return;const id=e.target.closest('tr').dataset.id;mutate(()=>request('/'+id,'PATCH',{status:e.target.value}),null,'Đã cập nhật trạng thái.');};
$('#deleteYes').onclick=()=>mutate(()=>request('/'+deleting,'DELETE'),$('#confirm'),'Đã xóa giao dịch.');
document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
render();refresh();
