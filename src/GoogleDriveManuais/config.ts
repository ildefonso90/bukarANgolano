// Configuração de múltiplas contas do Google Drive
export const drivePools = {
  free: ['primary', 'secondary'],
  paid: ['paid_primary', 'paid_backup']
};

export const driveAccounts = [
  {
    id: 'primary',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY_1,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_FREE_1 || 'root',
  },
  {
    id: 'secondary',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY_2,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_FREE_2 || 'root',
  },
  {
    id: 'paid_primary',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY_PAID_1,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_PAID_1 || 'root',
  },
  {
    id: 'paid_backup',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY_PAID_2,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_PAID_2 || 'root',
  }
];
