// =====================================================
// SUPABASE CONFIG
// =====================================================
const SB_URL = 'https://pfojqmkybywawhsifxqu.supabase.co/rest/v1';
const SB_KEY = 'sb_publishable_WxlXA3hqFDPpWh5297D4Fw_HBu7xjfG';
const SB_HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SB_KEY,
  'Authorization': `Bearer ${SB_KEY}`
};

// Cache local dos registros
let confirmados = [];

// Formata data ISO para dd/mm/aaaa
function fmtData(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

// Converte row do Supabase para formato interno
function fromDB(row) {
  return {
    id:         row.id,
    nome:       row.nome,
    whats:      row.whats,
    email:      row.email || '',
    acomp:      row.acomp,
    acompDados: row.acomp_dados || [],
    comidas:    row.comidas    || [],
    rifa:       row.rifa       || false,
    rifaNumero: row.rifa_numero || null,
    sinuca:     row.sinuca     || false,
    data:       fmtData(row.data_confirmacao)
  };
}

// =====================================================
// BANDEIRINHAS SVG GERADAS
// =====================================================
(function() {
  const cores = ['#C0392B','#F1C40F','#2980B9','#27AE60','#E67E22','#8B5E3C','#ffffff'];
  const svg = document.querySelector('.bandeirinhas svg');
  const largura = 1200; const espacamento = 60; const total = Math.ceil(largura / espacamento) + 1;
  for (let i = 0; i < total; i++) {
    const x = i * espacamento; const cor = cores[i % cores.length];
    const py = 8 + Math.sin(i * 0.9) * 8;
    const flag = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    flag.setAttribute('points', `${x-10},${py} ${x+10},${py} ${x},${py+22}`);
    flag.setAttribute('fill', cor);
    flag.setAttribute('opacity', '0.9');
    svg.appendChild(flag);
  }
})();

// =====================================================
// NAVEGAÇÃO
// =====================================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // fecha menu mobile
  const menu = document.getElementById('navMenu');
  if (menu.classList.contains('show')) {
    new bootstrap.Collapse(menu).hide();
  }
  if (id === 'lista')  renderLista();
  if (id === 'rifa')   renderRifa();
  if (id === 'sinuca') renderSinuca();
}

// =====================================================
// COUNTDOWN
// =====================================================
const eventDate = new Date('2025-06-28T16:00:00');
function updateCountdown() {
  const now = new Date(); const diff = eventDate - now;
  if (diff <= 0) { document.getElementById('countdown').innerHTML = '<div class="hero-badge" style="font-size:1.2rem">🎉 O arraiá chegou!</div>'; return; }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('cd-days').textContent  = String(d).padStart(2,'0');
  document.getElementById('cd-hours').textContent = String(h).padStart(2,'0');
  document.getElementById('cd-min').textContent   = String(m).padStart(2,'0');
  document.getElementById('cd-sec').textContent   = String(s).padStart(2,'0');
}
updateCountdown(); setInterval(updateCountdown, 1000);

// =====================================================
// FORMULÁRIO DE CONFIRMAÇÃO
// =====================================================
function gerarAcompanhantes() {
  const qtd = parseInt(document.getElementById('qtd-acomp').value);
  const c = document.getElementById('acompanhantes-container');
  c.innerHTML = '';
  for (let i = 1; i <= qtd; i++) {
    c.innerHTML += `
      <div class="acompanhante-group">
        <h6><i class="bi bi-person me-1"></i>Acompanhante ${i}</h6>
        <div class="row g-2">
          <div class="col-md-8">
            <label class="form-label">Nome</label>
            <input type="text" class="form-control acomp-nome" data-idx="${i}" placeholder="Nome do acompanhante" oninput="updatePreview()" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Idade</label>
            <input type="number" class="form-control acomp-idade" data-idx="${i}" placeholder="Ex: 25" min="0" max="110" oninput="updatePreview()" />
          </div>
        </div>
      </div>`;
  }
  updatePreview();
}

function updatePreview() {
  const nome = document.getElementById('resp-nome').value.trim();
  const whats = document.getElementById('resp-whats').value.trim();
  const box = document.getElementById('preview-box');
  const cont = document.getElementById('preview-content');
  if (!nome && !whats) { box.style.display = 'none'; return; }

  const qtd = parseInt(document.getElementById('qtd-acomp').value) || 0;
  const nomes  = [...document.querySelectorAll('.acomp-nome')].map(i => i.value||'—');
  const idades = [...document.querySelectorAll('.acomp-idade')].map(i => i.value||'—');

  // comidas selecionadas
  const comidasSel = [...document.querySelectorAll('#comidas-form-grid input[type=checkbox]:checked')]
    .map(c => c.value);

  // rifa
  const rifaSim = document.getElementById('rifa-sim')?.classList.contains('active');
  // sinuca
  const sinucaSim = document.getElementById('sinuca-sim')?.classList.contains('active');

  let html = `<p class="mb-1"><strong>Responsável:</strong> ${nome || '—'}</p>`;
  html += `<p class="mb-1"><strong>WhatsApp:</strong> ${whats || '—'}</p>`;
  html += `<p class="mb-1"><strong>Acompanhantes:</strong> ${qtd}</p>`;
  if (qtd > 0) {
    html += `<ul class="mb-1 mt-1">`;
    for (let i = 0; i < qtd; i++) html += `<li>${nomes[i]} · ${idades[i]} anos</li>`;
    html += `</ul>`;
  }
  if (comidasSel.length > 0) {
    html += `<p class="mb-1"><strong>🌽 Vai trazer:</strong> ${comidasSel.join(', ')}</p>`;
  }
  html += `<p class="mb-1"><strong>🎟️ Rifa:</strong> ${rifaSim ? `Sim — Número ${rifaNumSelecionado ? String(rifaNumSelecionado).padStart(3,'0') : 'não escolhido ainda'}` : 'Não'}</p>`;
  html += `<p class="mb-0"><strong>🎱 Sinuca:</strong> ${sinucaSim ? 'Sim, vai jogar!' : 'Não'}</p>`;

  cont.innerHTML = html;
  box.style.display = 'block';
}

async function confirmarPresenca() {
  const nome = document.getElementById('resp-nome').value.trim();
  const whats = document.getElementById('resp-whats').value.trim();
  if (!nome || !whats) { alert('Por favor, informe seu nome e WhatsApp!'); return; }

  const qtd = parseInt(document.getElementById('qtd-acomp').value) || 0;
  const acompDados = [];
  const nomes  = [...document.querySelectorAll('.acomp-nome')];
  const idades = [...document.querySelectorAll('.acomp-idade')];
  for (let i = 0; i < qtd; i++) {
    acompDados.push({ nome: nomes[i]?.value || 'Acompanhante', idade: idades[i]?.value || '—' });
  }

  // Comidas selecionadas
  const comidasSel = [...document.querySelectorAll('#comidas-form-grid input[type=checkbox]:checked')]
    .map(c => c.value);

  // Rifa
  const rifaSim   = document.getElementById('rifa-sim')?.classList.contains('active') || false;
  const rifaNum   = rifaSim ? rifaNumSelecionado : null;

  // Sinuca
  const sinucaSim = document.getElementById('sinuca-sim')?.classList.contains('active') || false;

  // Validação rifa
  if (rifaSim && !rifaNum) {
    alert('Você marcou que quer participar da rifa, mas não escolheu um número! Role a tela e selecione um número disponível.');
    return;
  }

  // Checar se número já foi reservado (proteção local)
  if (rifaNum && rifaEstados[rifaNum] && rifaEstados[rifaNum] !== 'disponivel') {
    alert(`O número ${String(rifaNum).padStart(3,'0')} já foi reservado. Por favor escolha outro.`);
    rifaNumSelecionado = null;
    renderRifaForm();
    return;
  }

  // Desabilitar botão durante o envio
  const btn = document.querySelector('.btn-confirm');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Salvando...';

  try {
    const res = await fetch(`${SB_URL}/confirmados`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        nome,
        whats,
        email: document.getElementById('resp-email').value || null,
        acomp: qtd,
        acomp_dados: acompDados,
        comidas: comidasSel,
        rifa: rifaSim,
        rifa_numero: rifaNum,
        sinuca: sinucaSim
      })
    });

    if (!res.ok) throw new Error(await res.text());

    const [novo] = await res.json();
    confirmados.unshift(fromDB(novo));

    // Marcar número como reservado localmente
    if (rifaNum) {
      rifaEstados[rifaNum] = 'reservado';
      renderRifa();
    }

    // Reset form
    document.getElementById('resp-nome').value = '';
    document.getElementById('resp-whats').value = '';
    document.getElementById('resp-email').value = '';
    document.getElementById('qtd-acomp').value = '0';
    document.getElementById('acompanhantes-container').innerHTML = '';
    document.getElementById('preview-box').style.display = 'none';
    // Reset comidas
    document.querySelectorAll('#comidas-form-grid .comida-check-item').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('#comidas-form-grid input[type=checkbox]').forEach(el => el.checked = false);
    // Reset rifa/sinuca
    toggleOpcao('rifa', 'nao');
    toggleOpcao('sinuca', 'nao');
    rifaNumSelecionado = null;

    const msg = document.getElementById('success-msg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 5000);

    // Atualiza lista de sinuca
    renderSinuca();

  } catch (err) {
    console.error(err);
    alert('Erro ao salvar. Verifique sua conexão e tente novamente.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmar Presença';
  }
}

// =====================================================
// LISTA DE CONFIRMADOS
// =====================================================
function calcStats() {
  let pessoas = 0, criancas = 0, adultos = 0;
  confirmados.forEach(c => {
    pessoas += 1 + c.acomp;
    c.acompDados.forEach(a => {
      const idade = parseInt(a.idade) || 25;
      if (idade < 18) criancas++; else adultos++;
    });
    adultos++; // responsável
  });
  document.getElementById('stat-familias').textContent = confirmados.length;
  document.getElementById('stat-pessoas').textContent  = pessoas;
  document.getElementById('stat-criancas').textContent = criancas;
  document.getElementById('stat-adultos').textContent  = adultos;
}

async function renderLista() {
  // Mostra loading na tabela
  document.getElementById('lista-tbody').innerHTML = `
    <tr><td colspan="7" class="text-center py-4" style="color:#aaa; font-family:'Josefin Sans',sans-serif;">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Carregando confirmados...
    </td></tr>`;

  try {
    const res = await fetch(
      `${SB_URL}/confirmados?select=*&order=data_confirmacao.desc`,
      { headers: SB_HEADERS }
    );
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    confirmados = rows.map(fromDB);
  } catch (err) {
    console.error(err);
    document.getElementById('lista-tbody').innerHTML = `
      <tr><td colspan="7" class="text-center py-4" style="color:var(--red)">
        ⚠️ Erro ao carregar dados. Verifique sua conexão.
      </td></tr>`;
    return;
  }

  calcStats();
  filtrarLista();
}

function filtrarLista() {
  const q      = document.getElementById('search-list').value.toLowerCase();
  const filtro = document.getElementById('filtro-list').value;
  const order  = document.getElementById('order-list').value;

  let lista = [...confirmados];

  if (q) lista = lista.filter(c => c.nome.toLowerCase().includes(q) || c.whats.includes(q));
  if (filtro === '1') lista = lista.filter(c => c.acomp === 0);
  else if (filtro === '2') lista = lista.filter(c => c.acomp === 1);
  else if (filtro === '3+') lista = lista.filter(c => c.acomp >= 2);

  if (order === 'nome') lista.sort((a,b) => a.nome.localeCompare(b.nome));
  else if (order === 'total') lista.sort((a,b) => (b.acomp+1) - (a.acomp+1));

  const tbody = document.getElementById('lista-tbody');
  tbody.innerHTML = lista.map((c, i) => {
    const nomeEsc = (c.nome || '').replace(/'/g, "\\'");
    return `
    <tr id="tr-${c.id}">
      <td style="color:#aaa; font-size:.85rem">${i+1}</td>
      <td><strong>${c.nome}</strong></td>
      <td><a href="https://wa.me/55${c.whats.replace(/\D/g,'')}" style="color:#25D366; text-decoration:none"><i class="bi bi-whatsapp me-1"></i>${c.whats}</a></td>
      <td><span class="badge-group" style="background:#f0e9dc; color:#7a2b10">${c.acomp}</span></td>
      <td><strong>${1 + c.acomp}</strong></td>
      <td style="font-size:.85rem; color:#888">${c.data}</td>
      <td style="text-align:center">
        <button class="btn-apagar" onclick="pedirSenhaApagar('${c.id}', '${nomeEsc}')">
          <i class="bi bi-trash me-1"></i>Apagar
        </button>
      </td>
    </tr>`;
  }).join('');
  document.getElementById('lista-count').textContent = `Exibindo ${lista.length} de ${confirmados.length} confirmados`;
}

// =====================================================
// MODAL ADM — APAGAR CONFIRMADO
// =====================================================
const ADM_CODE = '2468';
let _idParaApagar = null;

function pedirSenhaApagar(id, nome) {
  _idParaApagar = id;
  document.getElementById('modal-nome-alvo').textContent = nome;
  document.getElementById('modal-pin').value = '';
  document.getElementById('modal-erro').textContent = '';
  document.getElementById('modal-pin').classList.remove('erro');
  document.getElementById('modal-adm').classList.add('open');
  setTimeout(() => document.getElementById('modal-pin').focus(), 100);
}

function fecharModal() {
  document.getElementById('modal-adm').classList.remove('open');
  _idParaApagar = null;
}

function limparErroPIN() {
  document.getElementById('modal-pin').classList.remove('erro');
  document.getElementById('modal-erro').textContent = '';
}

async function confirmarApagarModal() {
  const pin = document.getElementById('modal-pin').value.trim();
  if (pin !== ADM_CODE) {
    const input = document.getElementById('modal-pin');
    input.classList.add('erro');
    document.getElementById('modal-erro').textContent = '❌ Código incorreto. Tente novamente.';
    input.value = '';
    setTimeout(() => input.focus(), 50);
    return;
  }

  if (!_idParaApagar) return;

  // Feedback visual no botão
  const btnConfirm = document.querySelector('.btn-modal-confirm');
  btnConfirm.disabled = true;
  btnConfirm.innerHTML = '<div class="spinner-border spinner-border-sm me-1"></div>Apagando...';

  try {
    const res = await fetch(
      `${SB_URL}/confirmados?id=eq.${_idParaApagar}`,
      { method: 'DELETE', headers: SB_HEADERS }
    );
    if (!res.ok) throw new Error(await res.text());

    // Remove do cache local
    confirmados = confirmados.filter(c => c.id !== _idParaApagar);
    fecharModal();
    calcStats();
    filtrarLista();

  } catch (err) {
    console.error(err);
    document.getElementById('modal-erro').textContent = '⚠️ Erro ao apagar. Tente novamente.';
    document.getElementById('modal-pin').classList.add('erro');
  } finally {
    btnConfirm.disabled = false;
    btnConfirm.innerHTML = '<i class="bi bi-trash me-1"></i>Apagar';
  }
}

// Fechar modal ao clicar fora
document.getElementById('modal-adm').addEventListener('click', function(e) {
  if (e.target === this) fecharModal();
});

// =====================================================
// COMIDAS TÍPICAS
// =====================================================
const comidas = [
  { icon:'🍮', nome:'Canjiquinha caipira', desc:'' },
  { icon:'🍮', nome:'Canjiquinha de costelinha suína salgada', desc:'' },
  { icon:'🍮', nome:'Canjicão', desc:'' },
  { icon:'🥜', nome:'Pé de Moleque', desc:'Amendoim caramelizado com açúcar, crocante e saboroso.' },
  { icon:'🤎', nome:'Paçoca', desc:'Docinho de amendoim com açúcar e farinha de mandioca.' },
  { icon:'🍰', nome:'Bolo de Milho', desc:'Fofinho e úmido, feito com milho verde e queijo.' },
  { icon:'🌽', nome:'Curau cremoso', desc:'Creme de milho verde adoçado, típico das festas juninas.' },
  { icon:'🫔', nome:'Pamonha doce', desc:'' },
  { icon:'🌭', nome:'Cachorro-quente', desc:'Salsicha com molho de tomate, mostarda e creme de milho.' },
  { icon:'🍿', nome:'Pipoca', desc:'Pipoca doce ou salgada, clássico das festas populares.' },
  { icon:'🌽', nome:'Milho verde Cozido', desc:'Milho cozido inteiro na espiga, simples e delicioso.' },
  { icon:'☕', nome:'Quentão', desc:'Bebida quente de cachaça com gengibre, cravo e canela.' },
  { icon:'🍲', nome:'Caldo de mandioquinha', desc:'' },
  { icon:'🍲', nome:'Caldo de pinto', desc:'' },
  { icon:'🍲', nome:'Caldo verde', desc:'' },
  { icon:'🥥', nome:'Cocada', desc:'Doce de coco ralado com açúcar, branca ou queimada.' },
  { icon:'🫔', nome:'Costela de boi com aimpim', desc:'' },
  { icon:'🍲', nome:'Torta salgada', desc:'' },
  { icon:'🫔', nome:'Bolo de aimpim', desc:'' },
  { icon:'🍲', nome:'Papa de milho', desc:'' },
  { icon:'🫔', nome:'Ambrosia', desc:'' },
  { icon:'🫔', nome:'Tapioca doce', desc:'' },
  { icon:'🍲', nome:'Caldinho de camarão', desc:'' },
  { icon:'🍲', nome:'Caldo de mocotó', desc:'' },
  { icon:'🫔', nome:'Pastel', desc:'' },
  { icon:'🍲', nome:'Feijão tropeiro', desc:'' },
  { icon:'🫔', nome:'Buraco quente', desc:'' },
  { icon:'🍲', nome:'Bolo de cenoura', desc:'' },
  { icon:'🫔', nome:'Chocolate quente', desc:'' },
  { icon:'🍲', nome:'Quentão', desc:'' },
  { icon:'🫔', nome:'Pastel', desc:'' },
];

// Página de comidas (cards)
document.getElementById('comidas-grid').innerHTML = comidas.map(c => `
  <div class="col-6 col-md-4 col-lg-3">
    <div class="food-card">
      <span class="food-icon">${c.icon}</span>
      <h5>${c.nome}</h5>
      <p>${c.desc}</p>
    </div>
  </div>
`).join('');

// Checkboxes de comida no formulário de confirmação
document.getElementById('comidas-form-grid').innerHTML = comidas.map(c => `
  <label class="comida-check-item" onclick="this.classList.toggle('selected'); updatePreview();">
    <input type="checkbox" name="comida" value="${c.nome}">
    <span>${c.icon} ${c.nome}</span>
  </label>
`).join('');

// =====================================================
// RIFA — estados carregados do Supabase
// =====================================================
const rifaEstados = {};
let rifaNumSelecionado = null;

// Busca todos os números já reservados no banco
async function carregarNumerosRifa() {
  try {
    const res = await fetch(
      `${SB_URL}/confirmados?select=rifa_numero&rifa=eq.true&rifa_numero=not.is.null`,
      { headers: SB_HEADERS }
    );
    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    Object.keys(rifaEstados).forEach(k => delete rifaEstados[k]);
    rows.forEach(r => { if (r.rifa_numero) rifaEstados[r.rifa_numero] = 'reservado'; });
  } catch (err) {
    console.error('Erro ao carregar números da rifa:', err);
  }
}

// Aba Rifa: busca banco e renderiza grade (somente leitura)
async function renderRifa() {
  const grid = document.getElementById('rifa-grid');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:1.5rem">Carregando...</div>';
  await carregarNumerosRifa();
  let reservados = 0;
  grid.innerHTML = '';
  for (let i = 1; i <= 100; i++) {
    const estado = rifaEstados[i] || 'disponivel';
    if (estado === 'reservado') reservados++;
    const div = document.createElement('div');
    div.className = `rifa-num ${estado}`;
    div.textContent = String(i).padStart(3,'0');
    div.title = `Número ${String(i).padStart(3,'0')} — ${estado}`;
    grid.appendChild(div);
  }
  const disponiveis = 100 - reservados;
  document.getElementById('rifa-stats-boxes').innerHTML = `
    <div class="rifa-stat-box"><div class="num">100</div><div class="lbl">Total</div></div>
    <div class="rifa-stat-box"><div class="num" style="color:var(--green)">${disponiveis}</div><div class="lbl">Disponíveis</div></div>
    <div class="rifa-stat-box"><div class="num" style="color:var(--orange)">${reservados}</div><div class="lbl">Reservados</div></div>
    <div class="rifa-stat-box"><div class="num" style="color:var(--red)">0</div><div class="lbl">Vendidos</div></div>
  `;
}
renderRifa();

// Mini-rifa interativa no formulário — busca banco antes de mostrar
async function renderRifaForm() {
  const grid = document.getElementById('rifa-form-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:#aaa;padding:1rem">Carregando...</div>';
  await carregarNumerosRifa();
  // Se o número selecionado foi reservado por outra pessoa, deseleciona
  if (rifaNumSelecionado && rifaEstados[rifaNumSelecionado] === 'reservado') {
    rifaNumSelecionado = null;
    document.getElementById('rifa-num-escolhido').textContent =
      '⚠️ Esse número foi reservado por outra pessoa. Escolha outro.';
  }
  grid.innerHTML = '';
  for (let i = 1; i <= 100; i++) {
    const estado = rifaEstados[i] || 'disponivel';
    const selecionado = rifaNumSelecionado === i;
    const div = document.createElement('div');
    div.className = `rifa-num ${selecionado ? 'reservado' : estado}`;
    div.style.cursor = estado === 'disponivel' ? 'pointer' : 'not-allowed';
    div.textContent = String(i).padStart(3,'0');
    div.title = estado !== 'disponivel'
      ? `Número ${String(i).padStart(3,'0')} — reservado`
      : `Selecionar número ${String(i).padStart(3,'0')}`;
    if (estado === 'disponivel') {
      div.onclick = () => {
        rifaNumSelecionado = rifaNumSelecionado === i ? null : i;
        renderRifaForm();
        updatePreview();
        const aviso = document.getElementById('rifa-num-escolhido');
        aviso.textContent = rifaNumSelecionado
          ? `✅ Número selecionado: ${String(rifaNumSelecionado).padStart(3,'0')} — lembre de pagar via PIX!`
          : '';
      };
    }
    grid.appendChild(div);
  }
}

// =====================================================
// TOGGLE PARTICIPAÇÃO RIFA / SINUCA
// =====================================================
function toggleOpcao(tipo, valor) {
  document.getElementById(`${tipo}-sim`).classList.toggle('active', valor === 'sim');
  document.getElementById(`${tipo}-nao`).classList.toggle('active', valor === 'nao');
  if (tipo === 'rifa') {
    const sec = document.getElementById('rifa-num-section');
    sec.style.display = valor === 'sim' ? 'block' : 'none';
    if (valor === 'sim') renderRifaForm();
    else { rifaNumSelecionado = null; }
  }
  if (tipo === 'sinuca') {
    document.getElementById('sinuca-pix-section').style.display = valor === 'sim' ? 'block' : 'none';
  }
  updatePreview();
}

// =====================================================
// COPIAR PIX
// =====================================================
function copiarPix(elId) {
  const txt = document.getElementById(elId).textContent;
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.querySelector(`[onclick="copiarPix('${elId}')"]`);
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check2 me-1"></i>Copiado!';
      btn.style.background = '#219a52';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    }
  }).catch(() => alert('Chave PIX: ' + txt));
}

// =====================================================
// SINUCA — PARTICIPANTES E CHAVEAMENTO
// =====================================================
// A lista de participantes agora é alimentada pelos confirmados
// que marcaram "sim" na sinuca. Exibição dinâmica via renderSinuca().
function renderSinuca() {
  const partEl = document.getElementById('sinuca-participantes');
  const jogadores = confirmados.filter(c => c.sinuca === true || c.sinuca === 'sim');
  const total = jogadores.length;
  document.getElementById('sinuca-total-val').textContent =
    `R$ ${(total * 20).toFixed(2).replace('.',',')}`;
  if (total === 0) {
    partEl.innerHTML = '<p style="color:#aaa; font-size:.9rem; text-align:center; padding:1rem 0">Nenhum inscrito ainda.</p>';
    return;
  }
  partEl.innerHTML = jogadores.map(p => `
    <div class="sinuca-participant">
      <span>${p.nome}</span>
      <span class="badge-inscrito">Inscrito</span>
    </div>
  `).join('');
}

// Chaveamento fictício (visual)
const matches = [
  { r:'Oitavas', p1:'—', p2:'—', s1:'', s2:'', winner:-1 },
  { r:'Oitavas', p1:'—', p2:'—', s1:'', s2:'', winner:-1 },
  { r:'Oitavas', p1:'—', p2:'—', s1:'', s2:'', winner:-1 },
  { r:'Oitavas', p1:'—', p2:'—', s1:'', s2:'', winner:-1 },
];
const semis = [
  { r:'Semifinal', p1:'A definir', p2:'A definir', s1:'', s2:'', winner:-1 },
  { r:'Semifinal', p1:'A definir', p2:'A definir', s1:'', s2:'', winner:-1 },
];
const final = [{ r:'Final', p1:'A definir', p2:'A definir', s1:'', s2:'', winner:-1 }];

function renderBracket(list) {
  return list.map(m => `
    <div class="match-card">
      <div class="match-player ${m.winner===0?'winner':''}">
        ${m.p1} <span class="score">${m.s1}</span>
      </div>
      <div class="match-player ${m.winner===1?'winner':''}">
        ${m.p2} <span class="score">${m.s2}</span>
      </div>
    </div>
  `).join('');
}

document.getElementById('bracket').innerHTML = `
  <div class="bracket-round">
    <h6>🎱 Oitavas</h6>
    ${renderBracket(matches)}
  </div>
  <div class="bracket-round">
    <h6>⚔️ Semifinal</h6>
    ${renderBracket(semis)}
  </div>
  <div class="bracket-round">
    <h6>🏆 Final</h6>
    ${renderBracket(final)}
  </div>
`;
renderSinuca();

// =====================================================
// INIT
// =====================================================
// Carrega lista ao abrir a aba Confirmados
// (chamado automaticamente em showPage('lista'))