# Relatório do Projeto — Adriano's Closet

*Escrito por mim, Adriano, para explicar (a mim próprio e a quem ler) tudo o que foi feito neste projeto e porquê.*

---

## 1. O que é este projeto

O "Adriano's Closet" é a loja online que estou a construir: um site de sapatilhas (corrida, treino, futebol, estilo) com páginas de apresentação, um catálogo de produtos, um carrinho de compras, um checkout, e uma área de administração onde eu (o admin) consigo gerir os produtos e ver as encomendas.

Começou como um site simples, feito só com HTML, CSS e JavaScript, a guardar os dados no `localStorage` do browser. Nesta fase do projeto, mudei a forma como os dados são guardados: em vez de ficarem presos ao browser de cada visitante, passaram a ficar numa base de dados real, na nuvem, gerida pelo Supabase (que por baixo usa Postgres). Também acrescentei um sistema de login para proteger a área de administração.

---

## 2. Capítulo especial: por que mudei do `localStorage` para o Supabase/Postgres

Esta foi a mudança mais importante desta fase, por isso mereceu um capítulo só para ela.

### 2.1 Como funcionava antes (`localStorage`)

No início, os 12 produtos da loja estavam escritos diretamente dentro do ficheiro `js/db.js`, como uma lista fixa no código. Quando eu "editava" ou "apagava" um produto no admin, isso não mudava o código — ficava guardado no `localStorage` do browser, que é uma espécie de "caderno" que cada browser mantém só para si.

Isto tinha vários problemas que percebi ao pensar nisto como um projeto a sério:

1. **Cada pessoa via uma coisa diferente.** Se eu editasse um produto no meu computador, essa alteração ficava só no meu `localStorage`. Um cliente que abrisse o site noutro computador continuava a ver os dados antigos, porque o `localStorage` dele era outro "caderno", completamente separado do meu.
2. **Não havia clientes nem encomendas a sério.** Como não existia uma base de dados partilhada, uma "compra" no site não ficava registada em lado nenhum que eu pudesse consultar depois — ou ficava só no `localStorage` do próprio cliente, o que não me servia de nada como dono da loja.
3. **Qualquer pessoa podia mexer nos dados.** O `localStorage` é editável por qualquer pessoa que abra as ferramentas de developer do browser (F12). Não havia autenticação nenhuma a proteger o admin — bastava ir à página e mexer.
4. **Não escalava.** Isto funciona para uma demonstração, mas uma loja a sério precisa que os dados sejam os mesmos para toda a gente, ao mesmo tempo, e que sobrevivam mesmo que o cliente limpe o browser ou mude de computador.

### 2.2 Como funciona agora (Supabase / Postgres)

O Supabase é um serviço que me dá, de forma gratuita para projetos pequenos, uma base de dados Postgres "a sério" na nuvem, já com um sistema de autenticação de utilizadores e uma camada de segurança (RLS, explico já a seguir) prontos a usar — sem eu ter de montar um servidor próprio.

Postgres é o "motor" que guarda os dados em tabelas, como se fossem folhas de cálculo relacionadas entre si: uma tabela de produtos, uma de categorias, uma de clientes, uma de encomendas, etc. Ao contrário do `localStorage`, esta base de dados está sempre no mesmo sítio, na internet, e é a mesma para toda a gente que visita o site.

Isto resolveu os quatro problemas de cima:

1. **Dados partilhados por todos.** Agora quando eu adiciono ou edito um produto no admin, isso fica gravado no Supabase, e aparece logo igual para qualquer pessoa que abra o site, em qualquer computador.
2. **Encomendas e clientes reais.** Cada compra cria um registo na tabela `customers` e outro em `orders` (com os artigos em `order_items`), que eu consigo consultar no admin a qualquer momento.
3. **Proteção a sério.** Só quem faz login como admin (autenticado através do Supabase Auth) é que pode criar, editar ou apagar produtos, ou ver a lista de clientes e encomendas. Expliquei isto com mais detalhe no ponto 2.3.
4. **Preparado para crescer.** Se um dia a loja tiver mesmo clientes, a base de dados aguenta muitos pedidos ao mesmo tempo, coisa que o `localStorage` nunca conseguiria.

### 2.3 A parte da segurança: Row Level Security (RLS)

Como o site é feito só com HTML/JS que corre no browser de quem visita, a "chave" usada para ligar ao Supabase (a `anon key`, que está em `js/config.js`) fica visível a qualquer pessoa que veja o código da página. Isto pareceu-me assustador ao início — se a chave é pública, o que impede alguém de a usar para apagar tudo?

A resposta é o **RLS (Row Level Security)**, uma funcionalidade do Postgres que liguei a todas as tabelas no ficheiro `supabase_setup.sql`. Funciona assim: primeiro "tranco" todas as tabelas (`enable row level security`), o que por si só bloqueia tudo, até para mim. Depois escrevo "políticas" (`create policy`) que dizem exatamente o que cada tipo de utilizador pode fazer:

- **Categorias e produtos:** qualquer pessoa pode *ler* (para a loja aparecer a toda a gente), mas só um utilizador com sessão de login válida (eu, o admin) pode criar, editar ou apagar.
- **Clientes e encomendas:** qualquer pessoa pode *criar* um registo (para o checkout funcionar sem exigir login ao cliente), mas só o admin consegue *ler* a lista completa — assim ninguém vê moradas e emails de outras pessoas.
- **Newsletter e candidaturas de emprego:** mesma lógica — todos podem escrever (inscrever-se/candidatar-se), só o admin lê a lista.

Ou seja, mesmo que a chave pública seja visível, ela sozinha não dá poder nenhum de ler ou destruir dados sensíveis — isso está trancado a nível da própria base de dados, não apenas escondido no código.

### 2.4 O login do admin

Antes não havia login nenhum: bastava abrir `admin.html`. Agora criei `login.html` e `js/auth.js`, que usam o sistema de autenticação do Supabase (Supabase Auth). No fundo, existe um "utilizador" registado no Supabase (com um email interno, `adriano@aminhaloja.pt`) que eu uso para entrar, mas simplifiquei a experiência para escrever apenas "adriano" como utilizador, e por trás o código troca isso pelo email real antes de pedir login ao Supabase. Sem sessão válida, `admin.html` redireciona automaticamente para `login.html` (função `requireAdminSession`).

---

## 3. Explicação de cada ficheiro do projeto

### Páginas HTML

- **`index.html`** — A página principal da loja: mostra o herói (banner de topo), os filtros de categorias, a grelha de produtos (carregada agora do Supabase em vez de estar escrita à mão), o carrinho de compras e o checkout.
- **`login.html`** — Página nova, de login do admin. Tem um formulário simples de utilizador/password e, agora, também um link "← Voltar à loja" para quem chegar aqui sem querer não ficar preso.
- **`admin.html`** — Painel de administração: estatísticas rápidas (nº de produtos, encomendas, receita, stock), tabela de produtos com opções de editar/eliminar, e um botão para adicionar produtos novos. Está protegido — só abre com sessão de admin válida.
- **`ajuda.html`, `carreiras.html`, `sobre-nos.html`, `sustentabilidade.html`** — Páginas institucionais/informativas do site (ajuda ao cliente, candidaturas de emprego, sobre a marca, sustentabilidade). Não sofreram alterações de fundo nesta fase.

### JavaScript

- **`js/config.js`** — Guarda a ligação ao meu projeto Supabase: o URL do projeto e a chave pública (`anon key`). É o "endereço e chave de entrada" que todo o resto do código usa para falar com a base de dados.
- **`js/db.js`** — A camada que fala diretamente com o Supabase: buscar produtos (`getProducts`, `getProduct`), guardar ou editar um produto (`saveProduct`), "apagar" um produto sem o destruir de vez (`deleteProduct`, explico a seguir porquê), gravar uma encomenda completa (`saveOrder`) e listar encomendas (`getOrders`). Antes desta mudança, este ficheiro lia e escrevia no `localStorage`; agora faz pedidos à base de dados Postgres.
- **`js/store.js`** — A lógica da loja em si: mostrar produtos filtrados por categoria, abrir a ficha de um produto, gerir o carrinho (adicionar, remover, alterar quantidades) e o processo de checkout, incluindo a simulação de pagamento e a criação da encomenda através de `DB.saveOrder`.
- **`js/admin.js`** — As operações do painel de administração: mostrar as estatísticas, listar produtos numa tabela, abrir o formulário para criar/editar um produto, validar os dados (ex: o preço original tem de ser maior que o preço atual) e eliminar produtos. Está tudo protegido por `requireAdminSession()` do `auth.js`.
- **`js/auth.js`** — O sistema de login: verifica o utilizador/password introduzidos, faz login através do Supabase Auth, faz logout, e verifica se existe uma sessão ativa antes de deixar entrar no admin.

### Base de dados

- **`supabase_setup.sql`** — O "guião" que construí para criar a base de dados de raiz no Supabase: cria as 7 tabelas (`categories`, `products`, `customers`, `orders`, `order_items`, `newsletter_subscribers`, `job_applications`), ativa e configura o RLS (as políticas de segurança explicadas no ponto 2.3), e insere os dados iniciais (as 4 categorias e os 12 produtos que já tinha). É o ficheiro que corri uma única vez no SQL Editor do Supabase para preparar tudo.

### Outros

- **`css/style.css`** — Toda a folha de estilos visuais do site (cores, tipografia, layout das grelhas, animações do carrinho, etc.). Recebeu pequenos ajustes ao longo do tempo (por exemplo, o espaçamento do botão do hero) mas não faz parte da mudança para o Supabase.
- **`.gitignore`** — Lista de ficheiros que o Git deve ignorar e nunca enviar para o GitHub (por exemplo, ficheiros de configuração locais e, agora, os três ficheiros de rascunho de planeamento que já não preciso de manter no histórico do projeto).

---

## 4. Ficheiros de planeamento removidos

Os ficheiros `explicacao_supabase_setup.txt`, `instrucoes_finais.txt` e `planeamento_basededados.txt` foram usados como apontamentos de trabalho enquanto planeava e implementava a mudança para o Supabase (o segundo, em particular, continha os passos manuais que eu próprio tinha de seguir no painel do Supabase, incluindo a password inicial do admin). Serviram o seu propósito e, como o conteúdo relevante ficou resumido e explicado aqui neste relatório, foram removidos do projeto e passaram a estar listados no `.gitignore` para não voltarem a ser enviados por engano.

---

## 5. Resumo em uma frase

Nesta fase, tirei a loja da "brincadeira" de um `localStorage` só meu e liguei-a a uma base de dados Postgres a sério, no Supabase, com políticas de segurança (RLS) que protegem os dados sensíveis, e criei um sistema de login para que só eu, como admin, consiga gerir os produtos e ver as encomendas.
