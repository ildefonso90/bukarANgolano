// Configuração de múltiplas contas do Google Drive
export const driveAccounts = [
  {
    id: 'primary',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY_1,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_1,
  },
  {
    id: 'secondary',
    apiKey: process.env.GOOGLE_DRIVE_API_KEY_2,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID_2,
  }
];
