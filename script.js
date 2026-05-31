// Shared site script — header, nav, services, gallery loaders, contact form
let navAccountDismissBound = false;

const headerHTML = (active) => `
<header class="site-header">
  <nav class="nav container">
    <a href="/pages/home.html" class="logo">Dalot<small>BEAUTY · SPA</small></a>
    <button class="nav-toggle" aria-label="Menu">☰</button>
    <ul class="nav-links">
      <li><a href="/pages/home.html" ${active==='home'?'class="active"':''}>Home</a></li>
      <li><a href="/pages/services.html" ${active==='services'?'class="active"':''}>Services</a></li>
      <li><a href="/pages/gallery.html" ${active==='gallery'?'class="active"':''}>Gallery</a></li>
      <li><a href="/pages/about.html" ${active==='about'?'class="active"':''}>About</a></li>
      <li><a href="/pages/blog.html" ${active==='blog'?'class="active"':''}>Blog</a></li>
      <li id="nav-auth-slot" class="nav-auth-slot"></li>
      <li><a href="/pages/booking.html" class="btn btn-primary nav-book-btn">Book Now</a></li>
    </ul>
  </nav>
</header>`;

async function renderAuthSlot(){
  const slot = document.getElementById('nav-auth-slot');
  if(!slot || typeof sb === 'undefined') return;
  let user=null;
  try{ const { data } = await sb.auth.getSession(); user = data.session?.user || null; }catch(_){}
  document.body.dataset.authState = user ? 'authenticated' : 'guest';

  if(!user){
    slot.innerHTML = `
      <div class="nav-auth-guest">
        <a href="/pages/login.html" class="nav-link-auth">Sign In</a>
        <a href="/pages/signup.html" class="nav-link-auth nav-link-auth--accent">Sign Up</a>
      </div>`;
    return;
  }

  let admin=false;
  try{
    const { data: r } = await sb.from('user_roles').select('role').eq('user_id',user.id).eq('role','admin').maybeSingle();
    admin = !!r;
  }catch(_){}
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Account';
  slot.innerHTML = `
    <div class="nav-account">
      <button type="button" class="nav-account-btn">👤 ${name} ▾</button>
      <div class="nav-account-menu">
        ${admin?`<a href="/admin/index.html">⚙ Admin Dashboard</a>`:''}
        <a href="/pages/booking.html">📅 Book Appointment</a>
        <button type="button" id="nav-logout-btn">🚪 Logout</button>
      </div>
    </div>`;
  slot.querySelector('.nav-account-btn').addEventListener('click',e=>{
    e.stopPropagation();
    slot.querySelector('.nav-account').classList.toggle('open');
  });
  if(!navAccountDismissBound){
    document.addEventListener('click',()=>document.querySelector('.nav-account.open')?.classList.remove('open'));
    navAccountDismissBound = true;
  }
  slot.querySelector('#nav-logout-btn').addEventListener('click',async()=>{
    await sb.auth.signOut();
    window.location.href='/pages/home.html';
  });
}

const footerHTML = `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="logo" style="font-size:1.7rem">Dalot<small>BEAUTY · SPA</small></div>
        <p style="margin-top:14px;font-size:.9rem;color:#a89580;font-style:italic">Refresh Your Beauty,<br>Reveal Your Radiance.</p>
        <div class="footer-socials">
          <a href="https://instagram.com" target="_blank" aria-label="Instagram">📷</a>
          <a href="https://facebook.com" target="_blank" aria-label="Facebook">📘</a>
          <a href="https://wa.me/19084684268" target="_blank" aria-label="WhatsApp">💬</a>
          <a href="https://tiktok.com" target="_blank" aria-label="TikTok">🎵</a>
        </div>
      </div>
      <div>
        <h4>Explore</h4>
        <a href="/pages/home.html">Home</a>
        <a href="/pages/services.html">Services</a>
        <a href="/pages/gallery.html">Gallery</a>
        <a href="/pages/about.html">About</a>
        <a href="/pages/blog.html">Blog</a>
      </div>
      <div>
        <h4>Quick Links</h4>
        <a href="/pages/booking.html">Book Appointment</a>
        <a href="/pages/contact.html">Contact Us</a>
        <a href="/pages/faq.html">FAQ</a>
        <a href="/pages/login.html">Sign In</a>
        <a href="/pages/signup.html">Create Account</a>
      </div>
      <div>
        <h4>Visit Us</h4>
        <p>Premium Beauty Studio</p>
        <a href="tel:+19084684268">📞 +1 908-468-4268</a>
        <p>Mon–Sat · 10am – 8pm</p>
        <p>Sun · 11am – 6pm</p>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Dalot Beauty Spa · Crafted with love</span>
      <span class="footer-legal">
        <a href="/pages/privacy.html">Privacy Policy</a> ·
        <a href="/pages/terms.html">Terms</a>
      </span>
    </div>
  </div>
</footer>
<a class="wa-float" href="https://wa.me/${WHATSAPP_NUMBER}" target="_blank" aria-label="WhatsApp">💬</a>`;

function mountChrome(active){
  document.getElementById('site-header').innerHTML = headerHTML(active);
  document.getElementById('site-footer').innerHTML = footerHTML;
  const tog = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  tog?.addEventListener('click',()=>links.classList.toggle('open'));
  const hdr=document.querySelector('.site-header');
  window.addEventListener('scroll',()=>{
    if(window.scrollY>20) hdr.style.boxShadow='0 6px 30px rgba(199,124,142,.08)';
    else hdr.style.boxShadow='none';
  });
  initReveal();
  renderAuthSlot();
  if(typeof sb!=='undefined'){
    sb.auth.onAuthStateChange(()=>renderAuthSlot());
  }
}

// Scroll reveal — auto-applies to sections + .reveal targets
function initReveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)} });
  },{threshold:.12,rootMargin:'0px 0px -50px 0px'});
  document.querySelectorAll('.section, .reveal').forEach(el=>{
    if(!el.classList.contains('hero')){el.classList.add('reveal');io.observe(el)}
  });
}

function toast(msg,type='success'){
  const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=msg;
  document.body.appendChild(t);requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3000);
}

function serviceImg(s){
  if(s.image_url) return `<div class="img-wrap img-wrap--service"><img src="${s.image_url}" alt="${s.name}" loading="lazy"></div>`;
  return `<div class="img-wrap img-wrap--service"><div class="img-placeholder">${(s.name||'Dalot').slice(0,18)}</div></div>`;
}

async function loadServices(targetId, limit){
  const el = document.getElementById(targetId); if(!el) return;
  let q = sb.from('services').select('*').eq('is_active',true).order('sort_order');
  if(limit) q = q.limit(limit);
  const {data,error} = await q;
  if(error){el.innerHTML=`<p class="loading">Could not load services.</p>`;return}
  if(!data?.length){el.innerHTML=`<p class="loading">No services yet. Check back soon ✨</p>`;return}
  el.innerHTML = data.map(s=>`
    <div class="card">
      ${serviceImg(s)}
      <div class="card-body">
        ${s.category?`<span class="eyebrow">${s.category}</span>`:''}
        <h3>${s.name}</h3>
        <p class="desc">${s.description||'A signature Dalot experience.'}</p>
        <div class="meta">
          <span class="price">$${Number(s.price).toFixed(0)}</span>
          ${s.duration?`<span class="duration">⏱ ${s.duration}</span>`:''}
        </div>
        <a href="/pages/booking.html?service=${encodeURIComponent(s.name)}" class="btn btn-outline" style="margin-top:18px;width:100%;justify-content:center;padding:12px">Book this</a>
      </div>
    </div>`).join('');
}

async function loadGallery(targetId, limit){
  const el = document.getElementById(targetId); if(!el) return;
  let q = sb.from('gallery').select('*').order('sort_order',{ascending:true});
  if(limit) q = q.limit(limit);
  const {data,error}=await q;
  if(error){el.innerHTML=`<p class="loading">Could not load gallery.</p>`;return}
  if(!data?.length){el.innerHTML=`<p class="loading">Our gallery is being curated — please check back soon.</p>`;return}
  el.innerHTML = data.map(g=>`
    <div class="gallery-item"><img src="${g.image_url}" alt="${g.title||'Gallery'}" loading="lazy"></div>
  `).join('');
}

async function loadServiceOptions(selectId){
  const el = document.getElementById(selectId); if(!el) return;
  const {data} = await sb.from('services').select('name').eq('is_active',true).order('sort_order');
  if(data?.length){
    el.innerHTML = `<option value="">Choose a service…</option>` +
      data.map(s=>`<option value="${s.name}">${s.name}</option>`).join('');
    const params = new URLSearchParams(location.search);
    const pre = params.get('service'); if(pre) el.value = pre;
  }
}

async function submitBooking(form){
  const fd = new FormData(form);
  const payload = {
    customer_name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email')||null,
    service: fd.get('service'), booking_date: fd.get('date'), booking_time: fd.get('time'),
    notes: fd.get('notes')||null
  };
  const {error} = await sb.from('bookings').insert(payload);
  if(error){toast('Could not save booking. Please try again.','error');return}
  const msg = `New Appointment:\nName: ${payload.customer_name}\nService: ${payload.service}\nDate: ${payload.booking_date}\nTime: ${payload.booking_time}\nPhone: ${payload.phone}${payload.notes?`\nNotes: ${payload.notes}`:''}`;
  toast('Booking saved! Redirecting to WhatsApp…','success');
  setTimeout(()=>{window.location.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`},1000);
}

async function loadBlogs(targetId, limit){
  const el = document.getElementById(targetId); if(!el) return;
  let q = sb.from('blogs').select('*').eq('is_published',true).order('published_at',{ascending:false});
  if(limit) q = q.limit(limit);
  const {data,error} = await q;
  if(error){el.innerHTML=`<p class="loading">Could not load blog.</p>`;return}
  if(!data?.length){el.innerHTML=`<p class="loading">New beauty stories coming soon ✨</p>`;return}
  el.innerHTML = data.map(b=>`
    <a class="card blog-card" href="/pages/blog-post.html?slug=${encodeURIComponent(b.slug)}">
      ${b.featured_image
        ? `<div class="img-wrap img-wrap--blog"><img src="${b.featured_image}" alt="${b.title}" loading="lazy"></div>`
        : `<div class="img-wrap img-wrap--blog"><div class="img-placeholder">${(b.category||'Journal').toUpperCase()}</div></div>`}
      <div class="card-body">
        ${b.category?`<span class="eyebrow">${b.category}</span>`:''}
        <h3>${b.title}</h3>
        <p class="desc">${b.excerpt||(b.content||'').slice(0,120)+'…'}</p>
        <small style="color:#a89580;display:block;margin-top:14px">${b.published_at?new Date(b.published_at).toLocaleDateString():''}</small>
      </div>
    </a>`).join('');
}

async function loadBlogPost(targetId){
  const el = document.getElementById(targetId); if(!el) return;
  const slug = new URLSearchParams(location.search).get('slug');
  if(!slug){el.innerHTML='<p class="loading">Post not found.</p>';return}
  const {data,error} = await sb.from('blogs').select('*').eq('slug',slug).eq('is_published',true).maybeSingle();
  if(error||!data){el.innerHTML='<p class="loading">Post not found.</p>';return}
  document.title = `${data.title} — Dalot Beauty Spa`;
  el.innerHTML = `
    ${data.featured_image?`<div class="img-wrap img-wrap--blog" style="border-radius:20px;margin-bottom:36px;box-shadow:var(--shadow)"><img src="${data.featured_image}" alt="${data.title}"></div>`:''}
    ${data.category?`<small style="color:var(--gold);text-transform:uppercase;letter-spacing:2.5px;font-weight:600;font-size:.78rem">${data.category}</small>`:''}
    <h1 style="font-family:'Playfair Display',serif;margin:14px 0">${data.title}</h1>
    <p style="color:#a89580;margin-bottom:36px;font-size:.92rem">${data.published_at?new Date(data.published_at).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'}):''}</p>
    <div class="blog-content">${(data.content||'').split('\n').map(p=>p.trim()?`<p>${p}</p>`:'').join('')}</div>
    ${data.images?.length?`<div class="gallery-grid" style="margin-top:40px">${data.images.map(u=>`<div class="gallery-item"><img src="${u}" loading="lazy"></div>`).join('')}</div>`:''}
    ${data.links?.length?`<div style="margin-top:36px"><h3>Useful Links</h3>${data.links.map(u=>`<a href="${u}" target="_blank" rel="noopener" style="display:block;color:var(--rose-deep);margin:8px 0">→ ${u}</a>`).join('')}</div>`:''}
    <div style="margin-top:48px"><a href="/pages/blog.html" class="btn btn-outline">← Back to Blog</a></div>`;
}

async function loadFAQs(targetId){
  const el = document.getElementById(targetId); if(!el) return;
  const {data,error}=await sb.from('faqs').select('*').eq('is_active',true).order('sort_order');
  if(error){el.innerHTML='<p class="loading">Could not load FAQs.</p>';return}
  if(!data?.length){el.innerHTML='<p class="loading">FAQs coming soon.</p>';return}
  el.innerHTML = data.map(f=>`
    <div class="faq-item">
      <div class="faq-q">${f.question}<span class="plus">+</span></div>
      <div class="faq-a"><p style="padding-top:6px">${f.answer}</p></div>
    </div>`).join('');
  el.querySelectorAll('.faq-q').forEach(q=>q.addEventListener('click',()=>q.parentElement.classList.toggle('open')));
}

async function submitContact(form){
  const fd = new FormData(form);
  const {error} = await sb.from('messages').insert({
    name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone')||null,message:fd.get('message')
  });
  if(error){toast('Could not send message.','error');return}
  toast('Message sent! We will get back to you soon.','success');
  form.reset();
}
