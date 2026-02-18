# Guia de Deploy no Railway - Rhesult

Este guia explica como implantar os projetos `rhesult-web` (Frontend) e `rhesult-backend` (Backend) no Railway.

## 1. Preparar o Backend (`rhesult-backend`)

O backend precisa de um banco de dados MySQL e de um **Volume Persistente** para salvar uploads (currículos e avatares), já que o sistema de arquivos do Railway é efêmero.

### Passos no Railway:

1.  **Criar Novo Projeto**: No dashboard do Railway, clique em "New Project".
2.  **Adicionar Banco de Dados**:
    -   Selecione "Database" -> "MySQL".
    -   Isso criará um serviço MySQL e definirá automaticamente as variáveis `MYSQLDATABASE`, `MYSQLHOST`, `MYSQLPASSWORD`, `MYSQLPORT`, `MYSQLUSER`, e `DATABASE_URL`.
3.  **Deploy do Código**:
    -   Conecte seu repositório GitHub contendo o `rhesult-backend`.
    -   Adicione o serviço do backend ao projeto.
4.  **Configurar Variáveis de Ambiente (Backend)**:
    -   Vá em `Settings` -> `Variables`.
    -   O Railway deve injetar as variáveis do MySQL automaticamente se estiverem no mesmo projeto.
    -   Adicione ou verifique:
        -   `DB_HOST`: `${{MySQL.MYSQLHOST}}`
        -   `DB_PORT`: `${{MySQL.MYSQLPORT}}`
        -   `DB_user`: `${{MySQL.MYSQLUSER}}`
        -   `DB_PASSWORD`: `${{MySQL.MYSQLPASSWORD}}`
        -   `DB_NAME`: `${{MySQL.MYSQLDATABASE}}`
        -   `PORT`: `4000` (ou deixe o Railway definir, ele injeta `PORT`)
        -   `UPLOADS_PATH`: `/app/uploads` (Para usar o volume, veja abaixo)

5.  **Configurar Volume (Persistência)**:
    -   Vá em `Settings` -> `Volumes`.
    -   Adicione um volume.
    -   Monte-o no caminho: `/app/uploads`.
    -   Isso garante que currículos e fotos não sejam perdidos ao reiniciar o servidor.

6.  **Ajustar Start Command**:
    -   Em `Settings` -> `Deploy` -> `Start Command`, garanta que seja: `npm start` ou `node server.js`.

---

## 2. Preparar o Frontend (`rhesult-web`)

O frontend é uma aplicação Next.js que se conecta ao backend.

### Passos no Railway:

1.  **Adicionar Serviço**: No mesmo projeto (ou novo), adicione um novo serviço conectando o repositório `rhesult-web`.
2.  **Configurar Variáveis de Ambiente (Frontend)**:
    -   Vá em `Settings` -> `Variables`.
    -   Adicione:
        -   `NEXT_PUBLIC_API_BASE`: A URL pública do seu backend no Railway (ex: `https://rhesult-backend-production.up.railway.app`).
        -   `API_BASE`: O mesmo valor de `NEXT_PUBLIC_API_BASE`.
3.  **Build e Deploy**:
    -   O Railway detectará automaticamente que é um projeto Next.js.
    -   Comando de Build: `npm run build`
    -   Comando de Start: `npm start`

---

## 3. Bancos de Dados e Migrations

Ao iniciar o backend pela primeira vez, ele tentará conectar ao banco. Se você tiver scripts SQL para criar tabelas (`database/rhesult_schema.sql`), você precisará rodá-los.

**Opções para rodar o SQL:**
1.  **Via Railway CLI/Interface**: Conecte-se ao MySQL usando a aba "Data" no Railway e execute o script SQL.
2.  **Via Cliente MySQL Local**: Use as credenciais fornecidas pelo Railway ("Connect" tab) para conectar seu Workbench/DBeaver local ao banco na nuvem e rodar o script.
