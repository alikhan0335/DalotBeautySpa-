// Admin dashboard logic
let CURRENT_USER=null;

document.addEventListener('DOMContentLoaded', async ()=>{
  CURRENT_USER = await requireAdmin();
  if(!CURRENT_USER) return;
  document.getElementById('admin-email').textContent = CURRENT_USER.email;
  initTabs();
  initSidebar();
  loadStats(); loadBookingsAdmin(); loadServicesAdmin(); loadGalleryAdmin(); loadBlogsAdmin(); loadFAQsAdmin(); loadMessagesAdmin(); loadSettingsAdmin();
  bindForms();
});

function initSidebar(){
  const btn=document.getElementById('sidebar-toggle');
  const layout=document.getElementById('admin-layout');
  if(!btn||!layout) return;
  if(localStorage.getItem('admin_sidebar')==='collapsed') layout.classList.add('collapsed');
  btn.addEventListener('click',()=>{
    layout.classList.toggle('collapsed');
    localStorage.setItem('admin_sidebar', layout.classList.contains('collapsed')?'collapsed':'open');
  });
}

/* Blogs */
async function loadBlogsAdmin(){
  const {data}=await sb.from('blogs').select('*').order('created_at',{ascending:false});
  const tb=document.getElementById('blogs-tbody');
  tb.innerHTML=(data||[]).map(b=>`
    <tr>
      <td>${b.featured_image?`<img src="${b.featured_image}" style="width:60px;height:45px;object-fit:cover;border-radius:6px">`:'—'}</td>
      <td><strong>${b.title}</strong><br><small style="color:#888">/${b.slug}</small></td>
      <td>${b.category||'—'}</td>
      <td>${b.is_published?'✅ Live':'📝 Draft'}</td>
      <td>${new Date(b.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick='editBlog(${JSON.stringify(b).replace(/'/g,"&#39;")})'>Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBlog('${b.id}')">×</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;color:#888">No posts yet</td></tr>`;
}
window.editBlog=(b)=>{
  const f=document.getElementById('blog-form');
  f.id_field.value=b.id; f.title.value=b.title; f.slug.value=b.slug;
  f.category.value=b.category||''; f.featured_image.value=b.featured_image||'';
  f.excerpt.value=b.excerpt||''; f.content.value=b.content||'';
  f.images.value=(b.images||[]).join('\n'); f.links.value=(b.links||[]).join('\n');
  f.is_published.checked=!!b.is_published;
  window.scrollTo({top:0,behavior:'smooth'});
};
window.deleteBlog=async(id)=>{
  if(!confirm('Delete this post?'))return;
  const {error}=await sb.from('blogs').delete().eq('id',id);
  if(error)return adminToast(error.message,'error');
  adminToast('Deleted');loadBlogsAdmin();
};

/* FAQs */
async function loadFAQsAdmin(){
  const {data}=await sb.from('faqs').select('*').order('sort_order');
  const tb=document.getElementById('faqs-tbody');
  tb.innerHTML=(data||[]).map(f=>`
    <tr>
      <td><strong>${f.question}</strong><br><small style="color:#888">${f.answer.slice(0,80)}…</small></td>
      <td>${f.is_active?'✅':'❌'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick='editFAQ(${JSON.stringify(f).replace(/'/g,"&#39;")})'>Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteFAQ('${f.id}')">×</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="3" style="text-align:center;color:#888">No FAQs yet</td></tr>`;
}
window.editFAQ=(f)=>{
  const fm=document.getElementById('faq-form');
  fm.id_field.value=f.id; fm.question.value=f.question; fm.answer.value=f.answer;
  fm.sort_order.value=f.sort_order; fm.is_active.checked=f.is_active;
  window.scrollTo({top:0,behavior:'smooth'});
};
window.deleteFAQ=async(id)=>{
  if(!confirm('Delete?'))return;
  await sb.from('faqs').delete().eq('id',id);adminToast('Deleted');loadFAQsAdmin();
};

function initTabs(){
  const btns=document.querySelectorAll('[data-tab]');
  btns.forEach(b=>b.addEventListener('click',()=>{
    btns.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.tabs section').forEach(s=>s.classList.remove('active'));
    document.getElementById('tab-'+b.dataset.tab).classList.add('active');
  }));
}

function adminToast(msg,type='success'){
  const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;
  document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},2800);
}

async function loadStats(){
  const [b,s,g,m]=await Promise.all([
    sb.from('bookings').select('*',{count:'exact',head:true}),
    sb.from('services').select('*',{count:'exact',head:true}),
    sb.from('gallery').select('*',{count:'exact',head:true}),
    sb.from('messages').select('*',{count:'exact',head:true}).eq('is_read',false),
  ]);
  document.getElementById('stat-bookings').textContent=b.count||0;
  document.getElementById('stat-services').textContent=s.count||0;
  document.getElementById('stat-gallery').textContent=g.count||0;
  document.getElementById('stat-messages').textContent=m.count||0;
}

/* Bookings */
async function loadBookingsAdmin(){
  const {data}=await sb.from('bookings').select('*').order('created_at',{ascending:false});
  const tb=document.getElementById('bookings-tbody');
  tb.innerHTML=(data||[]).map(b=>`
    <tr>
      <td>${b.customer_name}<br><small style="color:#888">${b.phone}</small></td>
      <td>${b.service}</td>
      <td>${b.booking_date}<br><small>${b.booking_time}</small></td>
      <td><span class="badge ${b.status}">${b.status}</span></td>
      <td>
        <select onchange="updateBookingStatus('${b.id}',this.value)">
          <option ${b.status==='pending'?'selected':''}>pending</option>
          <option ${b.status==='confirmed'?'selected':''}>confirmed</option>
          <option ${b.status==='cancelled'?'selected':''}>cancelled</option>
        </select>
        <button class="btn btn-danger btn-sm" onclick="deleteBooking('${b.id}')">×</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="5" style="text-align:center;color:#888">No bookings yet</td></tr>`;
}
window.updateBookingStatus=async(id,status)=>{
  const {error}=await sb.from('bookings').update({status}).eq('id',id);
  if(error)return adminToast(error.message,'error');
  adminToast('Updated');loadBookingsAdmin();
};
window.deleteBooking=async(id)=>{
  if(!confirm('Delete this booking?'))return;
  const {error}=await sb.from('bookings').delete().eq('id',id);
  if(error)return adminToast(error.message,'error');
  adminToast('Deleted');loadBookingsAdmin();loadStats();
};

/* Services */
async function loadServicesAdmin(){
  const {data}=await sb.from('services').select('*').order('sort_order');
  const tb=document.getElementById('services-tbody');
  tb.innerHTML=(data||[]).map(s=>`
    <tr>
      <td>${s.image_url?`<img src="${s.image_url}" style="width:50px;height:50px;object-fit:cover;border-radius:8px">`:'—'}</td>
      <td><strong>${s.name}</strong><br><small style="color:#888">${s.category||''}</small></td>
      <td>$${Number(s.price).toFixed(0)}</td>
      <td>${s.duration||'—'}</td>
      <td>${s.is_active?'✅':'❌'}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick='editService(${JSON.stringify(s).replace(/'/g,"&#39;")})'>Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteService('${s.id}')">×</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;color:#888">No services yet</td></tr>`;
}
window.editService=(s)=>{
  const f=document.getElementById('service-form');
  f.id_field.value=s.id; f.name.value=s.name; f.description.value=s.description||'';
  f.price.value=s.price; f.duration.value=s.duration||''; f.category.value=s.category||'';
  f.image_url.value=s.image_url||''; f.sort_order.value=s.sort_order; f.is_active.checked=s.is_active;
  window.scrollTo({top:0,behavior:'smooth'});
};
window.deleteService=async(id)=>{
  if(!confirm('Delete?'))return;
  const {error}=await sb.from('services').delete().eq('id',id);
  if(error)return adminToast(error.message,'error');
  adminToast('Deleted');loadServicesAdmin();loadStats();
};

/* Gallery */
async function loadGalleryAdmin(){
  const {data}=await sb.from('gallery').select('*').order('sort_order');
  const el=document.getElementById('gallery-grid');
  el.innerHTML=(data||[]).map(g=>`
    <div class="item">
      <img src="${g.image_url}" alt="${g.title||''}">
      <button class="del" onclick="deleteGallery('${g.id}','${g.image_url}')">×</button>
    </div>`).join('') || `<p style="color:#888">No images yet.</p>`;
}
window.deleteGallery=async(id,url)=>{
  if(!confirm('Delete this image?'))return;
  const {error}=await sb.from('gallery').delete().eq('id',id);
  if(error)return adminToast(error.message,'error');
  // try remove from storage
  try{
    const path = url.split(`/${STORAGE_BUCKET}/`)[1];
    if(path) await sb.storage.from(STORAGE_BUCKET).remove([path]);
  }catch{}
  adminToast('Deleted');loadGalleryAdmin();loadStats();
};

/* Messages */
async function loadMessagesAdmin(){
  const {data}=await sb.from('messages').select('*').order('created_at',{ascending:false});
  const tb=document.getElementById('messages-tbody');
  tb.innerHTML=(data||[]).map(m=>`
    <tr style="${m.is_read?'opacity:.6':''}">
      <td><strong>${m.name}</strong><br><small>${m.email}</small>${m.phone?`<br><small>${m.phone}</small>`:''}</td>
      <td style="max-width:400px">${m.message}</td>
      <td>${new Date(m.created_at).toLocaleDateString()}</td>
      <td>
        ${!m.is_read?`<button class="btn btn-sm btn-primary" onclick="markRead('${m.id}')">Mark read</button>`:''}
        <button class="btn btn-sm btn-danger" onclick="deleteMessage('${m.id}')">×</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;color:#888">No messages yet</td></tr>`;
}
window.markRead=async(id)=>{await sb.from('messages').update({is_read:true}).eq('id',id);loadMessagesAdmin();loadStats()};
window.deleteMessage=async(id)=>{
  if(!confirm('Delete?'))return;
  await sb.from('messages').delete().eq('id',id);loadMessagesAdmin();loadStats();
};

/* Settings */
async function loadSettingsAdmin(){
  const {data}=await sb.from('site_settings').select('*');
  const map={};(data||[]).forEach(r=>map[r.key]=r.value||'');
  const f=document.getElementById('settings-form');
  f.about_text.value=map.about_text||'';
  f.phone.value=map.phone||'+1 908-468-4268';
  f.address.value=map.address||'';
  f.hours.value=map.hours||'Mon–Sat 10am–8pm';
  f.instagram.value=map.instagram||'';
}

/* Form bindings */
function bindForms(){
  // service add/edit
  document.getElementById('service-form').addEventListener('submit',async e=>{
    e.preventDefault();
    const f=e.target;
    const payload={
      name:f.name.value, description:f.description.value, price:Number(f.price.value)||0,
      duration:f.duration.value, category:f.category.value, image_url:f.image_url.value||null,
      sort_order:Number(f.sort_order.value)||0, is_active:f.is_active.checked
    };
    let res;
    if(f.id_field.value) res = await sb.from('services').update(payload).eq('id',f.id_field.value);
    else res = await sb.from('services').insert(payload);
    if(res.error)return adminToast(res.error.message,'error');
    adminToast('Saved');f.reset();f.id_field.value='';f.is_active.checked=true;
    loadServicesAdmin();loadStats();
  });

  // service image upload
  document.getElementById('service-image').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    const path=`services/${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
    const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,file);
    if(error)return adminToast(error.message,'error');
    const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    document.querySelector('#service-form [name=image_url]').value=data.publicUrl;
    adminToast('Image uploaded');
  });

  // gallery upload
  document.getElementById('gallery-upload').addEventListener('change',async e=>{
    const files=[...e.target.files];if(!files.length)return;
    for(const file of files){
      const path=`gallery/${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
      const up=await sb.storage.from(STORAGE_BUCKET).upload(path,file);
      if(up.error){adminToast(up.error.message,'error');continue}
      const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      await sb.from('gallery').insert({image_url:data.publicUrl,title:file.name});
    }
    adminToast('Uploaded');e.target.value='';loadGalleryAdmin();loadStats();
  });

  // settings save
  document.getElementById('settings-form').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.target;
    const rows=[
      {key:'about_text',value:f.about_text.value},
      {key:'phone',value:f.phone.value},
      {key:'address',value:f.address.value},
      {key:'hours',value:f.hours.value},
      {key:'instagram',value:f.instagram.value},
    ];
    const {error}=await sb.from('site_settings').upsert(rows);
    if(error)return adminToast(error.message,'error');
    adminToast('Settings saved');
  });

  // Blog form
  document.getElementById('blog-form').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.target;
    const payload={
      title:f.title.value, slug:f.slug.value.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''),
      category:f.category.value||null, featured_image:f.featured_image.value||null,
      excerpt:f.excerpt.value||null, content:f.content.value,
      images:f.images.value.split('\n').map(s=>s.trim()).filter(Boolean),
      links:f.links.value.split('\n').map(s=>s.trim()).filter(Boolean),
      is_published:f.is_published.checked,
      published_at:f.is_published.checked?new Date().toISOString():null
    };
    let res;
    if(f.id_field.value) res=await sb.from('blogs').update(payload).eq('id',f.id_field.value);
    else res=await sb.from('blogs').insert(payload);
    if(res.error)return adminToast(res.error.message,'error');
    adminToast('Saved');f.reset();f.id_field.value='';loadBlogsAdmin();
  });
  document.getElementById('blog-featured').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    const path=`blogs/${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
    const {error}=await sb.storage.from(STORAGE_BUCKET).upload(path,file);
    if(error)return adminToast(error.message,'error');
    const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    document.querySelector('#blog-form [name=featured_image]').value=data.publicUrl;
    adminToast('Featured image uploaded');
  });
  document.getElementById('blog-extra').addEventListener('change',async e=>{
    const files=[...e.target.files];if(!files.length)return;
    const urls=[];
    for(const file of files){
      const path=`blogs/${Date.now()}-${file.name.replace(/\s+/g,'_')}`;
      const up=await sb.storage.from(STORAGE_BUCKET).upload(path,file);
      if(up.error){adminToast(up.error.message,'error');continue}
      const {data}=sb.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    const ta=document.querySelector('#blog-form [name=images]');
    ta.value=(ta.value?ta.value+'\n':'')+urls.join('\n');
    adminToast(`${urls.length} image(s) uploaded`);
  });

  // FAQ form
  document.getElementById('faq-form').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.target;
    const payload={question:f.question.value,answer:f.answer.value,
      sort_order:Number(f.sort_order.value)||0,is_active:f.is_active.checked};
    let res;
    if(f.id_field.value) res=await sb.from('faqs').update(payload).eq('id',f.id_field.value);
    else res=await sb.from('faqs').insert(payload);
    if(res.error)return adminToast(res.error.message,'error');
    adminToast('Saved');f.reset();f.id_field.value='';f.is_active.checked=true;
    loadFAQsAdmin();
  });

  document.getElementById('logout-btn').addEventListener('click',doLogout);
}
