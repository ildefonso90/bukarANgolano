# BukiAngolano 🇦🇴 - Ecossistema Estudantil

Plataforma de partilha de conhecimento académico para estudantes angolanos, com foco em acessibilidade e monetização justa.

## 🚀 Arquitetura do Ecossistema

O sistema utiliza uma arquitetura distribuída para garantir escalabilidade e zero carga no servidor principal:

1.  **Frontend (React)**: Gere a interface e o upload direto para o Google Drive via tokens temporários.
2.  **Backend (Express)**: Valida metadados, gere tokens de upload, controla acessos e redundância.
3.  **Base de Dados (Firestore)**: Armazena metadados de conteúdos, perfis de utilizadores e registos de compras.
4.  **Storage Layer (Google Drive Multi-API)**: Armazenamento distribuído em múltiplas contas com redundância automática.

## 🛠️ Fluxo de Upload (Pipeline Controlado)

Para garantir que o servidor não fique sobrecarregado, o upload é feito diretamente do navegador para o Google Drive:
1.  O utilizador envia os metadados para o backend.
2.  O backend valida o utilizador e gera um token de acesso temporário e uma URL de upload.
3.  O frontend envia o ficheiro diretamente para o Google Drive.
4.  O backend regista o conteúdo como "pendente" para moderação.

## 💰 Modelo de Negócio

-   **Conteúdo Grátis**: A maioria do conteúdo é livre para todos os estudantes.
-   **Conteúdo Pago (Pacotes)**: Alguns materiais premium são agrupados em pacotes de **2.000 Kz**. O acesso é libertado após confirmação de pagamento.

## 📁 Estrutura do Projeto
- `/src/GoogleDriveManuais`: Gestão de storage distribuído e redundância.
- `/src/pagamentoAo`: Processamento de pagamentos locais (Kwanza).
- `/src/pages/Upload.tsx`: Pipeline de contribuição de conteúdo.
- `/src/pages/ContentDetail.tsx`: Visualizador e controlo de acesso.

