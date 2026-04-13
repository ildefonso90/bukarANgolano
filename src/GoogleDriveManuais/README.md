# GoogleDriveManuais

Esta pasta contém a lógica de integração com múltiplas contas do Google Drive para armazenamento de manuais e TCCs.

## 🛠️ Como Funciona
O sistema é capaz de gerir ficheiros distribuídos por diferentes contas do Google Drive. Isto é útil para contornar limites de armazenamento ou organizar materiais por categorias.

### Configuração (`config.ts`)
Adiciona novas contas no array `driveAccounts`:
```typescript
{
  id: 'conta_engenharia',
  apiKey: '...',
  folderId: '...'
}
```

### Serviço (`driveService.ts`)
A função `getProtectedLink` recebe um `accountId`. Se não for fornecido, utiliza a conta `primary` por defeito.

## 🔒 Segurança
Os links gerados são protegidos. O sistema verifica as permissões do utilizador (se o pagamento foi confirmado) antes de fornecer o acesso final ao ficheiro.

