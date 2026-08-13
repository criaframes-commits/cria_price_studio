const fs = require('fs');
const source = fs.readFileSync('app.js', 'utf8');
const calculationSource = source.slice(0, source.indexOf('function renderLeadSelector'));
const loadCalculator = new Function('localStorage', `${calculationSource}\nreturn { state, calculate, dateAfter, extraCreditRecommendation };`);
const { state, calculate, dateAfter, extraCreditRecommendation } = loadCalculator({ getItem: () => null });

function close(actual, expected, label) {
  if (Math.abs(actual - expected) > 0.01) throw new Error(`${label}: esperado ${expected}, obtido ${actual}`);
}

function assert(condition, label) {
  if (!condition) throw new Error(label);
}

state.projectsMonth = 1;
state.higgsExtra = 0;
let calc = calculate();
assert(calc.profile.estimatedCredits === 2880, 'Créditos do projeto padrão');
assert(calc.plannedCreditsPerProject === 3000, 'Cota para um projeto');
assert(calc.excessCredits === 0, 'Projeto padrão cabe na cota mensal única');
close(calc.labor, 17360, 'Custo da equipe');
close(calc.subscriptionsAllocated, 468.4, 'Assinaturas mensais para um projeto');
close(calc.technology, calc.subscriptionsAllocated + calc.excessCreditProvisionBrl, 'Tecnologia sem duplicidade');
close(calc.overtimeFood, 250, 'Reserva mensal de alimentação');
close(calc.protectedCost, calc.baseCost * 1.1, 'Contingência');
close(calc.commissionValue, calc.finalPrice * 0.05, 'Comissão comercial');
close(calc.deductions, calc.finalPrice * 0.11, 'Impostos e comissão');
close(calc.result, calc.finalPrice - calc.deductions - calc.protectedCost, 'Resultado líquido');
close(calc.team.reduce((sum, member) => sum + member.work, 0), calc.labor, 'Pagamentos pelo trabalho');
close(calc.team.reduce((sum, member) => sum + member.total, 0), calc.labor + calc.commissionValue, 'Trabalho e comissão da equipe');
close(calc.realMargin, 30, 'Margem-alvo sem adicionais comerciais');

state.projectsMonth = 3;
calc = calculate();
assert(calc.plannedCreditsPerProject === 1000, 'Cota dividida entre três projetos');
assert(calc.excessCredits === 1880, 'Excesso sobre a cota dividida');
close(calc.overtimeFood, 250 / 3, 'Alimentação dividida entre projetos');

state.projectsMonth = 1;
state.higgsExtra = 90;
calc = calculate();
assert(calc.monthlyHiggsCredits === 4800, 'Pacote de 1.800 créditos');
assert(calc.excessCredits === 0, 'Pacote extra cobre o projeto padrão');
close(calc.higgsMonthlyBrl, 250 + 90 * 5.2 * 1.05, 'Plano Higgsfield com pacote extra');

state.higgsExtra = 0;
state.realism = 'photoreal';
calc = calculate();
assert(calc.profile.estimatedCredits === 4320, 'Uso alto em um único projeto');
assert(calc.excessCredits === 1320, 'Excesso existe mesmo com somente um projeto');
assert(extraCreditRecommendation(calc).includes('US$ 90'), 'Recomendação do menor pacote suficiente');

state.realism = 'hybrid';
state.deliveryDate = dateAfter(7);
calc = calculate();
assert(calc.profile.urgency === 30, 'Urgência de até sete dias');
close(calc.finalPrice, calc.productionPrice * 1.3, 'Adicional de muita urgência');

state.deliveryDate = dateAfter(21);
state.rights = 1.35;
calc = calculate();
close(calc.finalPrice, calc.productionPrice * 1.35, 'Adicional de direitos de uso');

state.rights = 1;
state.leadMemberId = 0;
calc = calculate();
assert(calc.commissionValue === 0, 'Sem comissão quando não há responsável pelo lead');
close(calc.realMargin, 30, 'Margem sem comissão comercial');

console.log('Auditoria dos cálculos concluída com sucesso.');
