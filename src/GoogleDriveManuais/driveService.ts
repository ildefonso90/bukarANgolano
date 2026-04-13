import { driveAccounts } from './config';

export async function getProtectedLink(fileId: string, accountId: string = 'primary') {
  const account = driveAccounts.find(a => a.id === accountId) || driveAccounts[0];
  console.log(`Buscando arquivo ${fileId} na conta ${account.id}`);
  
  // Lógica para lidar com múltiplas APIs aqui
  return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
}

export async function checkFilePermissions(fileId: string, userId: string) {
  return true; 
}

