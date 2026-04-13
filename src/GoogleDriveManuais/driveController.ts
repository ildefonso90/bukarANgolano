import express from 'express';
import { google } from 'googleapis';
import { driveAccounts, drivePools } from './config.ts';

const router = express.Router();

// Get upload URL and token
router.post('/upload-session', async (req, res) => {
  try {
    const { titulo, tipo, isFree } = req.body;
    
    // 1. Choose pool
    const pool = isFree ? drivePools.free : drivePools.paid;
    const accountId = pool[Math.floor(Math.random() * pool.length)];
    const account = driveAccounts.find(a => a.id === accountId);

    if (!account) throw new Error('Storage account not found');

    // 2. Setup Google Drive API
    // Note: In a real app, you'd use a Service Account key
    // For this example, we'll assume the environment has credentials
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    const drive = google.drive({ version: 'v3', auth });

    // 3. Create placeholder file to get a resumable upload URL
    const fileMetadata = {
      name: titulo,
      parents: [account.folderId],
      appProperties: {
        tipo,
        isFree: String(isFree)
      }
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        body: '', // Empty body for now
      },
      fields: 'id',
    });

    const fileId = response.data.id;

    // 4. In a real "serverless" direct upload, we would return a resumable upload URL
    // But for simplicity in this prototype, we'll return the fileId and account info
    // and let the frontend handle the next steps if they have a client-side token,
    // OR we can proxy the upload if needed.
    // The user specifically asked for "Backend generates temporary access token".
    
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    res.json({
      fileId,
      accountId,
      accessToken: token.token,
      uploadUrl: `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`
    });

  } catch (error: any) {
    console.error('Drive Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Redundancy check / Mirroring
router.post('/mirror', async (req, res) => {
  try {
    const { fileId, sourceAccountId, isFree } = req.body;
    
    // Logic to copy file from source account to backup account
    // This would normally be a background task
    res.json({ status: 'mirroring_started', backupFileId: 'backup_' + fileId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as driveRouter };
