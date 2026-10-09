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

O workflow `.github/workflows/playwright.yml` roda em todo push/PR para `main`/`master` com dois jobs:

* **typecheck** — valida o TypeScript do projeto (`tsc --noEmit`). Rápido e determinístico.
* **e2e** — instala os browsers do Playwright e roda a suíte completa (Chromium, Firefox, WebKit) contra o site demo real do nopCommerce. Falha o build se qualquer teste falhar.

Este projeto não tem testes de API/backend — é 100% E2E de UI, então não há um gate separado de backend.

**Limitação conhecida:** o site demo (`demo.nopcommerce.com`) é um serviço público de terceiros, fora do controle deste repositório. Ele pode ficar fora do ar, mudar de layout ou, como observado durante esta revisão, bloquear tráfego automatizado atrás de um desafio do Cloudflare ("Performing security verification"), dependendo da rede de onde o teste roda. Se o job `e2e` falhar, confira o relatório (`playwright-report`) antes de assumir regressão de código.