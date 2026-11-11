(async () => {
  const $ = s => document.querySelector(s);
  const HASH = 'b6e279afb9334ac564d288caf9bf139a1b894c018b90a3d2f62e1d0934d41ab4';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sha = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2200); };

  /* giriş */
  const enter = () => { $('#login').hidden = true; $('#app').hidden = false; boot(); };
  $('#lf').onsubmit = async e => {
    e.preventDefault();
    if (await sha($('#pw').value) === HASH) { sessionStorage.setItem('ates_admin', '1'); enter(); }
    else $('#lerr').textContent = 'Şifre hatalı.';
  };
  $('#out').onclick = () => { sessionStorage.removeItem('ates_admin'); location.reload(); };

  let M, view = 'panel', catId = null, editId = null;
  const uid = () => 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const allItems = () => M.categories.flatMap(c => c.items);
  const findItem = id => { for (const c of M.categories) { const i = c.items.find(x => x.id === id); if (i) return [c, i]; } return []; };

  function save(msg) {
    try { localStorage.setItem(KEY, JSON.stringify(M)); const s = $('#saved'); s.classList.add('on'); clearTimeout(save.t); save.t = setTimeout(() => s.classList.remove('on'), 1500); if (msg) toast(msg); }
    catch (e) { toast('Depolama dolu. Bazı görselleri küçültün veya silin.'); }
  }

  async function boot() {
    M = await loadMenu(); catId = M.categories[0]?.id;
    $('#nav').onclick = e => { const b = e.target.closest('button'); if (!b) return; view = b.dataset.v; editId = null; document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b)); render(); };
    render();
  }

  /* görsel küçültme */
  function shrink(file, max = 720) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onerror = rej;
      r.onload = () => {
        const im = new Image();
        im.onerror = rej;
        im.onload = () => {
          const k = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', .82));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  async function pickImage(itemId, cb) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = async () => {
      if (!inp.files[0]) return;
      try { const d = await shrink(inp.files[0]); const [, it] = findItem(itemId); it.image = d; save('Görsel yüklendi'); cb && cb(); }
      catch (e) { toast('Görsel okunamadı.'); }
    };
    inp.click();
  }

  const V = $('#view');
  function render() {
    ({ panel, urunler, gorseller, kategoriler, ayarlar, yayin }[view])();
  }

  /* PANEL */
  function panel() {
    const its = allItems();
    const avg = its.length ? Math.round(its.reduce((s, i) => s + i.price, 0) / its.length) : 0;
    const imgs = its.filter(i => i.image).length;
    V.innerHTML = `
      <h2 class="t">Hoş geldiniz</h2><p class="sub">Menünüzün genel durumu.</p>
      <div class="stats">
        <div class="stat"><b>${its.length}</b><span>Ürün</span></div>
        <div class="stat"><b>${M.categories.length}</b><span>Kategori</span></div>
        <div class="stat"><b>${TL(avg)}</b><span>Ortalama fiyat</span></div>
        <div class="stat"><b>${imgs}</b><span>Görselli ürün</span></div>
      </div>
      <div class="box"><h3>Hızlı işlemler</h3>
        <div class="tagrow"><button class="btn gold sm" data-go="urunler">Ürün ekle veya düzenle</button><button class="btn ghost sm" data-go="gorseller">Görsel yükle</button><button class="btn ghost sm" data-go="yayin">Yayınla</button></div></div>
      <div class="box"><h3>Eksikler</h3>
        <p class="sub" style="margin:0">${its.filter(i => !i.image).length} ürünün görseli yok. Görseller menüde yalnızca yüklendiğinde görünür.</p></div>`;
    V.querySelectorAll('[data-go]').forEach(b => b.onclick = () => document.querySelector(`#nav [data-v=${b.dataset.go}]`).click());
  }

  /* ÜRÜNLER */
  function urunler() {
    if (editId) return editor();
    const c = M.categories.find(x => x.id === catId) || M.categories[0];
    V.innerHTML = `
      <h2 class="t">Ürünler</h2><p class="sub">Fiyat, kalori ve alerjenleri buradan düzenleyin.</p>
      <div class="catbar">${M.categories.map(x => `<button data-c="${x.id}" class="${x.id === c.id ? 'on' : ''}">${esc(x.name)} (${x.items.length})</button>`).join('')}</div>
      <button class="btn gold sm" id="add" style="margin-bottom:12px">+ Yeni ürün</button>
      ${c.items.map((i, n) => `
        <div class="arow">
          ${i.image ? `<img class="th" src="${i.image}" alt="">` : '<div class="th">🍢</div>'}
          <div class="nm"><b>${esc(i.name)}</b><span>${TL(i.price)} · ${i.kcal} kcal · ${(i.allergens || []).length} alerjen</span></div>
          <button class="mini" data-up="${i.id}" ${n === 0 ? 'disabled' : ''}>↑</button>
          <button class="mini" data-dn="${i.id}" ${n === c.items.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn ghost sm" data-ed="${i.id}" style="height:36px">Düzenle</button>
        </div>`).join('') || '<p class="sub">Bu kategoride ürün yok.</p>'}`;
    V.querySelectorAll('.catbar button').forEach(b => b.onclick = () => { catId = b.dataset.c; urunler(); });
    $('#add').onclick = () => {
      const it = { id: uid(), name: 'Yeni ürün', desc: '', kcal: 0, price: 0, allergens: [], tags: [], spice: 0, image: '' };
      c.items.unshift(it); save(); editId = it.id; urunler();
    };
    V.querySelectorAll('[data-ed]').forEach(b => b.onclick = () => { editId = b.dataset.ed; urunler(); });
    const mv = (id, d) => { const k = c.items.findIndex(x => x.id === id); const j = k + d; if (j < 0 || j >= c.items.length) return; [c.items[k], c.items[j]] = [c.items[j], c.items[k]]; save(); urunler(); };
    V.querySelectorAll('[data-up]').forEach(b => b.onclick = () => mv(b.dataset.up, -1));
    V.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => mv(b.dataset.dn, 1));
  }

  function editor() {
    const [cat, it] = findItem(editId);
    if (!it) { editId = null; return urunler(); }
    V.innerHTML = `
      <button class="ghost sm" id="back" style="margin-bottom:12px">← Listeye dön</button>
      <h2 class="t">${esc(it.name)}</h2>
      <div class="box">
        <div class="f"><div><label>Ürün adı</label><input id="e_name" value="${esc(it.name)}"></div>
          <div><label>Açıklama</label><textarea id="e_desc">${esc(it.desc)}</textarea></div></div>
        <div class="g3 f">
          <div><label>Fiyat (₺)</label><input id="e_price" type="number" min="0" value="${it.price}"></div>
          <div><label>Kalori (kcal)</label><input id="e_kcal" type="number" min="0" value="${it.kcal}"></div>
          <div><label>Kategori</label><select id="e_cat">${M.categories.map(c => `<option value="${c.id}" ${c.id === cat.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        </div>
        <div class="f"><div><label>Acı derecesi</label>
          <select id="e_spice">${['Acısız', 'Hafif acı', 'Orta acı', 'Çok acı'].map((t, k) => `<option value="${k}" ${it.spice === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
        <label style="font-size:12px;font-weight:700;color:var(--gold1);letter-spacing:.6px;text-transform:uppercase">Etiketler</label>
        <div class="tagrow" style="margin:6px 0 16px" id="e_tags">
          ${[['imza', 'İmza'], ['sefin', 'Şefin seçimi'], ['yeni', 'Yeni']].map(([k, t]) => `<button class="chip ${(it.tags || []).includes(k) ? 'on' : ''}" data-t="${k}">${t}</button>`).join('')}
        </div>
        <label style="font-size:12px;font-weight:700;color:var(--gold1);letter-spacing:.6px;text-transform:uppercase">Alerjenler</label>
        <div class="chips a3" style="margin-top:6px" id="e_al">
          ${ALLERGENS.map(a => `<button class="chip ${(it.allergens || []).includes(a.id) ? 'on' : ''}" data-a="${a.id}"><span class="al" style="background:${a.c}">${a.e}</span>${a.tr}</button>`).join('')}
        </div>
      </div>
      <div class="box"><h3>Ürün görseli</h3>
        <div class="uploader">
          <div class="preview" id="pv">${it.image ? `<img src="${it.image}" alt="">` : 'Görsel yok'}</div>
          <div style="display:grid;gap:8px">
            <button class="btn gold sm" id="up">Görsel yükle</button>
            <button class="btn red sm" id="rm" ${it.image ? '' : 'disabled'}>Görseli kaldır</button>
            <small style="color:var(--muted)">Otomatik olarak küçültülür (en fazla 720 piksel).</small>
          </div></div></div>
      <button class="btn red sm" id="del">Ürünü sil</button>`;
    $('#back').onclick = () => { editId = null; urunler(); };
    const bind = (id, f) => $(id).addEventListener('input', e => { f(e.target.value); save(); });
    bind('#e_name', v => it.name = v); bind('#e_desc', v => it.desc = v);
    bind('#e_price', v => it.price = +v || 0); bind('#e_kcal', v => it.kcal = +v || 0);
    $('#e_spice').onchange = e => { it.spice = +e.target.value; save(); };
    $('#e_cat').onchange = e => {
      const to = M.categories.find(c => c.id === e.target.value);
      cat.items = cat.items.filter(x => x.id !== it.id); to.items.unshift(it); catId = to.id; save('Kategori değişti'); editor();
    };
    $('#e_tags').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; const t = b.dataset.t; it.tags = it.tags || []; it.tags = it.tags.includes(t) ? it.tags.filter(x => x !== t) : [...it.tags, t]; b.classList.toggle('on'); save(); };
    $('#e_al').onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; it.allergens = it.allergens || []; it.allergens = it.allergens.includes(a) ? it.allergens.filter(x => x !== a) : [...it.allergens, a]; b.classList.toggle('on'); save(); };
    $('#up').onclick = () => pickImage(it.id, editor);
    $('#rm').onclick = () => { it.image = ''; save('Görsel kaldırıldı'); editor(); };
    $('#del').onclick = () => { if (confirm('Bu ürün silinsin mi?')) { cat.items = cat.items.filter(x => x.id !== it.id); save('Ürün silindi'); editId = null; urunler(); } };
  }

  /* GÖRSELLER */
  function gorseller() {
    V.innerHTML = `
      <h2 class="t">Görseller</h2><p class="sub">Bir ürüne tıklayarak görsel yükleyin. Görseller menüde ürün kartında görünür.</p>
      <div class="box"><div class="tagrow"><label style="display:flex;align-items:center;gap:10px;font-size:14px"><span class="sw ${M.showImages !== false ? 'on' : ''}" id="swImg"></span> Menüde görselleri göster</label></div></div>
      ${M.categories.map(c => `<h3 style="font-family:var(--serif);margin:18px 0 10px">${esc(c.name)}</h3>
        <div class="gal">${c.items.map(i => `
          <div class="gi"><div class="im" data-u="${i.id}">${i.image ? `<img src="${i.image}" alt="">` : '+ Görsel ekle'}</div>
          <div class="gn">${esc(i.name)}</div>
          <div class="gx"><span>${i.image ? 'Yüklendi' : 'Yok'}</span>${i.image ? `<button data-r="${i.id}">Kaldır</button>` : ''}</div></div>`).join('')}</div>`).join('')}`;
    $('#swImg').onclick = () => { M.showImages = M.showImages === false; save(); gorseller(); };
    V.querySelectorAll('[data-u]').forEach(el => el.onclick = () => pickImage(el.dataset.u, gorseller));
    V.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { findItem(b.dataset.r)[1].image = ''; save('Görsel kaldırıldı'); gorseller(); });
  }

  /* KATEGORİLER */
  function kategoriler() {
    V.innerHTML = `<h2 class="t">Kategoriler</h2><p class="sub">Ad ve alt başlığı düzenleyin, sırayı değiştirin.</p>
      <button class="btn gold sm" id="addc" style="margin-bottom:12px">+ Yeni kategori</button>
      ${M.categories.map((c, n) => `
        <div class="box"><div class="g2 f"><div><label>Kategori adı</label><input data-n="${c.id}" value="${esc(c.name)}"></div>
          <div><label>Alt başlık</label><input data-s="${c.id}" value="${esc(c.sub || '')}"></div></div>
          <div class="tagrow"><button class="mini" data-up="${c.id}" ${n === 0 ? 'disabled' : ''}>↑</button><button class="mini" data-dn="${c.id}" ${n === M.categories.length - 1 ? 'disabled' : ''}>↓</button>
          <span class="sub" style="margin:0;align-self:center">${c.items.length} ürün</span>
          <button class="btn red sm" data-del="${c.id}" style="margin-left:auto">Sil</button></div></div>`).join('')}`;
    V.querySelectorAll('[data-n]').forEach(i => i.oninput = () => { M.categories.find(c => c.id === i.dataset.n).name = i.value; save(); });
    V.querySelectorAll('[data-s]').forEach(i => i.oninput = () => { M.categories.find(c => c.id === i.dataset.s).sub = i.value; save(); });
    const mv = (id, d) => { const k = M.categories.findIndex(c => c.id === id), j = k + d; if (j < 0 || j >= M.categories.length) return; [M.categories[k], M.categories[j]] = [M.categories[j], M.categories[k]]; save(); kategoriler(); };
    V.querySelectorAll('[data-up]').forEach(b => b.onclick = () => mv(b.dataset.up, -1));
    V.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => mv(b.dataset.dn, 1));
    V.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { const c = M.categories.find(x => x.id === b.dataset.del); if (confirm(`"${c.name}" ve içindeki ${c.items.length} ürün silinsin mi?`)) { M.categories = M.categories.filter(x => x !== c); save('Kategori silindi'); kategoriler(); } });
    $('#addc').onclick = () => { M.categories.push({ id: 'k' + Date.now().toString(36), name: 'Yeni kategori', sub: '', items: [] }); save(); kategoriler(); };
  }

  /* AYARLAR */
  function ayarlar() {
    V.innerHTML = `<h2 class="t">Ayarlar</h2><p class="sub">Menünün üst ve alt metinleri.</p>
      <div class="box f">
        <div><label>Uyarı kutusu (boş bırakırsanız gizlenir)</label><input id="s_notice" value="${esc(M.notice || '')}"></div>
        <div><label>Alt bilgi cümlesi</label><input id="s_footer" value="${esc(M.footer || '')}"></div>
        <div><label>Alerji notu</label><textarea id="s_an">${esc(M.allergyNote || '')}</textarea></div>
        <div><label>Sloganlar (her satıra bir slogan)</label><textarea id="s_sl" style="height:130px">${esc((M.slogans || []).join('\n'))}</textarea></div>
      </div>`;
    $('#s_notice').oninput = e => { M.notice = e.target.value; save(); };
    $('#s_footer').oninput = e => { M.footer = e.target.value; save(); };
    $('#s_an').oninput = e => { M.allergyNote = e.target.value; save(); };
    $('#s_sl').oninput = e => { M.slogans = e.target.value.split('\n').map(s => s.trim()).filter(Boolean); save(); };
  }

  /* YAYIN */
  function yayin() {
    const kb = Math.round(JSON.stringify(M).length / 1024);
    V.innerHTML = `<h2 class="t">Yayın</h2><p class="sub">Değişiklikleriniz bu cihazda otomatik kaydedilir (${kb} KB).</p>
      <div class="help"><b>Canlı menüye almak için:</b> aşağıdan menu.json dosyasını indirin ve GitHub deposundaki menu.json ile değiştirin. Vercel birkaç saniye içinde menüyü günceller.</div>
      <div class="box"><h3>Menü dosyası</h3><div class="tagrow">
        <button class="btn gold sm" id="exp">menu.json indir</button>
        <label class="btn ghost sm" style="display:inline-grid;place-items:center;cursor:pointer">menu.json içe aktar<input id="imp" type="file" accept=".json" hidden></label>
        <button class="btn red sm" id="reset">Yayındaki menüye sıfırla</button></div></div>
      <div class="box"><h3>QR kodlar</h3><div class="qrs">
        <a href="/qr/ates-qr.svg" target="_blank"><img src="/qr/ates-qr.svg" alt="Ateş QR"><span>Ateş QR</span></a>
        <a href="/qr/altin-qr.svg" target="_blank"><img src="/qr/altin-qr.svg" alt="Altın QR"><span>Altın QR</span></a></div></div>`;
    $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(M, null, 1)], { type: 'application/json' })); a.download = 'menu.json'; a.click(); toast('menu.json indirildi'); };
    $('#imp').onchange = async e => { try { const j = JSON.parse(await e.target.files[0].text()); if (!j.categories) throw 0; M = j; save('İçe aktarıldı'); yayin(); } catch (x) { toast('Geçersiz dosya.'); } };
    $('#reset').onclick = async () => { if (confirm('Bu cihazdaki tüm değişiklikler silinsin mi?')) { localStorage.removeItem(KEY); M = await baseMenu(); toast('Sıfırlandı'); yayin(); } };
  }

  if (sessionStorage.getItem('ates_admin') === '1') enter();
})();
