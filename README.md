# Sistema de Registro de Ponto

Um sistema web de registro de ponto desenvolvido com Ionic Angular e Supabase, oferecendo uma solução moderna para controle de presença de funcionários.

## Funcionalidades

- ✅ Registro de ponto público (entrada/saída)
- 🔐 Área administrativa protegida
- 👥 Cadastro e gestão de funcionários
- 📊 Relatórios de presença
- ⚙️ Configurações de horário de trabalho
- 🎯 Múltiplos métodos de autenticação (código, face, digital)

## Tecnologias Utilizadas

- Ionic Framework 7
- Angular 16
- Supabase (Backend as a Service)
- TypeScript
- SCSS

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
     auth_method text,
     observations text,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   create table work_schedule (
     id uuid default uuid_generate_v4() primary key,
     start_time text not null,
     end_time text not null,
     work_days integer[] not null,
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

## Fluxo de Uso

1. **Página Inicial (Pública)**

   - Registro de ponto por código de funcionário
   - Opções de face ID e digital
   - Acesso à área administrativa

2. **Área Administrativa**
   - Gestão de funcionários
   - Visualização de relatórios
   - Configurações do sistema

## Contribuição

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
