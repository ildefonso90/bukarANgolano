# GoogleDriveManuais

Esta pasta contém a lógica de integração com múltiplas contas do Google Drive para armazenamento de manuais e TCCs.

## 🛠️ Como Funciona (Storage Distribuído)
O sistema utiliza um modelo de "Storage Pools" para distribuir o conteúdo e garantir alta disponibilidade.

### Storage Pools
- **Free Pool**: Contas (`primary`, `secondary`) para conteúdo gratuito.
- **Paid Pool**: Contas (`paid_primary`, `paid_backup`) para conteúdo premium.

### Redundância Automática
Cada ficheiro é idealmente espelhado em duas contas. No banco de dados, guardamos:
- `fileIdPrimary`: ID na conta principal.
- `fileIdBackup`: ID na conta de redundância.

### Upload Direto (Zero Server Load)
O backend gera um `accessToken` temporário e uma `uploadUrl`. O frontend faz o upload diretamente para os servidores da Google, poupando largura de banda e CPU do nosso servidor.

