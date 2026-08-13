# Cria Price Studio

Ferramenta interna da Cria Frames para criar orçamentos, proteger a margem da produtora e registrar os pagamentos da equipe.

## Publicar no GitHub Pages

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Escolha a branch **main** e a pasta **/(root)**.
4. Clique em **Save**.

O projeto é estático e não exige instalação ou build. O arquivo `index.html` é a página inicial.

## Rodar localmente

Abra `index.html` no navegador. Os rascunhos ficam salvos apenas no próprio dispositivo através do armazenamento local do navegador.

## Lógica principal

- Custo do trabalho = horas × valor/hora.
- Cada cena aceita entre 15 e 30 segundos; a duração total é a soma das cenas.
- Até 7 dias o prazo é muito urgente; de 8 a 14 dias é urgente; acima disso é normal.
- Cenas acima de 15 segundos são divididas em duas gerações; cenas de 30 segundos usam somente 4K.
- O crédito é calculado pela tabela interna de cada modelo e resolução, multiplicada pelo número de tentativas da complexidade.
- Seedance 2.0 é priorizado para animação e liberdade; Seedance 2.5 para realismo e direção rígida; pedidos equilibrados combinam os dois.
- A estratégia de modelos pode ser substituída manualmente por somente 2.0, somente 2.5 ou uma combinação dos dois.
- O custo variável usa 21 créditos = US$ 1. O acesso Ultra custa R$ 250/mês e é rateado entre os projetos.
- Claude Pro e ChatGPT Plus custam US$ 20/mês cada e são rateados entre os projetos.
- Os pacotes extras disponíveis são US$ 30 (600 cr), US$ 50 (1.000 cr), US$ 90 (1.800 cr), US$ 150 (3.000 cr) e US$ 300 (6.000 cr); o padrão é não comprar créditos extras.
- Projetos urgentes usam somente Higgsfield.
- A reserva de alimentação de R$ 250/mês fica ativa por padrão e é rateada entre os projetos, podendo ser limitada a urgências ou desativada.
- A complexidade automática prioriza o realismo: animação tende a baixa, híbrido a média e fotorrealismo a alta; qualidade, duração e número de cenas podem elevá-la.
- Custo protegido = equipe + tecnologia + fornecedores + contingência.
- Preço de produção = custo protegido ÷ percentual restante após margem, impostos e comissão.
- Direitos e urgência são adicionais comerciais.
- Cada integrante recebe pelo trabalho realizado, calculado por horas × valor/hora.
- A comissão comercial é paga somente ao integrante selecionado como responsável pelo lead.
- Depois dos custos, impostos e comissão, todo o resultado líquido permanece no caixa da Cria Frames.
