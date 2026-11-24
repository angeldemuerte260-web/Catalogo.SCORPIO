/* Panel de administración: calculadora de ventas, productos y ajustes */
const $=id=>document.getElementById(id);
const K={products:'cat_products',sales:'cat_sales',settings:'cat_settings',auth:'cat_auth'};
const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}};
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{alert('No se pudo guardar: el almacenamiento del navegador está lleno. Usa imágenes más pequeñas o borra datos que no necesites.');return false}}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const nowTime=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())};
const fmtDate=iso=>{const [y,m,d]=String(iso).split('-');return `${d}/${m}/${y}`};
/* El dinero se suma en centavos enteros para evitar errores de decimales */
const toCents=n=>Math.round(Number(n)*100);
const money=c=>'Bs. '+(c/100).toFixed(2);
const subtotal=s=>toCents(s.cost)*Number(s.qty);
const defaultProducts=[
 {id:1,name:'Pomada para cabello',price:45,category:'Cabello',description:'Fijación media con acabado natural.',img:''},
 {id:2,name:'Cera mate',price:40,category:'Cabello',description:'Textura y control sin brillo.',img:''},
 {id:3,name:'Aceite para barba',price:55,category:'Barba',description:'Hidrata y suaviza la barba.',img:''},
 {id:4,name:'Shampoo para barba',price:35,category:'Barba',description:'Limpieza diaria y suave.',img:''}
];
const bizName=()=>read(K.settings,{}).name||'Catálogo Nova';
function applySettings(){const n=bizName();$('brandName').textContent=n.toUpperCase();$('footerName').textContent=n;document.title='Administrador | '+n;$('siteName').value=read(K.settings,{}).name||'';$('tagline').value=read(K.settings,{}).tagline||''}

/* ===== Acceso: la contraseña se crea la primera vez (no hay una contraseña fija en el código) ===== */
async function hashes(pw){
 const text='cat:'+pw;let h=5381;for(const ch of text)h=((h<<5)+h+ch.charCodeAt(0))>>>0;
 let sha=null;
 if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));sha=[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
 return {s:sha,d:String(h)};
}
async function checkPassword(pw){
 const a=read(K.auth,null);if(!a)return false;const h=await hashes(pw);
 return (a.s&&h.s)?a.s===h.s:a.d===h.d;
}
function enter(){$('loginBox').classList.add('hidden');$('adminContent').classList.remove('hidden');try{sessionStorage.setItem('cat_session','1')}catch{}loadAll()}
function setupLogin(){
 const first=!read(K.auth,null);
 $('confirmWrap').classList.toggle('hidden',!first);$('adminPass2').required=first;
 $('loginBtn').textContent=first?'Crear contraseña y entrar':'Ingresar';
 $('loginHint').textContent=first?'Es tu primera vez: crea una contraseña de administrador (mínimo 4 caracteres). Se guarda solo en este navegador.':'';
}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const pw=$('adminPass').value;
 if(!read(K.auth,null)){
  if(pw.length<4){alert('La contraseña debe tener al menos 4 caracteres.');return}
  if(pw!==$('adminPass2').value){alert('Las contraseñas no coinciden.');return}
  if(!save(K.auth,await hashes(pw)))return;
  $('adminPass').value=$('adminPass2').value='';enter();return;
 }
 if(!await checkPassword(pw)){alert('Contraseña incorrecta');return}
 $('adminPass').value='';enter();
});
$('logout').addEventListener('click',()=>{try{sessionStorage.removeItem('cat_session')}catch{}$('adminContent').classList.add('hidden');$('loginBox').classList.remove('hidden');setupLogin()});
$('passForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!await checkPassword($('curPass').value)){alert('La contraseña actual es incorrecta.');return}
 const n=$('newPass').value;if(n.length<4){alert('La nueva contraseña debe tener al menos 4 caracteres.');return}
 if(save(K.auth,await hashes(n))){alert('Contraseña cambiada.');e.target.reset()}
});

/* ===== Pestañas ===== */
const TABS=[...document.querySelectorAll('[data-tabbtn]')].map(b=>b.dataset.tabbtn);
function showTab(n){
 if(!TABS.includes(n))n='ventas';
 document.querySelectorAll('.tab-pane').forEach(p=>p.classList.toggle('hidden',p.dataset.tab!==n));
 document.querySelectorAll('[data-tabbtn]').forEach(b=>b.classList.toggle('active',b.dataset.tabbtn===n));
 try{sessionStorage.setItem('cat_tab',n)}catch{}
}
document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tabbtn]');if(b)showTab(b.dataset.tabbtn)});

/* ===== Calculadora de ventas ===== */
let costAuto=false;
const products=()=>read(K.products,defaultProducts);
function fillProductLists(){
 $('productList').innerHTML=products().map(p=>`<option value="${esc(p.name)}">Bs. ${Number(p.price).toFixed(2)}</option>`).join('');
 $('categoryList').innerHTML=[...new Set(products().map(p=>p.category).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('');
}
function updatePreview(){
 const c=Number($('saleCost').value),q=Number($('saleQty').value);
 $('salePreview').textContent=(c>=0&&q>=1&&$('saleCost').value!=='')?`Subtotal de esta venta: ${money(toCents(c)*q)}`:'';
}
function resetSaleForm(){
 $('saleForm').reset();$('editSaleId').value='';$('saleDate').value=todayStr();$('saleTime').value=nowTime();$('saleQty').value=1;
 $('saleSubmit').textContent='Agregar venta';$('cancelSale').classList.add('hidden');costAuto=false;updatePreview();
}
$('saleProduct').addEventListener('input',()=>{
 const p=products().find(x=>x.name.toLowerCase()===$('saleProduct').value.trim().toLowerCase());
 if(p&&($('saleCost').value===''||costAuto)){$('saleCost').value=Number(p.price).toFixed(2);costAuto=true;updatePreview()}
});
$('saleCost').addEventListener('input',()=>{costAuto=false;updatePreview()});
$('saleQty').addEventListener('input',updatePreview);
$('nowBtn').addEventListener('click',()=>{$('saleDate').value=todayStr();$('saleTime').value=nowTime()});
$('cancelSale').addEventListener('click',resetSaleForm);
$('saleForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('saleProduct').value.trim(),cost=Number($('saleCost').value),qty=Number($('saleQty').value),id=$('editSaleId').value;
 if(!name){alert('Escribe el nombre del producto.');return}
 if(!(cost>=0)||$('saleCost').value===''){alert('Escribe un costo válido.');return}
 if(!Number.isInteger(qty)||qty<1){alert('La cantidad debe ser un número entero mayor a 0.');return}
 const sale={id:id?Number(id):Date.now()*1000+Math.floor(Math.random()*1000),product:name,date:$('saleDate').value,time:$('saleTime').value,cost:Math.round(cost*100)/100,qty};
 const list=read(K.sales,[]),i=list.findIndex(x=>String(x.id)===id);
 if(i>=0)list[i]=sale;else list.push(sale);
 if(!save(K.sales,list))return;
 resetSaleForm();renderSales();
});
function filteredSales(){
 const f=$('fromDate').value,t=$('toDate').value,q=$('saleSearch').value.trim().toLowerCase();
 return read(K.sales,[]).filter(s=>(!f||s.date>=f)&&(!t||s.date<=t)&&(!q||s.product.toLowerCase().includes(q)))
  .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)||a.id-b.id);
}
const filtersActive=()=>!!($('fromDate').value||$('toDate').value||$('saleSearch').value.trim());
function renderSales(){
 const rows=filteredSales(),total=rows.reduce((t,s)=>t+subtotal(s),0),units=rows.reduce((t,s)=>t+Number(s.qty),0);
 $('salesBody').innerHTML=rows.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.product)}</td><td>${fmtDate(s.date)}</td><td>${esc(s.time)}</td><td>${s.qty}</td><td>${money(toCents(s.cost))}</td><td><b>${money(subtotal(s))}</b></td><td class="row-actions"><button class="small-btn" data-editsale="${s.id}">Editar</button><button class="danger" data-delsale="${s.id}">Eliminar</button></td></tr>`).join('')||'<tr><td colspan="8" class="muted">No hay ventas registradas.</td></tr>';
 $('totalAmount').textContent=money(total);$('footTotal').textContent=money(total);
 $('totalCount').textContent=rows.length;$('totalUnits').textContent=units;
 $('totalLabel').textContent=filtersActive()?'Total vendido (según filtros)':'Total vendido';
}
$('salesBody').addEventListener('click',e=>{
 const ed=e.target.closest('[data-editsale]'),del=e.target.closest('[data-delsale]');
 if(ed){const s=read(K.sales,[]).find(x=>String(x.id)===ed.dataset.editsale);if(!s)return;
  $('editSaleId').value=s.id;$('saleProduct').value=s.product;$('saleDate').value=s.date;$('saleTime').value=s.time;$('saleCost').value=Number(s.cost).toFixed(2);$('saleQty').value=s.qty;
  $('saleSubmit').textContent='Guardar cambios';$('cancelSale').classList.remove('hidden');costAuto=false;updatePreview();$('saleForm').scrollIntoView({behavior:'smooth'})}
 if(del&&confirm('¿Eliminar esta venta?')){save(K.sales,read(K.sales,[]).filter(x=>String(x.id)!==del.dataset.delsale));renderSales()}
});
['fromDate','toDate'].forEach(id=>$(id).addEventListener('change',renderSales));$('saleSearch').addEventListener('input',renderSales);
$('clearFilters').addEventListener('click',()=>{$('fromDate').value=$('toDate').value=$('saleSearch').value='';renderSales()});
$('clearAll').addEventListener('click',()=>{if(read(K.sales,[]).length&&confirm('¿Borrar TODAS las ventas registradas? Esta acción no se puede deshacer.')){save(K.sales,[]);renderSales()}});

/* ===== Reporte en JPG ===== */
function downloadJpg(){
 const rows=filteredSales();
 if(!rows.length){alert('No hay ventas para imprimir.');return}
 if(rows.length>700){alert('Hay demasiadas ventas para una sola imagen. Filtra por fechas para generar el reporte.');return}
 const W=1200,ROW=46,TOP=271,H=TOP+rows.length*ROW+190;
 const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 const name=bizName(),total=rows.reduce((t,s)=>t+subtotal(s),0),units=rows.reduce((t,s)=>t+Number(s.qty),0);
 const fit=(t,max)=>{if(g.measureText(t).width<=max)return t;while(t.length>1&&g.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…'};
 g.fillStyle='#ffffff';g.fillRect(0,0,W,H);
 g.fillStyle='#111111';g.fillRect(0,0,W,120);
 g.textBaseline='alphabetic';g.textAlign='left';
 g.fillStyle='#e5b64c';g.font='bold 40px Arial';g.fillText(fit(name.toUpperCase(),W-100),50,62);
 g.fillStyle='#ffffff';g.font='22px Arial';g.fillText('REPORTE DE VENTAS',50,98);
 const f=$('fromDate').value,t=$('toDate').value,q=$('saleSearch').value.trim();
 let period=f&&t?`${fmtDate(f)} al ${fmtDate(t)}`:f?`Desde ${fmtDate(f)}`:t?`Hasta ${fmtDate(t)}`:'Todas las fechas';
 if(q)period+=` · Producto: “${q}”`;
 g.fillStyle='#111111';g.font='bold 24px Arial';g.fillText(fit('Período: '+period,W-100),50,168);
 const now=new Date();
 g.fillStyle='#555555';g.font='20px Arial';g.fillText(`Generado: ${fmtDate(todayStr())} ${nowTime()} · ${rows.length} venta(s) · ${units} unidad(es)`,50,203);
 g.fillStyle='#e5b64c';g.fillRect(50,225,W-100,46);
 g.fillStyle='#111111';g.font='bold 19px Arial';
 const cols={n:60,p:110,d:600,h:735,q:870,c:1000,s:1136};
 g.textAlign='left';g.fillText('#',cols.n,256);g.fillText('PRODUCTO',cols.p,256);g.fillText('FECHA',cols.d,256);g.fillText('HORA',cols.h,256);
 g.textAlign='right';g.fillText('CANT.',cols.q,256);g.fillText('COSTO',cols.c,256);g.fillText('SUBTOTAL',cols.s,256);
 rows.forEach((s,i)=>{
  const y=TOP+i*ROW;
  if(i%2){g.fillStyle='#f7f3e8';g.fillRect(50,y,W-100,ROW)}
  g.fillStyle='#e3e3e3';g.fillRect(50,y+ROW-1,W-100,1);
  g.fillStyle='#111111';g.font='19px Arial';
  g.textAlign='left';g.fillText(String(i+1),cols.n,y+30);g.fillText(fit(s.product,470),cols.p,y+30);g.fillText(fmtDate(s.date),cols.d,y+30);g.fillText(s.time,cols.h,y+30);
  g.textAlign='right';g.fillText(String(s.qty),cols.q,y+30);g.fillText(money(toCents(s.cost)),cols.c,y+30);
  g.font='bold 19px Arial';g.fillText(money(subtotal(s)),cols.s,y+30);
 });
 const yEnd=TOP+rows.length*ROW;
 g.fillStyle='#e5b64c';g.fillRect(50,yEnd,W-100,3);
 g.fillStyle='#111111';g.fillRect(660,yEnd+25,W-710,90);
 g.fillStyle='#e5b64c';g.textAlign='left';g.font='bold 24px Arial';g.fillText('TOTAL VENDIDO',685,yEnd+78);
 g.textAlign='right';g.font='bold 38px Arial';g.fillText(money(total),1130,yEnd+80);
 g.fillStyle='#777777';g.textAlign='left';g.font='16px Arial';g.fillText(`Documento generado por ${name}`,50,yEnd+150);
 c.toBlob(b=>{
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`ventas-${todayStr()}.jpg`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
 },'image/jpeg',.92);
}
$('jpgBtn').addEventListener('click',downloadJpg);

/* ===== Productos ===== */
function compress(file,max=800){
 return new Promise((res,rej)=>{
  if(!file){res(null);return}
  if(!file.type.startsWith('image/')||file.size>6*1024*1024){rej(Error('Selecciona una imagen de máximo 6 MB.'));return}
  const rd=new FileReader();
  rd.onload=e=>{const im=new Image();im.onload=()=>{const sc=Math.min(1,max/im.width,max/im.height),c=document.createElement('canvas');c.width=Math.round(im.width*sc);c.height=Math.round(im.height*sc);c.getContext('2d').drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.78))};im.onerror=()=>rej(Error('No se pudo leer la imagen.'));im.src=e.target.result};
  rd.onerror=()=>rej(Error('No se pudo leer el archivo.'));rd.readAsDataURL(file);
 });
}
function resetProduct(){$('productForm').reset();$('editProductId').value='';$('removeImgWrap').classList.add('hidden')}
function renderProducts(){
 const list=products();
 $('adminProducts').innerHTML=list.map(p=>`<div class="record">${p.img?`<img class="product-thumb" src="${esc(p.img)}" alt="">`:''}<h3>${esc(p.name)} · Bs. ${Number(p.price).toFixed(2)}</h3><p class="muted">${esc(p.category||'Sin categoría')}${p.description?' · '+esc(p.description):''}</p><button class="small-btn" data-editprod="${p.id}">Editar</button><button class="danger" data-delprod="${p.id}">Eliminar</button><div style="clear:both"></div></div>`).join('')||'<p>No hay productos.</p>';
 fillProductLists();
}
$('productForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const id=$('editProductId').value,list=products().slice(),old=list.find(x=>String(x.id)===id);
 let img=old?old.img||'':'';
 try{const n=await compress($('productImage').files[0]);if(n)img=n}catch(err){alert(err.message);return}
 if($('removeImg').checked&&!$('productImage').files[0])img='';
 const price=Number($('productPrice').value);if(!(price>=0)){alert('Escribe un precio válido.');return}
 const item={id:old?old.id:Date.now(),name:$('productName').value.trim(),price:Math.round(price*100)/100,category:$('productCategory').value.trim(),description:$('productDescription').value.trim(),img};
 if(old)list[list.indexOf(old)]=item;else list.push(item);
 if(!save(K.products,list))return;
 resetProduct();renderProducts();
});
$('cancelProduct').addEventListener('click',resetProduct);
$('adminProducts').addEventListener('click',e=>{
 const ed=e.target.closest('[data-editprod]'),del=e.target.closest('[data-delprod]');
 if(ed){const p=products().find(x=>String(x.id)===ed.dataset.editprod);if(!p)return;
  $('editProductId').value=p.id;$('productName').value=p.name;$('productPrice').value=p.price;$('productCategory').value=p.category||'';$('productDescription').value=p.description||'';
  $('removeImgWrap').classList.toggle('hidden',!p.img);$('removeImg').checked=false;$('productForm').scrollIntoView({behavior:'smooth'})}
 if(del&&confirm('¿Eliminar este producto del catálogo? Las ventas ya registradas no se borran.')){save(K.products,products().filter(x=>String(x.id)!==del.dataset.delprod));renderProducts()}
});

/* ===== Ajustes ===== */
$('settingsForm').addEventListener('submit',e=>{
 e.preventDefault();
 if(save(K.settings,{name:$('siteName').value.trim(),tagline:$('tagline').value.trim()})){applySettings();alert('Ajustes guardados.')}
});

function loadAll(){
 applySettings();fillProductLists();renderProducts();resetSaleForm();renderSales();
 let t='ventas';try{t=sessionStorage.getItem('cat_tab')||t}catch{}showTab(t);
}
applySettings();setupLogin();
try{if(sessionStorage.getItem('cat_session')==='1'&&read(K.auth,null))enter()}catch{}
