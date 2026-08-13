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
- Custo protegido = equipe + tecnologia + fornecedores + contingência.
- Preço de produção = custo protegido ÷ percentual restante após margem, impostos e comissão.
- Direitos e urgência são adicionais comerciais.
- Cada integrante recebe pelo trabalho realizado, calculado por horas × valor/hora.
- A comissão comercial é paga somente ao integrante selecionado como responsável pelo lead.
- Depois dos custos, impostos e comissão, todo o resultado líquido permanece no caixa da Cria Frames.
