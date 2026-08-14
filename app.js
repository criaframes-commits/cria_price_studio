const DEFAULT_TEAM = [
  { id: 1, name: 'Amanda', role: 'Direção visual e produção', hours: 20, rate: 204 },
  { id: 2, name: 'João Vitor', role: 'Direção visual e produção', hours: 20, rate: 204 },
  { id: 3, name: 'Gabriela', role: 'Comercial e financeiro', hours: 20, rate: 145 },
  { id: 4, name: 'Julia', role: 'Pré-produção e TI', hours: 20, rate: 170 },
  { id: 5, name: 'Luan', role: 'Pré-produção', hours: 20, rate: 145 },
];

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateAfter(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return localDateValue(date);
}

const CURRENT_RULES_VERSION = 2;
const EXTRA_CREDIT_PACKS = { 0: 0, 30: 600, 50: 1000, 90: 1800, 150: 3000, 300: 6000 };
const BASE_HIGGS_CREDITS = 3000;
const EXCHANGE_PROTECTION = 1.05;

const state = {
  step: 1,
  project: 'Filme institucional com IA',
  client: 'Cliente exemplo',
  deliverables: 'Filme principal em 16:9, com 2 rodadas de ajustes.',
  rights: 1,
  deliveryDate: dateAfter(21),
  scenes: [{ id: 1, duration: 20 }, { id: 2, duration: 20 }, { id: 3, duration: 20 }],
  realism: 'hybrid',
  quality: 'high',
  freedom: 'balanced',
  modelStrategy: 'auto',
  complexityOverride: 'auto',
  budgetView: 'internal',
  higgsExtra: 0,
  foodReserveMode: 'always',
  rulesVersion: CURRENT_RULES_VERSION,
  fx: 5.2,
  projectsMonth: 3,
  thirdParty: 0,
  otherCosts: 0,
  contingency: 10,
  margin: 30,
  taxes: 6,
  commission: 5,
  leadMemberId: 3,
  team: DEFAULT_TEAM,
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const precise = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const pct = value => `${Number(value || 0).toFixed(1).replace('.', ',')}%`;
const number = value => Math.max(0, Number(value) || 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, number(value)));

let savedRulesVersion = 0;
try {
  const saved = JSON.parse(localStorage.getItem('cria-price-studio-v2'));
  if (saved && typeof saved === 'object') {
    savedRulesVersion = number(saved.rulesVersion);
    Object.assign(state, saved, { step: 1 });
  }
} catch (_) {}

if (savedRulesVersion < CURRENT_RULES_VERSION) {
  state.higgsExtra = 0;
  state.foodReserveMode = 'always';
  state.rulesVersion = CURRENT_RULES_VERSION;
}

if (!Array.isArray(state.team) || !state.team.length) state.team = DEFAULT_TEAM;
if (!Array.isArray(state.scenes) || !state.scenes.length) state.scenes = [{ id: 1, duration: 20 }, { id: 2, duration: 20 }, { id: 3, duration: 20 }];
state.scenes = state.scenes.map((scene, index) => ({ id: scene.id || index + 1, duration: clamp(scene.duration || 20, 15, 30) }));
if (!state.deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(state.deliveryDate)) state.deliveryDate = dateAfter(21);
if (!['animation', 'hybrid', 'photoreal'].includes(state.realism)) state.realism = 'hybrid';
if (!['standard', 'high', 'cinema'].includes(state.quality)) state.quality = 'high';
if (!['flexible', 'balanced', 'strict'].includes(state.freedom)) state.freedom = 'balanced';
if (!['auto', 'seedance20', 'mixed', 'seedance25'].includes(state.modelStrategy)) state.modelStrategy = 'auto';
if (!['auto', 'low', 'medium', 'high'].includes(state.complexityOverride)) state.complexityOverride = 'auto';
if (!['internal', 'external'].includes(state.budgetView)) state.budgetView = 'internal';
if (!Object.prototype.hasOwnProperty.call(EXTRA_CREDIT_PACKS, number(state.higgsExtra))) state.higgsExtra = 0;
if (!['always', 'urgent', 'off'].includes(state.foodReserveMode)) state.foodReserveMode = 'always';

function profileProject() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(`${state.deliveryDate}T00:00:00`);
  const rawDays = Number.isNaN(delivery.getTime()) ? 21 : Math.ceil((delivery - today) / 86400000);
  const days = Math.max(0, rawDays);
  const urgency = days <= 7 ? 30 : days <= 14 ? 15 : 0;
  const urgencyKey = days <= 7 ? 'very' : days <= 14 ? 'urgent' : 'normal';
  const totalDuration = state.scenes.reduce((sum, scene) => sum + clamp(scene.duration, 15, 30), 0);

  let automaticComplexity = 'medium';
  if (state.realism === 'photoreal') automaticComplexity = 'high';
  if (state.realism === 'animation') automaticComplexity = 'low';
  if (state.realism === 'hybrid') automaticComplexity = 'medium';
  if ((state.quality === 'cinema' || state.scenes.length >= 6 || totalDuration > 120) && automaticComplexity === 'low') automaticComplexity = 'medium';
  if ((state.quality === 'cinema' || state.scenes.length >= 7 || totalDuration > 150) && automaticComplexity === 'medium') automaticComplexity = 'high';
  const complexity = state.complexityOverride === 'auto' ? automaticComplexity : state.complexityOverride;

  const baseAttempts = { low: 2, medium: 3, high: 4 }[complexity];
  const attempts = Math.max(1, baseAttempts + (state.freedom === 'strict' ? 1 : state.freedom === 'flexible' ? -1 : 0));
  const requestedResolution = { standard: '720p', high: '1080p', cinema: '4K' }[state.quality];
  let automaticModelStrategy = 'mixed';
  if (state.realism === 'photoreal' || state.freedom === 'strict') automaticModelStrategy = 'seedance25';
  if (state.realism === 'animation' || state.freedom === 'flexible') automaticModelStrategy = 'seedance20';
  const modelStrategy = state.modelStrategy === 'auto' ? automaticModelStrategy : state.modelStrategy;
  const rates = {
    seedance20: { '720p': 75, '1080p': 150, '4K': 330 },
    seedance25: { '720p': 90, '1080p': 180, '4K': 330 },
  };
  const sceneDetails = state.scenes.map((scene, index) => {
    const duration = clamp(scene.duration, 15, 30);
    const resolution = duration === 30 ? '4K' : requestedResolution;
    const model = modelStrategy === 'mixed' ? (index % 2 === 0 ? 'seedance20' : 'seedance25') : modelStrategy;
    const generations = Math.ceil(duration / 15);
    const creditsPerGeneration = rates[model][resolution];
    const credits = generations * creditsPerGeneration * attempts;
    return { id: scene.id, number: index + 1, duration, resolution, model, generations, creditsPerGeneration, attempts, credits };
  });
  const modelCredits = {
    seedance20: sceneDetails.filter(scene => scene.model === 'seedance20').reduce((sum, scene) => sum + scene.credits, 0),
    seedance25: sceneDetails.filter(scene => scene.model === 'seedance25').reduce((sum, scene) => sum + scene.credits, 0),
  };
  const estimatedCredits = modelCredits.seedance20 + modelCredits.seedance25;

  return { days, rawDays, urgency, urgencyKey, totalDuration, automaticComplexity, complexity, attempts, requestedResolution, automaticModelStrategy, modelStrategy, sceneDetails, modelCredits, estimatedCredits };
}

function calculate() {
  const profile = profileProject();
  const labor = state.team.reduce((sum, member) => sum + number(member.hours) * number(member.rate), 0);
  const projectsMonth = Math.max(1, Math.round(number(state.projectsMonth)));
  const exchangeWithProtection = number(state.fx) * EXCHANGE_PROTECTION;
  const extraPackUsd = number(state.higgsExtra);
  const extraCredits = EXTRA_CREDIT_PACKS[number(state.higgsExtra)] || 0;
  const monthlyHiggsCredits = BASE_HIGGS_CREDITS + extraCredits;
  const plannedCreditsPerProject = monthlyHiggsCredits / projectsMonth;
  const excessCredits = Math.max(0, profile.estimatedCredits - plannedCreditsPerProject);
  const creditUsd = 1 / 21;
  const higgsProjectUsd = profile.estimatedCredits * creditUsd;
  const creditProjectBrl = higgsProjectUsd * exchangeWithProtection;
  const higgsExtraMonthlyBrl = extraPackUsd * exchangeWithProtection;
  const higgsMonthlyBrl = 250 + higgsExtraMonthlyBrl;
  const higgsAllocated = higgsMonthlyBrl / projectsMonth;
  const chatProjectBrl = 20 * exchangeWithProtection / projectsMonth;
  const claudeProjectBrl = 20 * exchangeWithProtection / projectsMonth;
  const subscriptionsAllocated = higgsAllocated + chatProjectBrl + claudeProjectBrl;
  const excessCreditProvisionBrl = excessCredits * creditUsd * exchangeWithProtection;
  const technology = subscriptionsAllocated + excessCreditProvisionBrl;
  const monthlyFoodReserve = state.foodReserveMode === 'always' || (state.foodReserveMode === 'urgent' && profile.urgency > 0) ? 250 : 0;
  const overtimeFood = monthlyFoodReserve / projectsMonth;
  const baseCost = labor + technology + overtimeFood + number(state.thirdParty) + number(state.otherCosts);
  const contingencyValue = baseCost * number(state.contingency) / 100;
  const protectedCost = baseCost + contingencyValue;
  const leadMember = state.team.find(member => member.id === number(state.leadMemberId));
  const effectiveCommission = leadMember ? number(state.commission) : 0;
  const denominator = 1 - number(state.margin) / 100 - number(state.taxes) / 100 - effectiveCommission / 100;
  const productionPrice = denominator > 0.05 ? protectedCost / denominator : 0;
  const withRights = productionPrice * number(state.rights);
  const finalPrice = withRights * (1 + profile.urgency / 100);
  const rightsValue = withRights - productionPrice;
  const urgencyValue = finalPrice - withRights;
  const commissionValue = finalPrice * effectiveCommission / 100;
  const taxValue = finalPrice * number(state.taxes) / 100;
  const deductions = taxValue + commissionValue;
  const result = finalPrice - deductions - protectedCost;
  const realMargin = finalPrice ? result / finalPrice * 100 : 0;
  const team = state.team.map(member => {
    const work = number(member.hours) * number(member.rate);
    const commercialCommission = leadMember && member.id === leadMember.id ? commissionValue : 0;
    return { ...member, work, commercialCommission, total: work + commercialCommission };
  });
  const clientRateMultiplier = labor > 0 ? finalPrice / labor : 1;
  const externalTeam = state.team.map(member => {
    const clientRate = number(member.rate) * clientRateMultiplier;
    return { ...member, clientRate, clientTotal: number(member.hours) * clientRate };
  });
  return { profile, labor, projectsMonth, extraPackUsd, extraCredits, monthlyHiggsCredits, plannedCreditsPerProject, excessCredits, creditUsd, higgsProjectUsd, creditProjectBrl, higgsExtraMonthlyBrl, higgsMonthlyBrl, higgsAllocated, chatProjectBrl, claudeProjectBrl, subscriptionsAllocated, excessCreditProvisionBrl, technology, monthlyFoodReserve, overtimeFood, baseCost, contingencyValue, protectedCost, productionPrice, withRights, rightsValue, urgencyValue, finalPrice, taxValue, deductions, result, realMargin, companyValue: result, commissionValue, leadMember, team, clientRateMultiplier, externalTeam };
}

function extraCreditRecommendation(calc) {
  if (!calc.excessCredits) return '';
  const creditsNeededInMonth = Math.ceil(calc.profile.estimatedCredits * calc.projectsMonth - BASE_HIGGS_CREDITS);
  const options = Object.entries(EXTRA_CREDIT_PACKS)
    .map(([usd, credits]) => ({ usd: number(usd), credits }))
    .filter(option => option.credits > 0)
    .sort((a, b) => a.credits - b.credits);
  const option = options.find(item => item.credits >= creditsNeededInMonth);
  if (option) return `Para manter essa divisão, selecione ao menos US$ ${integer.format(option.usd)} · ${integer.format(option.credits)} cr extras.`;
  return `Para manter a mesma cota para todos os projetos, seriam necessários mais ${integer.format(creditsNeededInMonth)} cr no mês; o maior pacote disponível não cobre sozinho.`;
}

function renderLeadSelector() {
  const select = document.getElementById('leadMember');
  if (!select) return;
  const current = number(state.leadMemberId);
  select.innerHTML = `<option value="0">Sem comissão comercial</option>${state.team.map(member => `<option value="${member.id}">${escapeHtml(member.name)}</option>`).join('')}`;
  select.value = state.team.some(member => member.id === current) ? String(current) : '0';
  if (select.value === '0') state.leadMemberId = 0;
}

function fieldValue(field) {
  if (field.dataset.valueType === 'text' || field.type === 'text' || field.type === 'date' || field.tagName === 'TEXTAREA') return field.value;
  if (field.tagName === 'SELECT' && field.dataset.valueType === 'text') return field.value;
  return number(field.value);
}

function bindStateFields() {
  document.querySelectorAll('[data-key]').forEach(field => {
    const key = field.dataset.key;
    if (state[key] !== undefined) field.value = state[key];
    const update = () => { state[key] = fieldValue(field); persistAndRender(); };
    field.addEventListener('input', update);
    field.addEventListener('change', update);
  });
}

function goTo(step) {
  state.step = Math.min(4, Math.max(1, Number(step)));
  document.querySelectorAll('.panel').forEach(panel => panel.classList.toggle('is-active', Number(panel.dataset.panel) === state.step));
  document.querySelectorAll('.step').forEach((item, index) => item.classList.toggle('is-active', index + 1 === state.step));
  document.querySelector('.stepper').scrollIntoView({ behavior: 'smooth', block: 'start' });
  render();
}

function updateScene(id, duration) {
  const scene = state.scenes.find(item => item.id === id);
  if (!scene) return;
  scene.duration = clamp(duration, 15, 30);
  persistAndRender();
}

function renderScenes() {
  const container = document.getElementById('sceneList');
  container.innerHTML = state.scenes.map((scene, index) => `
    <article class="scene-row">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <div><b>Cena ${index + 1}</b><small>mín. 15s · máx. 30s</small></div>
      <input type="range" min="15" max="30" step="1" value="${scene.duration}" data-scene-range="${scene.id}" aria-label="Duração da cena ${index + 1}" />
      <label><input type="number" min="15" max="30" value="${scene.duration}" data-scene-number="${scene.id}" aria-label="Segundos da cena ${index + 1}" /><i>s</i></label>
    </article>`).join('');
  container.querySelectorAll('[data-scene-range]').forEach(input => input.addEventListener('change', () => updateScene(Number(input.dataset.sceneRange), input.value)));
  container.querySelectorAll('[data-scene-number]').forEach(input => input.addEventListener('change', () => updateScene(Number(input.dataset.sceneNumber), input.value)));
}

function renderProject() {
  const calc = calculate();
  const profile = calc.profile;
  const complexityNames = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  const realismNames = { animation: 'animação', hybrid: 'híbrido', photoreal: 'fotorrealismo' };
  const qualityNames = { standard: 'standard', high: 'alta', cinema: 'cinema' };

  setText('todayLabel', `Hoje: ${new Date().toLocaleDateString('pt-BR')}`);
  setText('deadlineDays', profile.rawDays < 0 ? 'Data vencida' : `${profile.days} ${profile.days === 1 ? 'dia' : 'dias'}`);
  setText('urgencyLabel', profile.urgencyKey === 'very' ? 'Muito urgente · até 1 semana · +30%' : profile.urgencyKey === 'urgent' ? 'Urgente · até 2 semanas · +15%' : 'Prazo normal · mais de 2 semanas');
  document.querySelector('.deadline-result')?.setAttribute('data-urgency', profile.urgencyKey);
  setText('sceneCount', String(state.scenes.length));
  setText('totalDuration', `${profile.totalDuration}s`);
  setText('complexityLabel', complexityNames[profile.complexity]);
  setText('complexityReason', state.complexityOverride === 'auto' ? `Automática: ${realismNames[state.realism]}, qualidade ${qualityNames[state.quality]}, ${state.scenes.length} cenas e ${profile.totalDuration}s.` : 'Classificação definida manualmente.');
  setText('estimatedCredits', `${integer.format(profile.estimatedCredits)} créditos`);
  setText('estimatedCreditCost', precise.format(calc.higgsProjectUsd * number(state.fx) * 1.05));
  setText('creditFormula', `${profile.sceneDetails.reduce((sum, scene) => sum + scene.generations, 0)} gerações de até 15s × ${profile.attempts} tentativa(s), detalhadas na etapa 02`);
  document.querySelectorAll('[data-realism]').forEach(button => button.classList.toggle('is-active', button.dataset.realism === state.realism));
  document.querySelectorAll('[data-quality]').forEach(button => button.classList.toggle('is-active', button.dataset.quality === state.quality));
  document.querySelectorAll('[data-freedom]').forEach(button => button.classList.toggle('is-active', button.dataset.freedom === state.freedom));
  renderScenes();
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
    member[input.dataset.field] = ['name', 'role'].includes(input.dataset.field) ? input.value : number(input.value);
    persistAndRender(false);
  }));
  container.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
    if (state.team.length <= 1) return;
    state.team = state.team.filter(member => member.id !== Number(button.dataset.remove));
    persistAndRender();
  }));
}

function serviceDescription(role) {
  const normalized = String(role || '').toLowerCase();
  if (normalized.includes('ti')) return 'Pré-produção, pesquisa, planejamento técnico e operação dos fluxos de inteligência artificial.';
  if (normalized.includes('pré-produção')) return 'Pesquisa, referências, planejamento, roteiro e preparação das etapas de produção.';
  if (normalized.includes('comercial') || normalized.includes('financeiro')) return 'Atendimento, gestão comercial, organização financeira e acompanhamento do projeto.';
  if (normalized.includes('direção visual') || normalized.includes('produção')) return 'Direção visual, desenvolvimento estético, produção e acompanhamento da execução audiovisual.';
  return `Execução das atividades de ${role || 'produção audiovisual'} previstas para o projeto.`;
}

function formatDeliveryDate() {
  const delivery = new Date(`${state.deliveryDate}T12:00:00`);
  return Number.isNaN(delivery.getTime()) ? 'A definir' : delivery.toLocaleDateString('pt-BR');
}

function renderDocumentRows(id, rows) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = rows.map(row => `<div class="document-row${row.emphasis ? ' is-emphasis' : ''}"><span>${escapeHtml(row.label)}${row.detail ? `<small>${escapeHtml(row.detail)}</small>` : ''}</span>${row.middle ? `<b>${escapeHtml(row.middle)}</b>` : ''}<strong>${escapeHtml(row.value)}</strong></div>`).join('');
}

function renderBudgetDocuments(calc) {
  const profile = calc.profile;
  const complexityNames = { low: 'Baixa', medium: 'Média', high: 'Alta' };
  const realismNames = { animation: 'Animação', hybrid: 'Híbrido', photoreal: 'Fotorrealista' };
  const strategyNames = { seedance20: 'Seedance 2.0', seedance25: 'Seedance 2.5', mixed: 'Seedance 2.0 + 2.5' };
  const rightsNames = { 1: 'Digital orgânico no Brasil', 1.15: 'Mídia paga digital no Brasil', 1.35: 'Campanha nacional multiplataforma', 1.6: 'Uso amplo ou exclusividade' };
  const urgencyName = profile.urgencyKey === 'very' ? 'Muito urgente' : profile.urgencyKey === 'urgent' ? 'Urgente' : 'Prazo normal';
  const urgencyDetail = profile.urgencyKey === 'very' ? `${profile.days} dias disponíveis · entrega em até 1 semana` : profile.urgencyKey === 'urgent' ? `${profile.days} dias disponíveis · entrega em até 2 semanas` : `${profile.days} dias disponíveis · planejamento acima de 2 semanas`;
  const urgencyImpact = profile.urgency ? `O valor final já contempla o adicional de ${profile.urgency}% referente à mobilização para este prazo.` : 'Sem adicional de urgência; execução dentro do prazo regular de produção.';
  const delivery = formatDeliveryDate();
  const project = state.project || 'Projeto sem nome';
  const client = state.client || 'Cliente não informado';
  const deliverables = state.deliverables || 'Entregáveis conforme escopo definido com o cliente.';

  ['internalProject', 'externalProject'].forEach(id => setText(id, project));
  ['internalClient', 'externalClient'].forEach(id => setText(id, client));
  ['internalDelivery', 'externalDelivery'].forEach(id => setText(id, delivery));
  ['internalUrgency', 'externalUrgency'].forEach(id => setText(id, urgencyName));
  ['internalDeliverables', 'externalDeliverables'].forEach(id => setText(id, deliverables));
  setText('externalUrgencyDetail', urgencyDetail);
  setText('externalUrgencyImpact', urgencyImpact);
  setText('externalFinalPrice', brl.format(calc.finalPrice));
  document.getElementById('externalUrgencyCard')?.setAttribute('data-urgency', profile.urgencyKey);

  const specifications = document.getElementById('internalSpecifications');
  if (specifications) specifications.innerHTML = [
    ['Duração total', `${profile.totalDuration}s`],
    ['Cenas', `${state.scenes.length} · 15s a 30s cada`],
    ['Realismo', realismNames[state.realism]],
    ['Qualidade', profile.requestedResolution],
    ['Complexidade', complexityNames[profile.complexity]],
    ['Modelos', strategyNames[profile.modelStrategy]],
    ['Tentativas previstas', `${profile.attempts} por geração`],
    ['Direitos de uso', rightsNames[number(state.rights)] || 'Conforme contrato'],
  ].map(([label, value]) => `<div><small>${escapeHtml(label)}</small><b>${escapeHtml(value)}</b></div>`).join('');

  const teamTable = document.getElementById('internalTeamTable');
  if (teamTable) teamTable.innerHTML = `<div class="document-row document-table-head"><span>Profissional e serviço</span><b>Horas · valor/hora</b><strong>Custo real</strong></div>${calc.team.map(member => `<div class="document-row"><span>${escapeHtml(member.name)}<small>${escapeHtml(member.role)} · ${escapeHtml(serviceDescription(member.role))}</small></span><b>${integer.format(member.hours)}h · ${precise.format(member.rate)}/h</b><strong>${precise.format(member.work)}</strong></div>`).join('')}<div class="document-row is-emphasis"><span>Total da equipe</span><strong>${precise.format(calc.labor)}</strong></div>`;

  renderDocumentRows('internalCostTable', [
    { label: 'Trabalho da equipe', value: precise.format(calc.labor) },
    { label: 'Tecnologia alocada', detail: `${integer.format(profile.estimatedCredits)} cr previstos`, value: precise.format(calc.technology) },
    { label: 'Terceiros e fornecedores', value: precise.format(number(state.thirdParty)) },
    { label: 'Outras despesas específicas', value: precise.format(number(state.otherCosts)) },
    { label: 'Reserva de alimentação', value: precise.format(calc.overtimeFood) },
    { label: `Contingência · ${pct(state.contingency)}`, value: precise.format(calc.contingencyValue) },
    { label: 'Custo protegido', value: precise.format(calc.protectedCost), emphasis: true },
  ]);

  renderDocumentRows('internalCommercialTable', [
    { label: 'Preço-base de produção', value: precise.format(calc.productionPrice) },
    { label: `Direitos de uso · ${pct((number(state.rights) - 1) * 100)}`, value: precise.format(calc.rightsValue) },
    { label: `Urgência · ${pct(profile.urgency)}`, value: precise.format(calc.urgencyValue) },
    { label: `Impostos previstos · ${pct(state.taxes)}`, value: precise.format(calc.taxValue) },
    { label: `Comissão comercial · ${calc.leadMember ? calc.leadMember.name : 'sem responsável'}`, value: precise.format(calc.commissionValue) },
    { label: 'Valor final ao cliente', value: precise.format(calc.finalPrice), emphasis: true },
  ]);

  const creditTable = document.getElementById('internalCreditTable');
  if (creditTable) creditTable.innerHTML = `<div class="document-row document-table-head"><span>Cena e configuração</span><b>Modelo</b><strong>Créditos</strong></div>${profile.sceneDetails.map(scene => `<div class="document-row"><span>Cena ${scene.number}<small>${scene.duration}s · ${scene.resolution} · ${scene.generations} geração(ões) × ${scene.attempts} tentativa(s)</small></span><b>${scene.model === 'seedance20' ? 'Seedance 2.0' : 'Seedance 2.5'}</b><strong>${integer.format(scene.credits)} cr</strong></div>`).join('')}<div class="document-row is-emphasis"><span>Total previsto</span><b>Cota: ${integer.format(calc.plannedCreditsPerProject)} cr</b><strong>${integer.format(profile.estimatedCredits)} cr</strong></div>`;

  const distribution = document.getElementById('distributionList');
  if (distribution) distribution.innerHTML = calc.team.map(member => `<div class="document-row"><span>${escapeHtml(member.name)}<small>${precise.format(member.work)} pelo trabalho${member.commercialCommission ? ` + ${precise.format(member.commercialCommission)} de comissão` : ''}</small></span><b>${member.commercialCommission ? 'RESPONSÁVEL PELO LEAD' : escapeHtml(member.role)}</b><strong>${precise.format(member.total)}</strong></div>`).join('');

  const externalServices = document.getElementById('externalServiceTable');
  if (externalServices) externalServices.innerHTML = `<div class="document-row document-table-head"><span>Descrição do serviço</span><b>Horas · valor/hora comercial</b><strong>Subtotal</strong></div>${calc.externalTeam.map(member => `<div class="document-row"><span>${escapeHtml(member.role)}<small>${escapeHtml(serviceDescription(member.role))} Responsável: ${escapeHtml(member.name)}.</small></span><b>${integer.format(member.hours)}h · ${precise.format(member.clientRate)}/h</b><strong>${precise.format(member.clientTotal)}</strong></div>`).join('')}`;

  const relatedItems = [
    { label: 'Produção audiovisual com inteligência artificial', detail: `${state.scenes.length} cenas · ${profile.totalDuration}s no total · qualidade ${profile.requestedResolution}` },
    { label: 'Geração e processamento visual', detail: `${strategyNames[profile.modelStrategy]} · ${integer.format(profile.estimatedCredits)} créditos previstos` },
    { label: 'Planejamento e rodadas de geração', detail: `${profile.attempts} tentativa(s) previstas por geração · complexidade ${complexityNames[profile.complexity].toLowerCase()}` },
    { label: 'Licenciamento e uso', detail: rightsNames[number(state.rights)] || 'Conforme contrato' },
  ];
  if (number(state.thirdParty) > 0) relatedItems.push({ label: 'Fornecedores especializados', detail: 'Contratações externas necessárias para o escopo aprovado' });
  if (number(state.otherCosts) > 0) relatedItems.push({ label: 'Recursos específicos de produção', detail: 'Despesas diretamente relacionadas à execução do serviço' });
  renderDocumentRows('externalAdditionalCosts', relatedItems.map(item => ({ ...item, value: 'Incluído' })));
  setText('externalConditions', `${deliverables} Entrega prevista para ${delivery}. ${urgencyImpact} O valor apresentado é fechado para o escopo descrito; mudanças de escopo são recalculadas antes da execução.`);
  setBudgetView(state.budgetView, false);
}

function setBudgetView(view, persist = true) {
  state.budgetView = view === 'external' ? 'external' : 'internal';
  document.querySelectorAll('[data-budget-view]').forEach(button => {
    const active = button.dataset.budgetView === state.budgetView;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('[data-budget-document]').forEach(documentSection => {
    const active = documentSection.dataset.budgetDocument === state.budgetView;
    documentSection.classList.toggle('is-active', active);
    documentSection.hidden = !active;
  });
  if (persist) localStorage.setItem('cria-price-studio-v2', JSON.stringify({ ...state, step: undefined, urgency: undefined }));
}

function printBudget(type) {
  const printType = type === 'external' ? 'external' : 'internal';
  const previousTitle = document.title;
  document.body.classList.remove('print-internal', 'print-external');
  document.body.classList.add(`print-${printType}`);
  document.title = `${printType === 'internal' ? 'Orçamento interno' : 'Proposta comercial'} - ${state.project || 'Cria Frames'}`;
  const clean = () => {
    document.body.classList.remove('print-internal', 'print-external');
    document.title = previousTitle;
    window.removeEventListener('afterprint', clean);
  };
  window.addEventListener('afterprint', clean);
  window.print();
}

function render(renderTeamCards = true) {
  const calc = calculate();
  const profile = calc.profile;
  const availablePerProject = Math.floor(calc.plannedCreditsPerProject);
  const covered = calc.excessCredits === 0;
  setText('summaryPrice', brl.format(calc.finalPrice));
  setText('summaryCost', brl.format(calc.protectedCost));
  setText('summaryResult', brl.format(calc.result));
  setText('summaryMargin', pct(calc.realMargin));
  setText('techProject', precise.format(calc.technology));
  setText('chatCost', precise.format(20 * number(state.fx) * 1.05));
  setText('claudeCost', precise.format(20 * number(state.fx) * 1.05));
  setText('higgsUsageSummary', `Plano: R$ 250/mês · 3.000 cr${calc.extraCredits ? ` + ${integer.format(calc.extraCredits)} extras` : ' · sem extras'}`);
  setText('runwayStatus', profile.urgency > 0 ? 'Não utilizado: projetos urgentes usam somente Higgsfield' : 'Plano gratuito · disponível para prazo normal');
  document.getElementById('runwayRow')?.classList.toggle('is-disabled', profile.urgency > 0);
  setText('foodStatus', calc.monthlyFoodReserve ? `R$ 250/mês · ${brl.format(calc.overtimeFood)} alocados neste projeto` : state.foodReserveMode === 'urgent' ? 'Não aplicado: o projeto não é urgente' : 'Reserva desativada');
  document.getElementById('foodRow')?.classList.toggle('is-disabled', calc.monthlyFoodReserve === 0);
  const remainingCredits = Math.max(0, availablePerProject - profile.estimatedCredits);
  const divisionExplanation = `${integer.format(calc.monthlyHiggsCredits)} cr mensais ÷ ${integer.format(calc.projectsMonth)} ${calc.projectsMonth === 1 ? 'projeto' : 'projetos'}`;
  setText('technologyCostNote', calc.excessCreditProvisionBrl > 0 ? `${precise.format(calc.subscriptionsAllocated)} de assinaturas + ${precise.format(calc.excessCreditProvisionBrl)} reservados para créditos acima da cota.` : `${precise.format(calc.subscriptionsAllocated)} em assinaturas mensais alocadas; sem cobrança duplicada dos créditos incluídos.`);
  setText('creditCoverageStatus', covered ? `Cota suficiente: este projeto usa ${integer.format(profile.estimatedCredits)} cr dos ${integer.format(availablePerProject)} cr planejados (${divisionExplanation}). Restam ${integer.format(remainingCredits)} cr.` : `Cota insuficiente: este projeto precisa de ${integer.format(profile.estimatedCredits)} cr, mas tem ${integer.format(availablePerProject)} cr planejados (${divisionExplanation}). Faltam ${integer.format(Math.ceil(calc.excessCredits))} cr. ${extraCreditRecommendation(calc)}`);
  document.getElementById('technologyProjectCard')?.classList.toggle('is-over-quota', !covered);
  setText('finalPrice', brl.format(calc.finalPrice));
  setText('pathCost', brl.format(calc.protectedCost));
  setText('pathResult', brl.format(calc.result));
  setText('realMargin', `${pct(calc.realMargin)} de margem`);
  setText('companyValue', brl.format(calc.companyValue));
  setText('leadCommissionValue', brl.format(calc.commissionValue));
  setText('leadCommissionRecipient', calc.leadMember ? `Pago a ${calc.leadMember.name}` : 'Nenhum responsável selecionado');
  const strategyNames = { seedance20: 'Seedance 2.0', seedance25: 'Seedance 2.5', mixed: 'Seedance 2.0 + 2.5' };
  const modelBreakdown = document.getElementById('modelBreakdown');
  if (modelBreakdown) modelBreakdown.innerHTML = `<header><span>${state.modelStrategy === 'auto' ? 'ESTRATÉGIA AUTOMÁTICA' : 'ESTRATÉGIA MANUAL'}</span><b>${strategyNames[profile.modelStrategy]}</b><small>${state.modelStrategy !== 'auto' ? `Escolha manual aplicada. A recomendação automática seria ${strategyNames[profile.automaticModelStrategy]}.` : state.realism === 'photoreal' ? 'Fotorrealismo prioriza o Seedance 2.5.' : state.freedom === 'strict' ? 'Direção rígida prioriza o Seedance 2.5.' : state.realism === 'animation' || state.freedom === 'flexible' ? 'Animação ou maior liberdade prioriza o Seedance 2.0.' : 'Briefing equilibrado distribui as cenas entre os dois modelos.'}</small></header>${profile.sceneDetails.map(scene => `<div><span>Cena ${scene.number}<small>${scene.duration}s · ${scene.resolution} · ${scene.generations} geração(ões) × ${scene.attempts} tentativa(s)</small></span><b>${scene.model === 'seedance20' ? 'Seedance 2.0' : 'Seedance 2.5'}</b><strong>${integer.format(scene.credits)} cr</strong></div>`).join('')}<footer><span>2.0: ${integer.format(profile.modelCredits.seedance20)} cr</span><span>2.5: ${integer.format(profile.modelCredits.seedance25)} cr</span><b>${integer.format(profile.estimatedCredits)} cr · ${precise.format(calc.creditProjectBrl)}</b></footer>`;
  const health = document.getElementById('healthStatus');
  const valid = calc.finalPrice > 0 && calc.result >= 0;
  health.textContent = valid ? 'MARGEM PROTEGIDA' : 'REVISAR PERCENTUAIS';
  health.classList.toggle('warning', !valid);
  renderBudgetDocuments(calc);
  renderLeadSelector();
  renderProject();
  if (renderTeamCards) renderTeam();
}

function setText(id, value) { const element = document.getElementById(id); if (element) element.textContent = value; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char])); }
function persistAndRender(renderTeamCards = true) {
  localStorage.setItem('cria-price-studio-v2', JSON.stringify({ ...state, step: undefined, urgency: undefined }));
  const status = document.getElementById('saveStatus');
  status.textContent = 'Salvo agora';
  clearTimeout(window.saveTimer);
  window.saveTimer = setTimeout(() => status.textContent = 'Alterações salvas neste dispositivo', 1200);
  render(renderTeamCards);
}

document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.go)));
document.getElementById('headerBudget').addEventListener('click', () => goTo(4));
document.getElementById('addMember').addEventListener('click', () => {
  const id = Math.max(0, ...state.team.map(member => member.id)) + 1;
  state.team.push({ id, name: 'Nova pessoa', role: 'Função no projeto', hours: 10, rate: 145 });
  persistAndRender();
});
document.getElementById('addScene').addEventListener('click', () => {
  const id = Math.max(0, ...state.scenes.map(scene => scene.id)) + 1;
  state.scenes.push({ id, duration: 20 });
  persistAndRender();
});
document.getElementById('removeScene').addEventListener('click', () => {
  if (state.scenes.length <= 1) return;
  state.scenes.pop();
  persistAndRender();
});
document.querySelectorAll('[data-realism]').forEach(button => button.addEventListener('click', () => {
  state.realism = button.dataset.realism;
  persistAndRender();
}));
document.querySelectorAll('[data-quality]').forEach(button => button.addEventListener('click', () => {
  state.quality = button.dataset.quality;
  persistAndRender();
}));
document.querySelectorAll('[data-freedom]').forEach(button => button.addEventListener('click', () => {
  state.freedom = button.dataset.freedom;
  persistAndRender();
}));
document.querySelectorAll('[data-budget-view]').forEach(button => button.addEventListener('click', () => setBudgetView(button.dataset.budgetView)));
document.getElementById('printInternalBudget').addEventListener('click', () => printBudget('internal'));
document.getElementById('printExternalBudget').addEventListener('click', () => printBudget('external'));

renderLeadSelector();
bindStateFields();
document.getElementById('deliveryDate').min = localDateValue();
render();
const printPreview = new URLSearchParams(window.location.search).get('print');
if (['internal', 'external'].includes(printPreview)) document.body.classList.add(`print-${printPreview}`);
