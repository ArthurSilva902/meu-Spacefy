# 🚀 Spacefy - Plataforma de Aluguel de Espaços

Uma plataforma completa para aluguel de espaços comerciais e residenciais, desenvolvida com React, Node.js, TypeScript e MongoDB.

## ✨ Funcionalidades Principais

### 🏠 **Gestão de Espaços**
- Cadastro e edição de espaços
- Upload de imagens via Cloudinary
- Configuração de horários e preços
- Sistema de regras e comodidades
- Geolocalização com Google Maps

### 📅 **Sistema de Reservas**
- **Reservas Simples**: Aluguel único com data e horário específicos
- **Reservas Recorrentes**: 
  - Reservas semanais ou mensais
  - Cálculo automático de valores
  - Validação de conflitos de horário
  - Criação automática de múltiplas instâncias

### ⭐ **Sistema de Avaliações Bidirecional**
- Usuários avaliam espaços (1-5 estrelas + comentários)
- **Proprietários avaliam locatários** (nova funcionalidade)
- Sistema de rating médio
- Histórico de avaliações

### 📊 **Painel Administrativo Avançado**
- **Métricas em Tempo Real**:
  - Total de reservas
  - Faturamento total
  - Número de espaços ativos
- **Gráficos Interativos**:
  - Faturamento mensal (gráfico de linha)
  - Reservas por espaço (gráfico de barras)
  - Distribuição de faturamento (gráfico de pizza)
- **Filtros Avançados**:
  - Por período (data início/fim)
  - Por espaço específico
  - Por cliente
- **Lista de Aluguéis** com paginação

### 🔐 **Sistema de Autenticação**
- Login/Registro de usuários
- JWT para autenticação
- Proteção de rotas
- Perfis de usuário

### 💬 **Sistema de Comunicação**
- Chat em tempo real
- Notificações automáticas
- Mensagens entre usuários e proprietários

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Recharts** para gráficos
- **React Router** para navegação
- **Axios** para requisições HTTP
- **React Icons** para ícones
- **React Toastify** para notificações

### Backend
- **Node.js** com TypeScript
- **Express.js** para API REST
- **MongoDB** com Mongoose
- **Redis** para cache
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **Nodemailer** para emails
- **Socket.io** para comunicação em tempo real

### Serviços Externos
- **Cloudinary** para upload de imagens
- **Google Maps API** para geolocalização
- **OpenAI** para funcionalidades de IA
- **Upstash Redis** para cache em produção

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- MongoDB
- Redis (opcional para desenvolvimento)

### Backend
```bash
cd Spacefy/backend
npm install
npm run dev
```

### Frontend
```bash
cd Spacefy/frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
meu-Spacefy/
├── Spacefy/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── controllers/     # Lógica de negócio
│   │   │   ├── models/          # Modelos do MongoDB
│   │   │   ├── routes/          # Rotas da API
│   │   │   ├── middlewares/     # Middlewares
│   │   │   ├── utils/           # Utilitários
│   │   │   ├── types/           # Tipos TypeScript
│   │   │   └── config/          # Configurações
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── Components/      # Componentes React
│       │   ├── Pages/           # Páginas da aplicação
│       │   ├── services/        # Serviços de API
│       │   ├── Contexts/        # Contextos React
│       │   └── Routes/          # Configuração de rotas
│       └── package.json
├── render.yaml                  # Configuração Render
└── README.md
```

## 🌐 Deploy

### Backend (Render)
- Configurado com Blueprint
- Variáveis de ambiente necessárias:
  - `MONGO_URI`
  - `JWT_KEY`
  - `BCRYPT_COST`
  - `FRONTEND_URL`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `OPENAI_API_KEY` (opcional)

### Frontend (Vercel)
- Deploy automático via GitHub
- Variáveis de ambiente:
  - `VITE_API_URL`
  - `VITE_CLOUDINARY_*`

## 📊 Novas Funcionalidades Implementadas

### 1. **Reservas Recorrentes**
- **Endpoint**: `POST /rentals/recurring`
- **Funcionalidades**:
  - Criação de reservas semanais/mensais
  - Validação automática de conflitos
  - Cálculo de valores baseado na recorrência
  - Cancelamento de toda a série de reservas

### 2. **Painel Administrativo**
- **Endpoint**: `GET /admin/metrics/:ownerId`
- **Funcionalidades**:
  - Dashboard com métricas em tempo real
  - Gráficos interativos com Recharts
  - Filtros avançados por data e espaço
  - Relatórios de faturamento

### 3. **Sistema de Avaliação Bidirecional**
- **Endpoint**: `POST /assessment/owner-assessment`
- **Funcionalidades**:
  - Proprietários podem avaliar locatários
  - Sistema de notas de 1-5 estrelas
  - Comentários textuais
  - Histórico de avaliações

## 🔧 Configuração de Ambiente

### Backend (.env)
```env
MONGO_URI=mongodb+srv://...
JWT_KEY=your_jwt_secret
BCRYPT_COST=12
FRONTEND_URL=https://your-frontend.vercel.app
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=your_token
OPENAI_API_KEY=your_openai_key
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

## 📈 Performance e Otimização

- **Cache Redis** para consultas frequentes
- **Índices MongoDB** otimizados
- **Lazy loading** de componentes
- **Code splitting** no frontend
- **Rate limiting** no backend

## 🔒 Segurança

- **JWT** para autenticação
- **bcrypt** para hash de senhas
- **Helmet** para headers de segurança
- **CORS** configurado
- **Rate limiting** para prevenir spam
- **Validação** de dados em todas as rotas

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub.

---

**Desenvolvido com ❤️ para facilitar o aluguel de espaços!** 
