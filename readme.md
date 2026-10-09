# AUTM02 – Automação E2E com Playwright

Projeto de automação de testes End-to-End (E2E) utilizando **Playwright + TypeScript**, aplicando o padrão **Page Object Model (POM)** para validação de fluxos no site demo do nopCommerce.

**URL testada:** [https://demo.nopcommerce.com/build-your-own-computer](https://demo.nopcommerce.com/build-your-own-computer)

---

## 1. Objetivo do Projeto

Automatizar cenários funcionais do fluxo de compra garantindo:

* Configuração correta de produto  
* Adição ao carrinho  
* Fluxo de wishlist  
* Processo de checkout  
* Validação de campos obrigatórios  
* Validação de quantidade inválida  
* Remoção de itens do carrinho  

O projeto valida comportamentos positivos e negativos, cobrindo regras de negócio essenciais de um e-commerce.

---

## 2. Por que utilizar Playwright?

O Playwright foi escolhido pelos seguintes motivos:

* **Alta performance** e execução rápida  
* **Suporte nativo** a múltiplos navegadores (Chromium, Firefox e WebKit)  
* **API moderna** e intuitiva  
* **Excelente integração** com CI/CD  

---

## 3. Por que utilizar TypeScript?

O TypeScript foi utilizado para:

* **Tipagem estática:** Reduz erros em tempo de desenvolvimento.  
* **Melhor autocomplete** e produtividade.  
* **Código mais organizado** e escalável.  
* **Padronização profissional** de projetos modernos.  

---

## 4. Arquitetura do Projeto

Estrutura organizada seguindo boas práticas e separação de responsabilidades:

AUTM02/
│
├── pages/
│   └── HomePage.ts
│
├── tests/
│   └── build.spec.ts
│
├── playwright.config.ts
├── package.json
├── package-lock.json
└── .gitignore
## 5. Padrão Utilizado: Page Object Model (POM)
O projeto utiliza o padrão Page Object Model, que tem como objetivo:

- Separar lógica de negócio da lógica de teste.
- Melhorar a manutenção do código.
- Facilitar reutilização de métodos e aumentar a legibilidade.

Exemplo de uso no teste:

const home = new HomePage(page);
await home.navigate();
await home.build();
await home.addToCart();

## 6. Abordagem BDD
Os cenários estão documentados em formato BDD (Gherkin) para melhorar o entendimento funcional, embora a implementação seja feita diretamente com Playwright Test (sem Cucumber).

## 7. Cenários Automatizados

**TC01 – Configurar produto e adicionar ao carrinho**
Given que o usuário acessa a página do produto
When seleciona todos os atributos obrigatórios
And clica em "Add to cart"
Then o sistema deve exibir a mensagem de sucesso

**TC02 – Configurar produto e ir até checkout via Wishlist**
Given que o usuário configura o produto corretamente
When adiciona o produto à Wishlist
And acessa a Wishlist e adiciona o item ao carrinho
And aceita os termos de serviço e clica em Checkout
Then o sistema deve redirecionar para a página de checkout

**TC03 – Tentar adicionar sem selecionar atributo obrigatório**
Given que o usuário está na página do produto
When clica em "Add to cart" sem selecionar os atributos
Then o sistema deve exibir uma mensagem de erro

**TC04 – Quantidade negativa (-1)**
Given que o usuário configurou o produto corretamente
When informa a quantidade "-1" e clica em "Add to cart"
Then o sistema deve exibir a mensagem "Quantity should be positive"

**TC05 – Quantidade texto ("abc")**
Given que o usuário configurou o produto corretamente
When informa a quantidade "abc" e clica em "Add to cart"
Then o sistema deve exibir a mensagem "Quantity should be positive"

**TC06 – Quantidade inválida (0)**
Given que o usuário configurou o produto corretamente
When informa a quantidade "0" e clica em "Add to cart"
Then o sistema deve exibir a mensagem "Quantity should be positive"

**TC07 – Remoção de produtos do Carrinho**
Given que o usuário adicionou um produto ao carrinho
When acessa o carrinho e remove todos os produtos
Then o sistema deve exibir a mensagem de carrinho vazio

## 8. Como Executar

1. Instale as dependências:
   **npm install**
   **npx playwright install**

Execute os testes:
    **npx playwright test**

Para ver o relatório de testes:
    **npx playwright show-report**

Para checar os tipos TypeScript (mesmo gate rodado no CI):
    **npm run typecheck**

---

## 9. Gate de Qualidade (CI)

O workflow `.github/workflows/playwright.yml` roda em todo push/PR para `main`/`master` com três jobs:

* **typecheck** — valida o TypeScript do projeto (`tsc --noEmit`). Rápido, determinístico, **gate obrigatório**.
* **assert-quality-audit** — audita os próprios testes (ver seção 10 abaixo). Rápido, determinístico, não depende de nenhum site externo, **gate obrigatório**.
* **e2e** — instala os browsers do Playwright e roda a suíte completa (Chromium, Firefox, WebKit) contra o site demo real do nopCommerce. **Não bloqueia o workflow** (`continue-on-error: true`): é best-effort, não um gate real.

Este projeto não tem testes de API/backend — é 100% E2E de UI, então não há um gate separado de backend.

### Por que o `e2e` não é um gate obrigatório

O site demo (`demo.nopcommerce.com`) é um serviço público de terceiros, fora do controle deste repositório. Em 08/10/2026, confirmamos de 5 formas diferentes que ele bloqueia automação atrás de proteção anti-bot da Cloudflare: headless, headed, com plugin stealth, com user-agent de navegador real, e esperando 30s antes de interagir — todas bloqueadas. Ou seja, o job falha por causa da proteção do site, não por bug do código deste repo nem dos testes.

A correção de causa raiz correta seria rodar uma instância própria do nopCommerce (self-host) dentro do próprio CI, eliminando a dependência do terceiro. Investigamos essa opção e descartamos por desproporção de escopo:

* O nopCommerce não tem imagem Docker oficial. As imagens que existem no Docker Hub são de terceiros, não oficiais, descontinuadas (a mais conhecida está presa na tag `release-4.20`, de ~7 anos atrás) e explicitamente marcadas como "não use em produção".
* O nopCommerce não roda sobre SQLite — ele depende de SQL Server, MySQL ou PostgreSQL como banco. Isso significa pelo menos dois containers (app + banco), mais o processo de instalação/migração do schema, mais popular o catálogo com os produtos exatos que os testes esperam (o "Build your own computer" com seus atributos). Nada disso sobe "pronto" — é uma instalação completa de e-commerce rodando dentro do job de CI.
* Para um projeto de portfólio, o custo (tempo de setup, manutenção da imagem, tempo de subida em cada run) é desproporcional ao benefício. O ganho real de QA aqui vem dos gates que já são determinísticos e baratos (`typecheck` e `assert-quality-audit`).

Por isso a escolha foi: **não fingir que o E2E real está testado quando a rede bloqueia o teste**. O job `e2e` continua existindo e rodando a suíte de verdade — ele serve como sinal informativo (se o site estiver acessível e sem bloqueio, ele prova o fluxo de ponta a ponta) — mas não derruba o workflow nem é tratado como critério de aceite. Os gates reais deste repositório são `typecheck` e `assert-quality-audit`.

Se o site demo estiver fora do ar, mudar de layout, ou bloquear a automação atrás de um desafio do Cloudflare ("Performing security verification"), confira o relatório (`playwright-report`) antes de assumir regressão de código — e lembre que, de qualquer forma, isso não derruba o build.

## 10. Auditoria Estática dos Testes (`assert-quality-audit`)

O job `e2e` prova que o site funciona, mas não prova que o TESTE prova alguma coisa. Um teste pode passar sem checar nada — bloco sem nenhum `expect`, ou um `expect` tautológico tipo `expect(x).toBe(x)` ou `expect(true).toBeTruthy()`. Isso é "verde mentiroso": o CI fica verde, mas não protege contra regressão nenhuma.

`scripts/audit-test-quality.ts` varre `tests/**/*.spec.ts` e falha (exit 1) se encontrar:

* um bloco `test(...)`/`it(...)` sem nenhuma chamada `expect(...)` — nem direta, nem indireta através de um método de `pages/*.ts` que por sua vez tenha `expect(...)`. O projeto usa Page Object, então o script entende esse padrão: `TC01` não tem `expect` no corpo do teste, mas chama `checkSuccessMessage()`, que tem — não é um falso positivo.
* um assert tautológico óbvio: os dois lados de `toBe`/`toEqual`/`toStrictEqual` idênticos, ou `expect(true).toBe(true)` / `expect(true).toBeTruthy()`.

Rode localmente com:

    **npm run audit:test-quality**

**Por que esse gate é mais confiável que o `e2e` neste repositório, especificamente:** o `e2e` depende do site de terceiro (`demo.nopcommerce.com`) estar no ar e não bloquear a automação atrás do Cloudflare — coisa que já aconteceu e está documentada na seção 9. Quando isso acontece, o job `e2e` fica vermelho (ou falha de um jeito que não tem nada a ver com o código deste repo), e não dá para confiar nele como sinal de qualidade naquele momento. Já o `assert-quality-audit` só lê arquivos locais (`tests/` e `pages/`) — não abre navegador, não faz requisição de rede, não depende de nenhum serviço externo. Ele roda sempre, com o mesmo resultado, e continua sendo um sinal de qualidade válido mesmo quando o `e2e` está bloqueado pela rede ou pelo site de terceiro.