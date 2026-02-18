# Guia de Deploy no Vercel - Rhesult

Este guia explica como configurar e implantar o projeto `rhesult-web` no Vercel.

## Pré-requisitos
1. Uma conta no [Vercel](https://vercel.com/signup).
2. O código do projeto em um repositório Git (GitHub, GitLab, ou Bitbucket).
3. O Backend (`rhesult-backend`) implantado e acessível publicamente (no Render, Railway, VPS, etc.).

## Passos para Deploy

### 1. Configurar Variáveis de Ambiente
No painel do projeto no Vercel, vá em:
`Settings -> Environment Variables`

Adicione a seguinte variável:
- **NEXT_PUBLIC_API_BASE**: A URL pública onde seu backend está rodando.
  - Exemplo: `https://seu-backend-rhesult.onrender.com`

Se o backend exigir autenticação ou configurações extras, adicione também:
- **API_BASE**: Mesmo valor que `NEXT_PUBLIC_API_BASE` (para chamadas server-side).

### 2. Configurar o Projeto no Vercel
Ao importar o repositório no Vercel:

1. **Framework Preset**: O Vercel deve detectar automaticamente **Next.js**.
2. **Root Directory**:
   - Clique em `Edit` ao lado de Root Directory.
   - Selecione a pasta `rhesult-web`.
3. **Build Command**: `next build` (Padrão)
4. **Output Directory**: `.next` (Padrão)
5. **Install Command**: `npm install` (Padrão)

### 3. Backend (Atenção!)
O projeto `rhesult-backend` (Node.js + Express + MySQL) **NÃO** deve ser implantado no Vercel como uma aplicação Serverless padrão devido a:
1. **Upload de Arquivos**: O backend usa `multer` para salvar arquivos em disco (`/uploads`). O sistema de arquivos do Vercel é somente-leitura.
2. **Conexões Persistentes**: O Vercel encerra funções após a execução, o que pode causar problemas com conexões de banco de dados se não forem gerenciadas corretamente (embora o `mysql2` pool ajude).

**Recomendação para Backend**:
Implante o `rhesult-backend` em serviços como **Render**, **Railway**, ou **DigitalOcean App Platform**, que suportam discos persistentes (para uploads) e processos Node.js de longa duração.

Se precisar usar o Vercel para o backend, você precisará refatorar o upload de arquivos para usar um serviço externo como AWS S3 ou Vercel Blob.

## Scripts Úteis

Para verificar se o projeto está pronto para deploy localmente:

```bash
cd rhesult-web
npm run build
```

Se o build passar sem erros, o projeto está pronto para o Vercel.
