# BukiAngolano 🇦🇴

Plataforma de venda e visualização de monografias e TCCs para estudantes angolanos.

## 🚀 Funcionamento

O BukiAngolano funciona como um ecossistema integrado para a partilha de conhecimento académico:

1.  **Catálogo**: Estudantes podem navegar por uma vasta biblioteca de TCCs e monografias.
2.  **Preview**: Cada trabalho permite uma visualização gratuita das primeiras páginas para garantir a qualidade antes da compra.
3.  **Pagamento**: Integração com sistemas locais (Multicaixa/Transferência) via `pagamentoAo`.
4.  **Desbloqueio**: Após a confirmação do pagamento, o sistema utiliza o `GoogleDriveManuais` para libertar o acesso ao ficheiro completo armazenado de forma segura.

## 🛠️ Manuseio e Gestão

### Como Adicionar Novos Trabalhos
Os trabalhos são geridos via Firestore. Cada documento na coleção `tccs` deve conter:
- `title`: Título do trabalho.
- `author`: Nome do autor.
- `price`: Preço em Kwanzas (AOA).
- `driveFileId`: ID do ficheiro no Google Drive.
- `previewUrl`: Link para a amostra gratuita.
- `accountId`: ID da conta do Drive (definida em `GoogleDriveManuais/config.ts`).

### Gestão de Múltiplas Contas Drive
No ficheiro `src/GoogleDriveManuais/config.ts`, podes adicionar novas APIs e contas para distribuir o armazenamento. O sistema seleciona a conta correta baseada no `accountId` do trabalho.

### Processamento de Pagamentos
A lógica reside em `src/pagamentoAo`. Atualmente, o sistema suporta um fluxo de checkout simulado que pode ser ligado a gateways locais angolanos.

## 📁 Estrutura do Projeto
- `/src/components`: Componentes de interface reutilizáveis.
- `/src/pages`: Páginas principais (Home, Catálogo, Detalhes).
- `/src/pagamentoAo`: Lógica de processamento de pagamentos.
- `/src/GoogleDriveManuais`: Integração multi-conta com Google Drive.
- `/src/context`: Gestão de estado (Autenticação Firebase).
- `server.ts`: Servidor Express que gere a API e serve a aplicação.

## 💻 Desenvolvimento
- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Compila a aplicação para produção.
- `npm start`: Inicia o servidor em ambiente de produção.

