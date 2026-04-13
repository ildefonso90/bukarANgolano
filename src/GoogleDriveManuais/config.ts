// Configuração dinâmica do Pool de Storage
export interface DriveAccount {
  id: string;
  credentials: any; // Service Account JSON object
  usage?: number;
}

import fs from 'fs';
import path from 'path';

const parseAccounts = (): DriveAccount[] => {
  try {
    let raw = process.env.GOOGLE_DRIVE_ACCOUNTS;
    
    // Fallback: Tentar ler diretamente do arquivo .env se o process.env estiver vazio
    if (!raw) {
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const match = envContent.match(/GOOGLE_DRIVE_ACCOUNTS=['"]?(.+?)['"]?(\n|$)/s);
          if (match && match[1]) {
            raw = match[1];
            console.log('[DrivePool Debug] Carregado manualmente do .env');
          }
        }
      } catch (err) {
        console.error('[DrivePool Debug] Erro ao ler .env manualmente:', err);
      }
    }

    console.log('[DrivePool Debug] Raw env value exists:', !!raw);
    
    if (!raw) return [];
    
    raw = raw.trim();
    // Remover aspas se existirem
    if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) {
      raw = raw.slice(1, -1);
    }
    
    const parsed = JSON.parse(raw);
    console.log('[DrivePool Debug] Contas carregadas:', parsed.length);
    return parsed;
  } catch (e: any) {
    console.error('[DrivePool Debug] Erro ao processar JSON:', e.message);
    return [];
  }
};

export const driveAccounts = parseAccounts();
console.log(`[DrivePool] ${driveAccounts.length} contas carregadas.`);
