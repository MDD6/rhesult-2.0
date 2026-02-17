# Guia de Deploy no Vercel

## Pré-requisitos
- ✅ Código compilado com sucesso no Vercel
- ✅ Repositório Git sincronizado
- [ ] Conta no Vercel (https://vercel.com)
- [ ] Backend hospedado em produção

## Passo 1: Prepare o Backend em Produção

Você precisa hospedar seu backend em um serviço como:
- **Railway** (recomendado, simples)
- **Render**
- **Heroku** (pagas agora)
- **DigitalOcean App Platform**

### Exemplo com Railway:
1. Vá para https://railway.app
2. Conecte seu repositório GitHub
3. Selecione o branch `featuring`
4. Configure o diretório raiz como `/rhesult-backend`
5. Defina a variável de ambiente `NODE_ENV=production`
6. Implante
7. Copie a URL do backend (ex: `https://rhesult-backend.railway.app`)

## Passo 2: Deploy na Vercel

### Opção A: Pelo Dashboard (Mais Simples)
1. Vá para https://vercel.com/new
2. Clique em "Import Git Repository"
3. Selecione seu repositório GitHub `rhesult-web`
4. Configure:
   - Project Name: `rhesult-web`
   - Framework: `Next.js`
   - Root Directory: `./rhesult-web`

### Opção B: Pelo CLI
```powershell
npm install -g vercel
cd "c:\Users\mathe\OneDrive\Área de Trabalho\1.0\rhesult-web"
vercel
```

## Passo 3: Configurar Variáveis de Ambiente

No dashboard do Vercel:
1. Vá para Settings → Environment Variables
2. Adicione:
   ```
   API_BASE = https://seu-backend-em-producao.com
   NEXT_PUBLIC_API_BASE = https://seu-backend-em-producao.com
   ```

## Passo 4: Deploy Automático

Após a primeira implantação, qualquer push para o branch `featuring` será automaticamente deployado!

```powershell
git push origin featuring
```

## Dicas Importantes

### URL do Backend em Produção
Você precisa descobrir qual será a URL do seu backend hospedado:
- Railroad: `https://<seu-projeto>.railway.app`
- Render: `https://<seu-projeto>.onrender.com`

### Testar Localmente
Antes de fazer deploy, teste com a URL de produção do backend:
```powershell
$env:API_BASE = "https://sua-url-backend.com"
npm run dev
```

### Monitoramento
- Vercel Dashboard: https://vercel.com/dashboard
- Logs em tempo real: Clique no seu projeto → Deployments

## Próximos Passos

1. **Hospede o backend** em Railway/Render/etc
2. **Crie conta no Vercel** se ainda não tem
3. **Conecte o repositório** ao Vercel
4. **Configure variáveis de ambiente** com a URL do backend
5. **Deploy!** 🚀

Quer ajuda com alguma dessas etapas?
