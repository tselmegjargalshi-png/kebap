(async () => {
  const $ = s => document.querySelector(s);
  const M = await loadMenu();
  const st = {
    q: '',
    avoid: new Set(JSON.parse(localStorage.getItem('ates_avoid') || '[]')),
    hide: localStorage.getItem('ates_hide') === '1'
  };
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* sloganlar */
  const sl = M.slogans && M.slogans.length ? M.slogans : [''];
  let si = 0; const slEl = $('#slogan');
  slEl.textContent = sl[0];
  if (sl.length > 1 && !reduce) setInterval(() => {
    slEl.classList.add('fade');
    setTimeout(() => { si = (si + 1) % sl.length; slEl.textContent = sl[si]; slEl.classList.remove('fade'); }, 500);
  }, 4200);
  $('#notice').textContent = M.notice || '';
  if (!M.notice) $('#notice').remove();
  $('#allergyNote').textContent = M.allergyNote || '';
  $('#fs').textContent = M.footer || '';

  /* kart */
  const alIcons = ids => ids.map(id => AL[id] ? `<span class="al" style="background:${AL[id].c}" title="${AL[id].tr}">${AL[id].e}</span>` : '').join('');
  const spice = n => n ? `<span class="spice" title="Acı">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>` : '';
  const badges = it => (it.tags || []).map(t => t === 'imza' ? '<span class="badge">İmza</span>' : t === 'sefin' ? '<span class="badge">Şefin seçimi</span>' : t === 'yeni' ? '<span class="badge new">Yeni</span>' : '').join('');
  const card = it => `
    <article class="item" data-id="${it.id}" data-al="${(it.allergens || []).join(',')}" data-s="${esc((it.name + ' ' + it.desc).toLocaleLowerCase('tr'))}">
      <div class="info">
        <h3>${esc(it.name)}${badges(it)}</h3>
        <p>${esc(it.desc)}</p>
        <div class="meta">
          <span class="kcal">${FLAME}${it.kcal} kcal</span>
          <span class="als">${alIcons(it.allergens || [])}</span>
          ${spice(it.spice)}
          <span class="price">${TL(it.price)}</span>
        </div>
        <div class="names">${(it.allergens || []).length ? 'İçerir: ' + it.allergens.map(a => AL[a]?.tr).join(', ') : 'Bilinen alerjen içermez.'}</div>
      </div>
      ${M.showImages !== false && it.image ? `<img class="timg" loading="lazy" src="${it.image}" alt="${esc(it.name)}">` : ''}
    </article>`;

  /* menü */
  $('#tabs').innerHTML = M.categories.map((c, i) => `<button class="tab ${i ? '' : 'on'}" data-c="${c.id}">${esc(c.name)}</button>`).join('');
  $('#menu').innerHTML = M.categories.map(c => `
    <section class="cat" id="c_${c.id}" data-c="${c.id}">
      <div class="sec-title"><h2>${esc(c.name)}</h2></div>
      <p class="sec-sub">${esc(c.sub || '')}</p><hr class="rule">
      ${c.items.map(card).join('')}
    </section>`).join('') + '<div class="empty" id="none" hidden>Aradığınız ürün bulunamadı.</div>';

  /* ustanın seçimi */
  const feats = M.categories.flatMap(c => c.items).filter(i => (i.tags || []).includes('imza'));
  if (feats.length) $('#featWrap').innerHTML = `
    <div class="sec-title"><h2>Ustanın Ateşi</h2></div>
    <p class="sec-sub">İmzamızı taşıyan lezzetler</p><hr class="rule">
    <div class="feat">${feats.map(i => `<div class="fcard">${M.showImages !== false && i.image ? `<img class="fimg" src="${i.image}" alt="">` : ''}<h4>${esc(i.name)}</h4><p>${esc(i.desc)}</p><div class="pr">${TL(i.price)}</div></div>`).join('')}</div>`;

  /* alerjen listesi */
  $('#lg').innerHTML = ALLERGENS.map(a => `<div><span class="al" style="background:${a.c}">${a.e}</span>${a.tr}</div>`).join('');

  /* filtre mantığı */
  function apply() {
    let shown = 0;
    document.querySelectorAll('.item').forEach(el => {
      const al = el.dataset.al ? el.dataset.al.split(',') : [];
      const bad = al.some(a => st.avoid.has(a));
      const match = !st.q || el.dataset.s.includes(st.q);
      el.classList.toggle('warn', bad);
      el.classList.toggle('hidden', !match || (bad && st.hide));
      if (!el.classList.contains('hidden')) shown++;
    });
    document.querySelectorAll('.cat').forEach(c => { c.hidden = !c.querySelector('.item:not(.hidden)'); });
    $('#none').hidden = shown > 0;
    const d = $('#fDot'); d.style.display = st.avoid.size ? 'grid' : 'none'; d.textContent = st.avoid.size;
  }
  $('#q').addEventListener('input', e => { st.q = e.target.value.trim().toLocaleLowerCase('tr'); apply(); });
  $('#bSearch').onclick = () => { $('#sRow').classList.toggle('show'); if ($('#sRow').classList.contains('show')) $('#q').focus(); };
  document.addEventListener('click', e => { const it = e.target.closest('.item'); if (it) it.classList.toggle('open'); });

  /* alerji çekmecesi */
  const drawChips = () => {
    $('#chips').innerHTML = ALLERGENS.map(a => `<button class="chip ${st.avoid.has(a.id) ? 'on' : ''}" data-a="${a.id}"><span class="al" style="background:${a.c}">${a.e}</span>${a.tr}</button>`).join('');
    $('#swHide').classList.toggle('on', st.hide);
  };
  const save = () => { localStorage.setItem('ates_avoid', JSON.stringify([...st.avoid])); localStorage.setItem('ates_hide', st.hide ? '1' : '0'); };
  $('#bFilter').onclick = () => { drawChips(); $('#sheet').classList.add('show'); };
  const closeSheet = () => $('#sheet').classList.remove('show');
  $('#sheetBg').onclick = closeSheet; $('#done').onclick = closeSheet;
  $('#clr').onclick = () => { st.avoid.clear(); save(); drawChips(); apply(); };
  $('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const id = b.dataset.a; st.avoid.has(id) ? st.avoid.delete(id) : st.avoid.add(id);
    save(); drawChips(); apply();
  });
  $('#swHide').onclick = () => { st.hide = !st.hide; save(); drawChips(); apply(); };
  apply();

  /* sekmeler + scrollspy */
  const tabs = [...document.querySelectorAll('.tab')];
  tabs.forEach(t => t.onclick = () => { document.getElementById('c_' + t.dataset.c).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
  const io = new IntersectionObserver(es => {
    es.forEach(en => {
      if (en.isIntersecting) {
        tabs.forEach(t => t.classList.toggle('on', t.dataset.c === en.target.dataset.c));
        const on = $('.tab.on'); on && on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }
    });
  }, { rootMargin: '-140px 0px -65% 0px' });
  document.querySelectorAll('.cat').forEach(c => io.observe(c));

  /* kıvılcımlar: dokununca */
  const sc = $('#sparks'), sx = sc.getContext('2d'); let sp = [];
  const fit = () => { sc.width = innerWidth; sc.height = innerHeight; }; fit(); addEventListener('resize', fit);
  addEventListener('pointerdown', e => {
    if (reduce) return;
    for (let i = 0; i < 16; i++) {
      const a = Math.random() * Math.PI * 2, v = 1.5 + Math.random() * 3.5;
      sp.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, l: 1, c: Math.random() > .5 ? '255,140,40' : '255,60,20' });
    }
    if (sp.length === 16) loopS();
  });
  function loopS() {
    sx.clearRect(0, 0, sc.width, sc.height);
    sp = sp.filter(p => p.l > 0);
    sp.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .12; p.l -= .025; sx.fillStyle = `rgba(${p.c},${p.l})`; sx.beginPath(); sx.arc(p.x, p.y, 2.2 * p.l + .4, 0, 7); sx.fill(); });
    if (sp.length) requestAnimationFrame(loopS); else sx.clearRect(0, 0, sc.width, sc.height);
  }

  /* kıvılcımlar: kahramanda yükselen közler */
  if (!reduce) {
    const ec = $('#embers'), ex = ec.getContext('2d'); let W, H, es = [], vis = true;
    const rs = () => { W = ec.width = ec.offsetWidth; H = ec.height = ec.offsetHeight; }; rs(); addEventListener('resize', rs);
    new IntersectionObserver(a => vis = a[0].isIntersecting).observe(ec);
    const mk = () => ({ x: Math.random() * W, y: H + 10, r: .6 + Math.random() * 2, vy: .4 + Math.random() * 1.1, dx: (Math.random() - .5) * .6, ph: Math.random() * 6, a: .4 + Math.random() * .6 });
    for (let i = 0; i < 40; i++) { const p = mk(); p.y = Math.random() * H; es.push(p); }
    (function tick(t) {
      if (vis) {
        ex.clearRect(0, 0, W, H);
        es.forEach((p, i) => {
          p.y -= p.vy; p.x += p.dx + Math.sin(t / 700 + p.ph) * .4; p.a -= .0022;
          if (p.y < -10 || p.a <= 0) es[i] = mk();
          ex.fillStyle = `rgba(255,${100 + p.r * 30 | 0},30,${Math.max(p.a, 0)})`; ex.shadowColor = '#ff5a1f'; ex.shadowBlur = 8;
          ex.beginPath(); ex.arc(p.x, p.y, p.r, 0, 7); ex.fill();
        });
      }
      requestAnimationFrame(tick);
    })(0);
  }
})();
