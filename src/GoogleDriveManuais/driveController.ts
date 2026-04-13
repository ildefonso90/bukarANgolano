import express from 'express';
import { storageManager } from './storageManager.ts';

const router = express.Router();

/**
 * Rota para iniciar uma sessão de upload no Pool de Storage
 */
router.post('/upload-session', async (req, res) => {
  try {
    const { titulo, tipo, isFree, mimeType } = req.body;
    
    if (!titulo) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    // O Storage Manager escolhe a conta e a pasta automaticamente
    const session = await storageManager.createUploadSession({
      title: titulo,
      category: tipo, // No frontend, 'tipo' é a categoria (pdf, video, etc)
      isFree: Boolean(isFree),
      mimeType: mimeType || 'application/octet-stream'
    });

    res.json(session);

  } catch (error: any) {
    console.error('Drive Pool Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Certifique-se de que a variável GOOGLE_DRIVE_ACCOUNTS está configurada corretamente.'
    });
  }
});

/**
 * Rota para espelhamento (Redundância)
 */
router.post('/mirror', async (req, res) => {
  try {
    const { fileId, sourceAccountId, isFree } = req.body;
    
    // Futura implementação: Copiar o ficheiro para outra conta do Pool
    res.json({ 
      status: 'mirroring_queued', 
      message: 'O ficheiro será espelhado para redundância no pool.' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as driveRouter };
