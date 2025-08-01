# Sistema de Registro de Ponto

Um sistema web de registro de ponto desenvolvido com Ionic Angular e Supabase, oferecendo uma solução moderna para controle de presença de funcionários com suporte a funcionamento offline.

## Atualizações Recentes (Julho 2025)

- 🔧 **Correção de erro 406 (Not Acceptable) na API Supabase**:

  - Corrigido problema de headers HTTP na comunicação com Supabase
  - Implementada detecção automática e recuperação de erros 406
  - Adicionado diagnóstico de conexão para tabelas problemáticas
  - Melhorada limpeza de dados para conformidade com esquema do banco

- ✅ **Registro de ponto offline corrigido**:

  - Corrigido problema de "funcionário não encontrado" ao registrar presença offline
  - Implementado lookup de funcionários via cache local quando offline
  - Melhorias nas mensagens de erro e feedback ao usuário durante operações offline

- 🔄 **Sistema de sincronização aprimorado**:

  - Correção de erros na sincronização com o Supabase, garantindo que apenas campos válidos sejam enviados ao servidor
  - Timeout em operações de sincronização para evitar que o sistema fique travado
  - Melhor tratamento de erros e recuperação automática de falhas
  - Detecção e correção de sincronizações travadas

- 🏗️ **Arquitetura Angular atualizada**: Migração para o padrão de componentes standalone do Angular, mantendo compatibilidade com módulos legados.

- ⚙️ **Gestão de dados melhorada**: Implementação de limpeza de dados antes da sincronização para prevenir erros de esquema no banco de dados.

- 🔍 **Tratamento de erros aprimorado**: Melhor gestão de erros durante sincronização e remoção automática de itens problemáticos após 3 tentativas.

## Funcionalidades

- ✅ Registro de ponto público (entrada/saída)
- 🔐 Área administrativa protegida
- 👥 Cadastro e gestão de funcionários
- 📊 Relatórios de presença
- ⚙️ Configurações de horário de trabalho
- 🎯 Múltiplos métodos de autenticação (código, face, digital, QR Code)
- 🔄 Sincronização offline-first (funciona sem internet)
- 💾 Armazenamento local persistente
- 🚀 Sistema de fila de sincronização com timeout e retry

## Tecnologias Utilizadas

- Ionic Framework 7
- Angular 16 (com suporte a componentes standalone)
- Supabase (Backend as a Service)
- TypeScript
- SCSS
- LocalStorage (cache offline)
- Service Workers (suporte offline)

## Arquitetura Offline-First

O sistema utiliza uma arquitetura offline-first que permite o funcionamento completo da aplicação mesmo sem conexão com a internet:

1. **Armazenamento Local:**

   - Todos os dados são armazenados localmente (localStorage)
   - Informações de funcionários, presença e horários são mantidos em cache
   - Metadados de sincronização para controle de dados atualizados

2. **Sistema de Sincronização:**

   - Fila de sincronização para operações offline
   - Sincronização automática quando conectado à internet
   - Retry com backoff exponencial em caso de falhas
   - Status visual de sincronização para o usuário
   - Limpeza automática de dados antes do envio ao servidor para prevenir erros de esquema

3. **Estratégias de Cache:**
   - Cache com invalidação baseada em tempo
   - Diferentes estratégias para cada tipo de dado
   - Pré-carregamento de dados essenciais

## Requisitos do Sistema

- Node.js 16+
- NPM 8+
- Ionic CLI 7+
- XAMPP ou outro servidor local
- Conta no Supabase (gratuita)

## Passos para Instalação

1. **Configurar Banco de Dados Supabase**

   ```sql
   -- Criar tabelas necessárias no Supabase SQL Editor
   create table employees (
     id uuid default uuid_generate_v4() primary key,
     name text not null,
     position text not null,
     internal_code text unique not null,
     department text not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   create table attendance (
     id uuid default uuid_generate_v4() primary key,
     employee_id uuid references employees(id),
     date date not null,
     check_in text not null,
     check_out text,
     status text not null,
     late_minutes integer default 0,
     observations text,
     auth_method text not null,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   create table work_schedule (
     id uuid default uuid_generate_v4() primary key,
     start_time text not null,
     end_time text not null,
     work_days integer[] not null,
     late_tolerance integer default 15,
     daily_hours numeric default 8,
     auto_checkout boolean default false,
     require_location boolean default false,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

2. **Clonar e Instalar o Projeto**

   ```bash
   # Clonar o repositório
   git clone [url-do-repositorio]
   cd app-hoje

   # Instalar dependências
   npm install

   # Instalar Ionic CLI globalmente (se necessário)
   npm install -g @ionic/cli
   ```

3. **Configurar Variáveis de Ambiente**

   ```typescript
   // Criar arquivo src/environments/environment.ts
   export const environment = {
     production: false,
     supabaseUrl: "YOUR_SUPABASE_URL",
     supabaseKey: "YOUR_SUPABASE_ANON_KEY",
   };
   ```

4. **Configurar XAMPP**

   - Instalar XAMPP
   - Colocar o projeto na pasta htdocs
   - Iniciar Apache no XAMPP Control Panel

5. **Executar o Projeto**

   ```bash
   # Desenvolvimento local
   ionic serve

   # OU usando XAMPP
   ionic build
   # Acessar http://localhost/app-hoje
   ```

6. **Primeiro Acesso**

   - Acessar a página de login
   - Criar primeiro usuário admin usando o botão "Registrar Admin"
   - Email padrão: admin@sistema.com
   - Senha padrão: 123456
   - Verificar email de confirmação do Supabase

7. **Configurações Iniciais**
   - Fazer login como admin
   - Configurar horário de trabalho em Configurações
   - Cadastrar funcionários
   - Sistema pronto para uso

## Resolução de Problemas

- **Erro de CORS**: Configurar regras de CORS no Supabase
- **Erro de Conexão**: Verificar credenciais do Supabase
- **Erro de Build**: Limpar cache `npm cache clean --force`

## Resolução de Problemas de Sincronização

### Falhas de Sincronização ("X falhas")

Quando você vê uma mensagem como "217 sucesso, 45 falhas" ou "X falhas" no status de sincronização, significa que alguns itens não puderam ser sincronizados com o servidor. Isso pode acontecer por várias razões:

1. **Dados dependentes ausentes no servidor**:

   - Por exemplo, quando uma presença faz referência a um funcionário que não existe no servidor
   - O sistema agora tenta identificar e criar automaticamente esses registros dependentes

2. **Problemas temporários de conexão**:

   - Instabilidade na rede ou no servidor Supabase
   - Timeouts durante a sincronização

3. **Conflitos de dados**:
   - Registros duplicados (mesmo ID)
   - Dados que não correspondem ao esquema do banco

### Como Resolver

O sistema oferece várias opções para lidar com falhas de sincronização:

1. **Sincronização Padrão**: Clique no botão de sincronização (ícone circular) para tentar novamente a sincronização completa.

2. **Opções Avançadas**: Quando houver falhas, um botão de opções (ícone de engrenagem) estará disponível com estas opções:

   - **Sincronização Gradual**: Sincroniza em pequenos lotes, útil para quando há muitos dados pendentes
   - **Sincronizar Funcionários**: Prioriza a sincronização dos dados de funcionários primeiro
   - **Baixar Funcionários**: Atualiza o cache local com os funcionários mais recentes do servidor
   - **Reiniciar Cliente**: Reinicializa a conexão com o Supabase para resolver problemas de autenticação

3. **Botão Detalhes**: Ao lado do contador de falhas, clique em "Detalhes" para obter informações e orientações sobre o problema específico.

### Prevenindo Problemas

Para minimizar falhas de sincronização:

- Mantenha o aplicativo atualizado com a última versão
- Sincronize regularmente quando tiver conexão estável à internet
- Evite acúmulo muito grande de dados offline (sincronize sempre que possível)
- Garanta que todos os funcionários estejam cadastrados no sistema antes de registrar presenças

### Nova Recuperação Automática

O sistema agora implementa:

1. **Verificação e criação automática de dependências**: Antes de sincronizar uma presença, verifica se o funcionário existe no servidor, criando-o se necessário.

2. **Processamento em ordem inteligente**: Funcionários são sincronizados primeiro, depois horários e por fim presenças.

3. **Sistema de lotes**: Dados são processados em pequenos lotes para reduzir falhas em grandes sincronizações.

4. **Detecção inteligente de erros**: O sistema identifica tipos específicos de erros e aplica estratégias de recuperação adequadas.

## Como Executar

1. Clone o repositório:

```bash
git clone [url-do-repositorio]
cd app-hoje
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:
   Crie um arquivo `environment.ts` em `src/environments/` com suas credenciais do Supabase:

```typescript
export const environment = {
  production: false,
  supabaseUrl: "SUA_URL_SUPABASE",
  supabaseKey: "SUA_CHAVE_SUPABASE",
};
```

4. Execute o projeto:

```bash
ionic serve
```

## Estrutura do Projeto

```
app-hoje/
├── src/
│   ├── app/
│   │   ├── pages/          # Páginas do aplicativo
│   │   ├── services/       # Serviços
│   │   ├── guards/         # Guards de rota
│   │   └── models/         # Interfaces e tipos
│   ├── environments/       # Configurações de ambiente
│   └── theme/             # Temas e estilos globais
```

## Arquitetura de Serviços

O sistema utiliza diversos serviços especializados para gerenciar o fluxo de dados:

### Core Services

- **LocalStorageService**: Gerencia o armazenamento local de todos os dados, incluindo funcionários, presenças, horários e fila de sincronização.

- **SyncService**: Responsável por sincronizar dados entre o dispositivo local e o servidor Supabase, com suporte a retry, detecção de conexão e sincronização automática.

- **NetworkService**: Monitora o estado da conexão de internet e notifica outros serviços quando muda.

- **CacheService**: Implementa estratégias inteligentes de cache com base na idade dos dados, estado da conexão e preferências do usuário.

- **QrCodeService**: Gerencia a geração, validação e cache de QR Codes para registro de presença, com suporte a expiração e renovação.

### Componentes de UI

- **SyncStatusComponent**: Exibe o estado atual da sincronização, incluindo itens pendentes, erros e opções para sincronização manual.

### Modelo de Dados

Os principais modelos incluem metadados para controle de sincronização e cache:

- **Employee**: Dados dos funcionários com flags de sincronização
- **Attendance**: Registros de presença com suporte a modo offline
- **WorkSchedule**: Configurações de horário de trabalho
- **SyncQueueItem**: Representa operações pendentes na fila de sincronização

## Fluxo de Dados Offline-First

1. Todas as operações são primeiro executadas localmente
2. Os dados são adicionados à fila de sincronização
3. Quando online, o sistema sincroniza automaticamente
4. Feedback visual é fornecido ao usuário sobre o status da sincronização

## Comportamento Offline

O aplicativo foi projetado para funcionar completamente offline, exceto para a autenticação inicial. Aqui está o que esperar quando estiver sem conexão:

### O que funciona offline:

- ✅ Registro de presença dos funcionários
- ✅ Visualização de dados existentes (funcionários, histórico de presenças, etc.)
- ✅ Edição e atualização de registros
- ✅ Exportação de relatórios locais
- ✅ Todas as funcionalidades administrativas exceto autenticação

### O que requer conexão:

- ⚠️ Autenticação inicial e login
- ⚠️ Importação de dados de fontes externas
- ⚠️ Sincronização manual forçada

### Como o sistema gerencia dados offline:

1. **Armazenamento local**: Todos os dados são armazenados no localStorage do navegador
2. **Fila de sincronização**: Alterações feitas offline são enfileiradas para sincronização posterior
3. **Resolução de conflitos**: O sistema usa timestamps para resolver conflitos de dados
4. **Indicadores visuais**: A interface mostra claramente quando o app está operando offline
5. **Sincronização automática**: Quando a conexão é restaurada, os dados são sincronizados automaticamente

### Limites do armazenamento offline:

- O localStorage tem limite de 5-10MB dependendo do navegador
- Para uso prolongado offline, recomenda-se sincronizar periodicamente
- Após atingir o limite de armazenamento, será necessário limpar dados antigos

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento local
ionic serve

# Construir para produção
ionic build --prod
```

## Equipe de Desenvolvimento

- Desenvolvedor Frontend: [Seu Nome]
- UI/UX Designer: [Nome do Designer]
- Backend Developer: [Nome do Desenvolvedor]

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
