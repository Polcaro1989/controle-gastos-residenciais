<p align="center">
  <img src="docs/images/readme-logo.png" alt="Controle de Gastos Residenciais" width="180" />
</p>

# Controle de Gastos Residenciais

Sistema full stack com backend em .NET 8, frontend em React + TypeScript e persistência em SQLite.

## Visão geral

O projeto entrega:

- cadastro de pessoas com criação, edição, exclusão e listagem;
- cadastro de categorias com criação e listagem;
- cadastro de transações com criação e listagem;
- relatório de totais por pessoa;
- relatório de totais por categoria;
- persistência local sem depender de banco externo.

## Stack

### Backend

- C#
- .NET 8
- ASP.NET Core Web API
- Entity Framework Core 8
- SQLite
- Swagger
- xUnit

### Frontend

- React 18
- TypeScript
- Vite 5
- Tailwind CSS 4
- SweetAlert2

### Infra

- Docker
- Docker Compose
- Nginx para servir o frontend em container

## Estrutura do repositório

```text
ControleGastosResidenciais.sln
README.md
index.txt
docker-compose.yml

backend/
  ControleGastos.Api/
    Contracts/
    Controllers/
    Data/
    Models/
    Seeders/
    Program.cs
    appsettings.json
    ControleGastos.Api.csproj
    Dockerfile
  ControleGastos.Api.Tests/
    ApiInfoControllerTests.cs
    DemoDataSeederTests.cs
    InMemoryTestDatabaseFactory.cs
    PeopleControllerTests.cs
    ReportsControllerTests.cs
    TestDatabaseFactory.cs
    TransactionsControllerTests.cs
    ControleGastos.Api.Tests.csproj

frontend/
  public/
  src/
    App.tsx
    api.ts
    main.tsx
    styles.css
    types.ts
  Dockerfile
  index.html
  nginx.conf
  package.json
  vite.config.ts

docs/
  backend-api.md
  images/
```

## Requisitos

Fluxo recomendado:

- Docker Desktop
- Docker Compose

Fluxo local sem containers:

- .NET SDK 8
- Node.js 20+
- npm

## Como rodar

### Docker

Na raiz do repositório:

```bash
docker compose up -d --build
```

Acessos:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8080/api`
- Swagger: `http://localhost:8080/swagger`

### Local

Backend:

```bash
dotnet run --project backend/ControleGastos.Api --urls http://localhost:8080
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

URL do frontend em desenvolvimento:

- `http://localhost:5173`

O Vite faz proxy de `/api` para `http://localhost:8080` por padrão.

Se a API estiver em outra porta no desenvolvimento:

PowerShell:

```powershell
$env:VITE_API_PROXY_TARGET="http://localhost:8081"
npm run dev
```

Bash:

```bash
VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev
```

### Dados de demonstração

Local:

```bash
dotnet run --project backend/ControleGastos.Api -- seed-demo-data
```

Docker:

```bash
docker compose run --rm api seed-demo-data
```

O seeder:

- cria 10 categorias;
- cria 8 pessoas;
- cria 34 transações;
- não duplica dados se a base já estiver populada.

Para recriar a base do zero no fluxo Docker:

```bash
docker compose down -v
docker compose up -d --build
```

## Testes e validação

Hoje a suíte automatizada do repositório está no backend.

Executar testes com .NET instalado:

```bash
dotnet test ControleGastosResidenciais.sln
```

Executar testes com Docker:

```bash
docker run --rm -v ${PWD}:/src -w /src mcr.microsoft.com/dotnet/sdk:8.0 dotnet test ControleGastosResidenciais.sln
```

Validação rápida do frontend:

```bash
cd frontend
npm run build
```

No momento, o frontend não possui suíte automatizada própria no repositório.

## Backend

### Papel da API

O backend expõe:

- `GET /api`
- `GET/POST/PUT/DELETE /api/people`
- `GET/POST /api/categories`
- `GET/POST /api/transactions`
- `GET /api/reports/people-totals`
- `GET /api/reports/category-totals`

As responsabilidades principais estão distribuídas assim:

- `Contracts/`: modelos HTTP de entrada e saída;
- `Controllers/`: borda HTTP e aplicação das regras;
- `Data/`: `DbContext` e inicialização do banco;
- `Models/`: entidades e enums;
- `Seeders/`: carga manual de dados de demo;
- `ControleGastos.Api.Tests/`: testes automatizados.

### Configuração e startup

O `Program.cs`:

- registra controllers;
- serializa enums como texto no JSON;
- habilita Swagger;
- configura CORS para `http://localhost:3000` e `http://localhost:5173`;
- normaliza o caminho do SQLite;
- registra o `ControleGastosDbContext`;
- inicializa o banco com `EnsureCreated`;
- roda o seeder quando a aplicação sobe com `seed-demo-data`.

O `appsettings.json` define:

- `ConnectionStrings:DefaultConnection`: `Data Source=data/controle-gastos.db`
- `Cors:AllowedOrigins`: origens do frontend local

### Persistência

O projeto usa SQLite com arquivo físico.

Local:

- `backend/ControleGastos.Api/data/controle-gastos.db`

Docker:

- volume `sqlite_data`

Não há necessidade de banco externo, senha, `.env` ou migração manual para subir o sistema pela primeira vez.

### Modelo de domínio

#### Pessoa

Campos:

- `Id`
- `Name`
- `Age`

Regras:

- `Id` gerado automaticamente;
- `Name` obrigatório com limite de 200 caracteres;
- `Age` validada entre 0 e 130.

#### Categoria

Campos:

- `Id`
- `Description`
- `Purpose`

Regras:

- `Id` gerado automaticamente;
- `Description` obrigatória com limite de 400 caracteres;
- `Purpose` aceita `Expense`, `Income` ou `Both`.

#### Transação

Campos:

- `Id`
- `Description`
- `Amount`
- `Type`
- `CategoryId`
- `PersonId`
- `CreatedAtUtc`

Regras:

- `Id` gerado automaticamente;
- `Description` obrigatória com limite de 400 caracteres;
- `Amount` positivo;
- `Type` aceita `Expense` ou `Income`;
- `PersonId` e `CategoryId` precisam existir.

### Regras de negócio

- ao excluir uma pessoa, as transações dela são removidas em cascata;
- menores de 18 anos podem registrar apenas despesas;
- categorias só podem ser usadas em transações compatíveis com sua finalidade;
- os relatórios por pessoa listam todas as pessoas, mesmo sem transações;
- o relatório opcional por categoria também foi implementado;
- os totais gerais são calculados a partir dos totais consolidados.

### Endpoints por área

Resumo da API:

- `GET /api`

Pessoas:

- `GET /api/people`
- `GET /api/people/{id}`
- `POST /api/people`
- `PUT /api/people/{id}`
- `DELETE /api/people/{id}`

Categorias:

- `GET /api/categories`
- `POST /api/categories`

Transações:

- `GET /api/transactions`
- `POST /api/transactions`

Relatórios:

- `GET /api/reports/people-totals`
- `GET /api/reports/category-totals`

### Testes do backend

A pasta `backend/ControleGastos.Api.Tests` cobre:

- resumo da API base;
- exclusão em cascata ao remover pessoa;
- bloqueio de receita para menor de idade;
- bloqueio de categoria incompatível;
- persistência de transação válida;
- relatório por pessoa com total geral;
- relatório por categoria com total geral;
- execução idempotente do seeder.

## Frontend

### Organização da aplicação

Arquivos principais:

- `src/main.tsx`: bootstrap do React;
- `src/App.tsx`: tela principal e fluxo da interface;
- `src/api.ts`: camada de acesso HTTP via `fetch`;
- `src/types.ts`: contratos TypeScript;
- `src/styles.css`: identidade visual global;
- `vite.config.ts`: configuração do servidor dev e proxy;
- `nginx.conf`: proxy da API no container final.

### Como a interface funciona

O frontend foi concentrado em uma SPA com quatro seções:

- pessoas;
- categorias;
- transações;
- relatórios.

O `App.tsx` centraliza:

- listas de pessoas, categorias e transações;
- relatório por pessoa;
- relatório por categoria;
- estado dos formulários;
- carregamento inicial;
- estado de envio;
- mensagens de erro;
- controle do menu lateral mobile.

No carregamento inicial, a aplicação busca em paralelo:

- pessoas;
- categorias;
- transações;
- totais por pessoa;
- totais por categoria.

Depois de criar, editar ou excluir algo, a tela recarrega os dados para manter todas as seções sincronizadas com a API.

### Camada de API

`src/api.ts` concentra:

- URL base da API;
- envio de `Content-Type: application/json`;
- serialização dos payloads;
- leitura de erros retornados pela API;
- retorno tipado para o restante da interface.

Operações disponíveis:

- listar, criar, atualizar e excluir pessoas;
- listar e criar categorias;
- listar e criar transações;
- obter relatórios por pessoa e por categoria.

### Regras refletidas no frontend

O backend continua sendo a fonte final das regras, mas a interface antecipa validações importantes:

- se a pessoa selecionada for menor de idade, o tipo da transação fica restrito a `Expense`;
- a lista de categorias é filtrada conforme o tipo da transação;
- categorias inválidas são removidas da seleção atual;
- o parser de valor aceita formatos comuns em pt-BR e en-US, como `5000`, `5.000`, `5,000`, `5.000,00` e `5000.00`.

### Estilo e experiência

`src/styles.css` define:

- tokens de cor;
- fontes de corpo e destaque;
- fundo com gradientes;
- overrides globais para o visual do Tailwind;
- animações de entrada;
- customização de SweetAlert2.

O frontend foi desenhado como tela única com navegação lateral, cards de resumo, estados vazios, toasts de sucesso e modais de confirmação.

### Vite, variáveis e build

Variáveis principais:

- `VITE_API_PROXY_TARGET`: alvo da API no dev server do Vite;
- `VITE_API_BASE_URL`: base usada pelo build do frontend em container;
- `VITE_HMR_CLIENT_PORT`: ajuste de HMR em container;
- `VITE_HMR_HOST`: ajuste do host de HMR;
- `CHOKIDAR_USEPOLLING`: ativa polling em ambientes de container.

O `vite.config.ts`:

- expõe o servidor em `0.0.0.0`;
- fixa a porta `5173`;
- aplica proxy de `/api` para o backend;
- suporta HMR ajustável para rodar em container.

No container final:

- o `Dockerfile` gera o build estático;
- o `nginx.conf` serve a SPA;
- `/api/` é redirecionado para `http://api:8080/api/`.

## Observações finais

- O projeto não depende de arquivo `.env`.
- O banco local fica em `backend/ControleGastos.Api/data/controle-gastos.db`.
- No Docker, o banco fica persistido no volume `sqlite_data`.
- O `docs/backend-api.md` foi mantido apenas como apontador para este documento centralizado.
