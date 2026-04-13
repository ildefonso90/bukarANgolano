import { google } from 'googleapis';
import { driveAccounts, DriveAccount } from './config.ts';

class StorageManager {
  private currentIndex = 0;

  /**
   * Escolhe uma conta do pool usando Round-Robin
   */
  public pickAccount(): DriveAccount {
    if (driveAccounts.length === 0) {
      throw new Error('Nenhuma conta de Google Drive configurada no pool.');
    }
    const account = driveAccounts[this.currentIndex % driveAccounts.length];
    this.currentIndex++;
    return account;
  }

  /**
   * Cria um cliente autenticado para a conta escolhida
   */
  public getDriveClient(account: DriveAccount) {
    const auth = google.auth.fromJSON(account.credentials) as any;
    if (auth.scopes === undefined) {
      auth.scopes = ['https://www.googleapis.com/auth/drive.file'];
    }
    return google.drive({ version: 'v3', auth });
  }

  /**
   * Resolve o ID da pasta com base no tipo e categoria dentro da conta escolhida
   * Seguindo a regra: ROOT / [FREE|PAID] / [livros|cursos|manuais]
   */
  private async resolveFolderId(drive: any, isFree: boolean, category: string): Promise<string> {
    const rootFolderName = isFree ? 'FREE' : 'PAID';
    const subFolderName = this.mapCategoryToSubfolder(category);

    // 1. Encontrar ou criar a pasta raiz (FREE ou PAID)
    const rootId = await this.getOrCreateFolder(drive, rootFolderName, 'root');
    
    // 2. Encontrar ou criar a subpasta (livros, cursos ou manuais)
    const subId = await this.getOrCreateFolder(drive, subFolderName, rootId);

    return subId;
  }

  private mapCategoryToSubfolder(category: string): string {
    const cat = category.toLowerCase();
    if (cat === 'book' || cat === 'livros') return 'livros';
    if (cat === 'video' || cat === 'course' || cat === 'lesson' || cat === 'cursos') return 'cursos';
    return 'manuais';
  }

  private async getOrCreateFolder(drive: any, name: string, parentId: string): Promise<string> {
    const q = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
    const res = await drive.files.list({ q, fields: 'files(id)' });
    
    if (res.data.files && res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    const folderMetadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    };

    const folder = await drive.files.create({
      requestBody: folderMetadata,
      fields: 'id'
    });

    return folder.data.id;
  }

  /**
   * Gera uma sessão de upload (placeholder no Drive)
   */
  public async createUploadSession(params: {
    title: string;
    category: string;
    isFree: boolean;
    mimeType: string;
  }) {
    const account = this.pickAccount();
    const drive = this.getDriveClient(account);
    
    // Resolve a pasta dinamicamente seguindo a estrutura fixa
    const folderId = await this.resolveFolderId(drive, params.isFree, params.category);

    const fileMetadata = {
      name: params.title,
      parents: [folderId],
      appProperties: {
        category: params.category,
        isFree: String(params.isFree)
      }
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: params.mimeType,
        body: '', 
      },
      fields: 'id',
    });

    const authClient = await (drive.context._options.auth as any).getClient();
    const token = await authClient.getAccessToken();

    return {
      fileId: response.data.id,
      accountId: account.id,
      accessToken: token.token,
      uploadUrl: `https://www.googleapis.com/upload/drive/v3/files/${response.data.id}?uploadType=media`
    };
  }
}

export const storageManager = new StorageManager();
