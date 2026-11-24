/* Catálogo público: lee los productos y ajustes que guarda el administrador */
const $=id=>document.getElementById(id);
const K={products:'cat_products',settings:'cat_settings',sales:'cat_sales',cart:'cat_cart'};
const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch{return d}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultProducts=[
 {id:1,name:'Pomada para cabello',price:45,category:'Cabello',description:'Fijación media con acabado natural.',img:''},
 {id:2,name:'Cera mate',price:40,category:'Cabello',description:'Textura y control sin brillo.',img:''},
 {id:3,name:'Aceite para barba',price:55,category:'Barba',description:'Hidrata y suaviza la barba.',img:''},
 {id:4,name:'Shampoo para barba',price:35,category:'Barba',description:'Limpieza diaria y suave.',img:''}
];
function applySettings(){
 const s=read(K.settings,{}),name=s.name||'Catálogo Nova';
 $('brandName').textContent=name.toUpperCase();$('heroTitle').textContent=name.toUpperCase();$('footerName').textContent=name;document.title=name;
 if(s.tagline)$('hero').querySelector('.hero-copy').textContent=s.tagline;
}
function render(){
 const all=read(K.products,defaultProducts),q=$('search').value.trim().toLowerCase(),cat=$('categoryFilter').value;
 const cats=[...new Set(all.map(p=>p.category).filter(Boolean))].sort();
 $('categoryFilter').innerHTML='<option value="">Todas las categorías</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
 $('categoryFilter').value=cats.includes(cat)?cat:'';
 const list=all.filter(p=>(!$('categoryFilter').value||p.category===$('categoryFilter').value)&&(!q||[p.name,p.description,p.category].some(v=>String(v||'').toLowerCase().includes(q))));
 $('catalog').innerHTML=list.map(p=>`<article class="service-card">${p.img?`<img src="${esc(p.img)}" alt="${esc(p.name)}">`:'<div class="service-no-image">Fotografía pendiente</div>'}<div class="card-body">${p.category?`<span class="tag">${esc(p.category)}</span>`:''}<h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><p class="price">Bs. ${Number(p.price).toFixed(2)}</p><button type="button" class="gold-btn add-cart-btn" data-addcart="${p.id}">Agregar al carrito</button></div></article>`).join('')||'<p class="notice">No se encontraron productos.</p>';
}
function cartRead(){return read(K.cart,[])}
function cartSave(items){try{localStorage.setItem(K.cart,JSON.stringify(items));return true}catch{alert('No se pudo guardar el carrito.');return false}}
const cash=n=>'Bs. '+Number(n).toFixed(2);
function renderCart(){
 const items=cartRead(),count=items.reduce((n,x)=>n+x.qty,0),total=items.reduce((n,x)=>n+x.price*x.qty,0);
 $('cartCount').textContent=count+' producto(s)';$('cartTotal').textContent=cash(total);$('checkoutBtn').disabled=!items.length;
 $('cartItems').innerHTML=items.length?items.map(x=>`<div class="cart-row"><div class="cart-product"><strong>${esc(x.name)}</strong><small>${cash(x.price)} por unidad</small></div><div class="cart-quantity"><button type="button" data-cartminus="${x.id}" aria-label="Disminuir">−</button><b>${x.qty}</b><button type="button" data-cartplus="${x.id}" aria-label="Aumentar">+</button></div><strong class="cart-subtotal">${cash(x.price*x.qty)}</strong><button type="button" class="cart-remove" data-cartremove="${x.id}">Quitar</button></div>`).join(''):'<p class="muted">Tu carrito está vacío. Agrega productos del catálogo.</p>';
}
$('catalog').addEventListener('click',e=>{const b=e.target.closest('[data-addcart]');if(!b)return;const p=read(K.products,defaultProducts).find(x=>String(x.id)===b.dataset.addcart);if(!p)return;const items=cartRead(),found=items.find(x=>String(x.id)===String(p.id));if(found)found.qty++;else items.push({id:p.id,name:p.name,price:Number(p.price),qty:1});if(cartSave(items))renderCart()});
$('cartItems').addEventListener('click',e=>{const plus=e.target.closest('[data-cartplus]'),minus=e.target.closest('[data-cartminus]'),remove=e.target.closest('[data-cartremove]');let items=cartRead();if(plus){const x=items.find(i=>String(i.id)===plus.dataset.cartplus);if(x)x.qty++}if(minus){const x=items.find(i=>String(i.id)===minus.dataset.cartminus);if(x)x.qty--;items=items.filter(x=>x.qty>0)}if(remove)items=items.filter(i=>String(i.id)!==remove.dataset.cartremove);if(cartSave(items))renderCart()});
function fmtNow(){const d=new Date(),p=n=>String(n).padStart(2,'0');return {date:d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()),time:p(d.getHours())+':'+p(d.getMinutes())}}
function downloadReceipt(items,customer,date,time){
 const W=1275,H=1650,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 const total=items.reduce((n,x)=>n+x.price*x.qty,0),name=(read(K.settings,{}).name||'Catálogo Nova');
 g.fillStyle='#fff';g.fillRect(0,0,W,H);g.strokeStyle='#b88a2b';g.lineWidth=5;g.strokeRect(45,45,W-90,H-90);
 g.fillStyle='#111';g.fillRect(46,46,W-92,250);g.textAlign='center';g.fillStyle='#e8bd57';g.font='bold 58px Arial';g.fillText(name.toUpperCase(),W/2,145);g.fillStyle='#fff';g.font='bold 34px Arial';g.fillText('COMPROBANTE DE VENTA',W/2,215);
 g.textAlign='left';g.fillStyle='#222';g.font='27px Arial';g.fillText('Fecha: '+date.split('-').reverse().join('/'),100,365);g.fillText('Hora: '+time,750,365);g.fillText('Cliente: '+(customer||'No especificado').slice(0,45),100,425);
 const y0=500,rowH=Math.min(76,Math.max(34,Math.floor(700/Math.max(1,items.length))));g.fillStyle='#e8bd57';g.fillRect(90,y0,W-180,62);g.fillStyle='#111';g.font='bold 24px Arial';g.fillText('PRODUCTO',115,y0+40);g.textAlign='right';g.fillText('CANT.',790,y0+40);g.fillText('PRECIO',990,y0+40);g.fillText('SUBTOTAL',1150,y0+40);
 let y=y0+62;g.textAlign='left';items.forEach((x,i)=>{if(i%2===0){g.fillStyle='#f7f4ed';g.fillRect(90,y,W-180,rowH)}g.fillStyle='#222';g.font=(rowH<50?'18px':'23px')+' Arial';let nm=x.name;while(g.measureText(nm).width>510&&nm.length>4)nm=nm.slice(0,-2)+'…';g.fillText(nm,115,y+46);g.textAlign='right';g.fillText(String(x.qty),790,y+46);g.fillText(cash(x.price),990,y+46);g.font='bold 23px Arial';g.fillText(cash(x.price*x.qty),1150,y+46);g.textAlign='left';g.fillStyle='#ddd';g.fillRect(90,y+rowH-1,W-180,1);y+=rowH});
 const totalY=Math.min(H-390,Math.max(y+55,Math.min(1270,y+75)));g.fillStyle='#111';g.fillRect(650,totalY,W-740,115);g.fillStyle='#e8bd57';g.font='bold 31px Arial';g.textAlign='left';g.fillText('TOTAL PAGADO',680,totalY+70);g.textAlign='right';g.font='bold 42px Arial';g.fillText(cash(total),1135,totalY+72);
 g.textAlign='center';g.fillStyle='#555';g.font='24px Arial';g.fillText('Gracias por su compra',W/2,H-190);g.font='18px Arial';g.fillText('Documento generado por '+name,W/2,H-145);g.fillText('Formato de impresión: carta (8.5 × 11 pulgadas)',W/2,H-105);
 c.toBlob(blob=>{if(!blob){alert('No se pudo generar el comprobante.');return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='comprobante-'+date+'-'+time.replace(':','')+'.jpg';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)},'image/jpeg',.94);
}
$('checkoutForm').addEventListener('submit',e=>{e.preventDefault();const items=cartRead();if(!items.length)return;const {date,time}=fmtNow(),sales=read(K.sales,[]),stamp=Date.now();items.forEach((x,i)=>sales.push({id:stamp*100+i,product:x.name,date,time,cost:x.price,qty:x.qty,customer:$('customerName').value.trim(),source:'carrito'}));try{localStorage.setItem(K.sales,JSON.stringify(sales));localStorage.removeItem(K.cart)}catch{alert('No se pudo registrar la venta. Libera espacio en el navegador e intenta otra vez.');return}downloadReceipt(items,$('customerName').value.trim(),date,time);$('customerName').value='';renderCart();alert('Venta registrada. El comprobante JPG se está descargando. Puedes consultar la venta en Administración.');});
$('search').addEventListener('input',render);$('categoryFilter').addEventListener('change',render);
applySettings();render();renderCart();
