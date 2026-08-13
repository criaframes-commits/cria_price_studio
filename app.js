const DEFAULT_TEAM = [
  { id: 1, name: 'Amanda', role: 'Direção visual e produção', hours: 20, rate: 204 },
  { id: 2, name: 'João Vitor', role: 'Direção visual e produção', hours: 20, rate: 204 },
  { id: 3, name: 'Gabriela', role: 'Comercial e financeiro', hours: 20, rate: 145 },
  { id: 4, name: 'Julia', role: 'Pré-produção e TI', hours: 20, rate: 170 },
  { id: 5, name: 'Luan', role: 'Pré-produção', hours: 20, rate: 145 },
];

const state = {
  step: 1, project: 'Filme institucional com IA', client: 'Cliente exemplo',
  deliverables: '1 filme principal de até 60 segundos, formato 16:9, com 2 rodadas de ajustes.',
  rights: 1, urgency: 0, higgsExtra: 150, fx: 5.2, projectsMonth: 3,
  thirdParty: 0, otherCosts: 0, contingency: 10, margin: 30, taxes: 6,
  commission: 5, leadMemberId: 3, team: DEFAULT_TEAM,
};

const brl = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 });
const precise = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', minimumFractionDigits:2 });
const pct = value => `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
const number = value => Math.max(0, Number(value) || 0);

try {
  const saved = JSON.parse(localStorage.getItem('cria-price-studio-v2'));
  if (saved && typeof saved === 'object') Object.assign(state, saved, { step:1 });
  if (!Array.isArray(state.team) || !state.team.length) state.team = DEFAULT_TEAM;
} catch (_) {}

function calculate() {
  const labor = state.team.reduce((sum, member) => sum + number(member.hours) * number(member.rate), 0);
  const monthlyTechBrl = (129 + number(state.higgsExtra) + 20) * number(state.fx) * 1.05;
  const technology = monthlyTechBrl / Math.max(1, number(state.projectsMonth));
  const baseCost = labor + technology + number(state.thirdParty) + number(state.otherCosts);
  const contingencyValue = baseCost * number(state.contingency) / 100;
  const protectedCost = baseCost + contingencyValue;
  const leadMember = state.team.find(member => member.id === number(state.leadMemberId));
  const effectiveCommission = leadMember ? number(state.commission) : 0;
  const denominator = 1 - number(state.margin)/100 - number(state.taxes)/100 - effectiveCommission/100;
  const productionPrice = denominator > .05 ? protectedCost / denominator : 0;
  const withRights = productionPrice * number(state.rights);
  const finalPrice = withRights * (1 + number(state.urgency)/100);
  const commissionValue = finalPrice * effectiveCommission / 100;
  const deductions = finalPrice * number(state.taxes) / 100 + commissionValue;
  const result = finalPrice - deductions - protectedCost;
  const realMargin = finalPrice ? result / finalPrice * 100 : 0;
  const team = state.team.map(member => {
    const work = number(member.hours) * number(member.rate);
    const commercialCommission = leadMember && member.id === leadMember.id ? commissionValue : 0;
    return {...member, work, commercialCommission, total:work + commercialCommission};
  });
  return {labor, technology, baseCost, contingencyValue, protectedCost, productionPrice, finalPrice, deductions, result, realMargin, companyValue:result, commissionValue, leadMember, team};
}

function renderLeadSelector() {
  const select = document.getElementById('leadMember');
  if (!select) return;
  const current = number(state.leadMemberId);
  select.innerHTML = `<option value="0">Sem comissão comercial</option>${state.team.map(member => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join('')}`;
  select.value = state.team.some(member => member.id === current) ? String(current) : '0';
  if (select.value === '0') state.leadMemberId = 0;
}

function bindStateFields() {
  document.querySelectorAll('[data-key]').forEach(field => {
    const key = field.dataset.key;
    if (state[key] !== undefined) field.value = state[key];
    field.addEventListener('input', () => {
      state[key] = field.type === 'text' || field.tagName === 'TEXTAREA' ? field.value : number(field.value);
      persistAndRender();
    });
    field.addEventListener('change', () => {
      state[key] = field.type === 'text' || field.tagName === 'TEXTAREA' ? field.value : number(field.value);
      persistAndRender();
    });
  });
}

function goTo(step) {
  state.step = Math.min(4, Math.max(1, Number(step)));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('is-active', Number(panel.dataset.panel) === state.step));
  document.querySelectorAll('.step').forEach((item, index) => item.classList.toggle('is-active', index + 1 === state.step));
  document.querySelector('.stepper').scrollIntoView({ behavior:'smooth', block:'start' });
  render();
}

function renderTeam() {
  const calc = calculate();
  const container = document.getElementById('teamCards');
  container.innerHTML = calc.team.map(member => `
    <article class="team-card" data-id="${member.id}">
      <div class="person"><input class="person-name" aria-label="Nome do integrante" data-member="${member.id}" data-field="name" value="${escapeHtml(member.name)}" /><input aria-label="Função de ${escapeHtml(member.name)}" data-member="${member.id}" data-field="role" value="${escapeHtml(member.role)}" /></div>
      <label class="mini-field"><span>Horas</span><input type="number" min="0" data-member="${member.id}" data-field="hours" value="${number(member.hours)}" /></label>
      <label class="mini-field"><span>Valor / hora</span><input type="number" min="0" data-member="${member.id}" data-field="rate" value="${number(member.rate)}" /></label>
      <button class="remove-person" data-remove="${member.id}" aria-label="Remover ${escapeHtml(member.name)}">×</button>
    </article>`).join('');

  container.querySelectorAll('[data-member]').forEach(input => input.addEventListener('input', () => {
    const member = state.team.find(item => item.id === Number(input.dataset.member));
    if (!member) return;
    member[input.dataset.field] = ['name','role'].includes(input.dataset.field) ? input.value : number(input.value);
    persistAndRender(false);
  }));
  container.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    if (state.team.length <= 1) return;
    state.team = state.team.filter(member => member.id !== Number(button.dataset.remove));
    persistAndRender();
  }));
}

function render(renderTeamCards = true) {
  const c = calculate();
  setText('summaryPrice', brl.format(c.finalPrice)); setText('summaryCost', brl.format(c.protectedCost));
  setText('summaryResult', brl.format(c.result)); setText('summaryMargin', pct(c.realMargin));
  setText('techProject', precise.format(c.technology)); setText('chatCost', precise.format(20 * number(state.fx) * 1.05));
  setText('finalPrice', brl.format(c.finalPrice));
  setText('quoteProject', state.project || 'Projeto sem nome');
  setText('quoteClient', state.client || 'Cliente não informado');
  setText('pathPrice', brl.format(c.finalPrice)); setText('pathDeductions', brl.format(c.deductions)); setText('pathCost', brl.format(c.protectedCost)); setText('pathResult', brl.format(c.result));
  setText('realMargin', `${pct(c.realMargin)} de margem`); setText('companyValue', brl.format(c.companyValue));
  setText('leadCommissionValue', brl.format(c.commissionValue));
  setText('leadCommissionRecipient', c.leadMember ? `Pago a ${c.leadMember.name}` : 'Nenhum responsável selecionado');
  setText('laborCost', brl.format(c.labor)); setText('breakTech', precise.format(c.technology)); setText('breakOthers', brl.format(number(state.thirdParty)+number(state.otherCosts)));
  setText('breakContingency', brl.format(c.contingencyValue)); setText('productionPrice', brl.format(c.productionPrice)); setText('commercialExtras', brl.format(c.finalPrice-c.productionPrice));
  const health = document.getElementById('healthStatus');
  const valid = c.finalPrice > 0 && c.result >= 0;
  health.textContent = valid ? 'MARGEM PROTEGIDA' : 'REVISAR PERCENTUAIS'; health.classList.toggle('warning', !valid);
  document.getElementById('distributionList').innerHTML = c.team.map(member => `<div class="distribution-row"><span>${escapeHtml(member.name)}<small>${brl.format(member.work)} pelo trabalho${member.commercialCommission ? ` + ${brl.format(member.commercialCommission)} de comissão` : ''}</small></span>${member.commercialCommission ? '<b>LEAD</b>' : '<b>—</b>'}<strong>${brl.format(member.total)}</strong></div>`).join('');
  renderLeadSelector();
  if (renderTeamCards) renderTeam();
}

function setText(id, value) { const el = document.getElementById(id); if (el) el.textContent = value; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char])); }
function persistAndRender(renderTeamCards = true) {
  localStorage.setItem('cria-price-studio-v2', JSON.stringify({...state,step:undefined}));
  const status = document.getElementById('saveStatus'); status.textContent = 'Salvo agora';
  clearTimeout(window.saveTimer); window.saveTimer = setTimeout(() => status.textContent = 'Alterações salvas neste dispositivo', 1200);
  render(renderTeamCards);
}

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.go)));
document.getElementById('headerBudget').addEventListener('click', () => goTo(4));
document.getElementById('addMember').addEventListener('click', () => {
  const id = Math.max(0,...state.team.map(member => member.id)) + 1;
  state.team.push({id,name:'Nova pessoa',role:'Função no projeto',hours:10,rate:145}); persistAndRender();
});
document.querySelector('.breakdown-toggle').addEventListener('click', event => {
  const button = event.currentTarget, body = document.querySelector('.breakdown-body'), open = body.hidden;
  body.hidden = !open; button.setAttribute('aria-expanded', String(open)); button.querySelector('span').textContent = open ? '−' : '+';
});
['printBudget','printBudgetBottom'].forEach(id => document.getElementById(id).addEventListener('click', () => window.print()));

renderLeadSelector(); bindStateFields(); render();
