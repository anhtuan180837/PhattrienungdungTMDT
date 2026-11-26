import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = new URL('./', import.meta.url);
mkdirSync(new URL('data/', root), { recursive: true });
const db = new DatabaseSync(fileURLToPath(new URL('data/thu_chi.sqlite', root)));
db.exec(readFileSync(new URL('schema.sql', root), 'utf8'));
const categories = ['Lương & thưởng','Thu nhập khác','Ăn uống','Di chuyển','Học tập','Mua sắm','Sinh hoạt','Khác'];
const localDate = new Intl.DateTimeFormat('sv-SE', { timeZone:'Asia/Ho_Chi_Minh' }).format(new Date());
if (!db.prepare("SELECT value FROM app_settings WHERE key='seeded'").get()) {
 const now = new Date().toISOString();
 const records = [
  ['Lương làm thêm','income','Lương & thưởng',3500000,1,'completed','Thu nhập trong tháng'],
  ['Mua giáo trình','expense','Học tập',250000,2,'completed','Tài liệu học tập'],
  ['Ăn trưa cùng bạn','expense','Ăn uống',95000,4,'completed',''],
  ['Chi phí đi lại','expense','Di chuyển',180000,6,'completed',''],
  ['Mua đồ dùng cá nhân','expense','Mua sắm',320000,8,'completed',''],
  ['Tiền điện tháng này','expense','Sinh hoạt',400000,20,'planned','Dự kiến thanh toán'],
  ['Thu nhập từ dự án','income','Thu nhập khác',1200000,22,'planned','Dự kiến nhận']
 ];
 const insert = db.prepare('INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?,?,?)');
 db.exec('BEGIN IMMEDIATE');
 try {
  if (!db.prepare("SELECT value FROM app_settings WHERE key='seeded'").get()) {
   for (const [title,kind,category,amount,day,status,note] of records) {
    const date = localDate.slice(0,8) + String(day).padStart(2,'0');
    insert.run(randomUUID(),title,kind,category,amount,date,status,note,now,now);
   }
   db.prepare("INSERT INTO app_settings VALUES ('seeded','1')").run();
  }
  db.exec('COMMIT');
 } catch(e) { db.exec('ROLLBACK'); throw e; }
}
function validate(d) {
 if (!d || typeof d.title !== 'string' || !d.title.trim() || d.title.trim().length > 120) return 'Tên giao dịch cần từ 1 đến 120 ký tự.';
 if (!['income','expense'].includes(d.kind)) return 'Loại giao dịch không hợp lệ.';
 if (!categories.includes(d.category)) return 'Danh mục không hợp lệ.';
 if (d.kind === 'income' && !['Lương & thưởng','Thu nhập khác','Khác'].includes(d.category)) return 'Danh mục chưa phù hợp với khoản thu.';
 if (d.kind === 'expense' && ['Lương & thưởng','Thu nhập khác'].includes(d.category)) return 'Danh mục chưa phù hợp với khoản chi.';
 if (!Number.isSafeInteger(d.amount) || d.amount < 1 || d.amount > 1000000000000) return 'Số tiền phải là số nguyên từ 1 đến 1.000 tỷ đồng.';
 if (!['planned','completed'].includes(d.status)) return 'Trạng thái không hợp lệ.';
 if (typeof d.note !== 'string' || d.note.length > 500) return 'Ghi chú tối đa 500 ký tự.';
 if (typeof d.transaction_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.transaction_date)) return 'Ngày giao dịch không hợp lệ.';
 const date = new Date(d.transaction_date+'T12:00:00Z');
 if (!Number.isFinite(+date) || date.toISOString().slice(0,10) !== d.transaction_date) return 'Ngày giao dịch không hợp lệ.';
}
const assets = {'/':['index.html','text/html'],'/style.css':['style.css','text/css'],'/app.js':['app.js','text/javascript']};
const json = (res, status, value) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); };
const port = Number(process.env.PORT || 3020);
http.createServer(async (req,res) => {
 try {
  const url = new URL(req.url, 'http://'+req.headers.host);
  const match = /^\/api\/transactions(?:\/([\w-]+))?$/.exec(url.pathname);
  if (!match) {
   const file = Object.hasOwn(assets,url.pathname) && assets[url.pathname];
   if (!file) { res.writeHead(404); res.end('404'); return; }
   res.writeHead(200,{'Content-Type':file[1]+'; charset=utf-8'});
   res.end(readFileSync(new URL('public/'+file[0],root))); return;
  }
  const id = match[1];
  if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== url.origin) return json(res,403,{error:'Yêu cầu không hợp lệ.'});
  if (!id && req.method === 'GET') return json(res,200,db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC, id DESC').all());
  if (id && !db.prepare('SELECT id FROM transactions WHERE id=?').get(id)) return json(res,404,{error:'Giao dịch không còn tồn tại.'});
  if (id && req.method === 'DELETE') { db.prepare('DELETE FROM transactions WHERE id=?').run(id); return json(res,200,{id}); }
  if (!(id ? ['PUT','PATCH'] : ['POST']).includes(req.method)) return json(res,405,{error:'Phương thức không hợp lệ.'});
  if (!req.headers['content-type']?.includes('application/json')) return json(res,415,{error:'Dữ liệu không hợp lệ.'});
  let body='';
  for await (const chunk of req) { body += chunk; if (body.length > 10000) return json(res,413,{error:'Dữ liệu quá lớn.'}); }
  let d; try { d=JSON.parse(body); } catch { return json(res,400,{error:'Dữ liệu không hợp lệ.'}); }
  const now=new Date().toISOString();
  if (req.method === 'PATCH') {
   if (!['planned','completed'].includes(d?.status)) return json(res,400,{error:'Trạng thái không hợp lệ.'});
   db.prepare('UPDATE transactions SET status=?,updated_at=? WHERE id=?').run(d.status,now,id);
   return json(res,200,{id});
  }
  const error=validate(d); if(error) return json(res,400,{error});
  const values=[d.title.trim(),d.kind,d.category,d.amount,d.transaction_date,d.status,d.note.trim()];
  if (id) { db.prepare('UPDATE transactions SET title=?,kind=?,category=?,amount=?,transaction_date=?,status=?,note=?,updated_at=? WHERE id=?').run(...values,now,id); return json(res,200,{id}); }
  const key=randomUUID();
  db.prepare('INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?,?,?)').run(key,...values,now,now);
  return json(res,201,{id:key});
 } catch (error) { console.error(error); if (!res.headersSent) json(res,500,{error:'Không thể xử lý yêu cầu. Vui lòng thử lại.'}); else res.end(); }
}).listen(port,'127.0.0.1',()=>console.log('Sổ thu chi: http://127.0.0.1:'+port));

