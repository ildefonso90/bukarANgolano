import express from 'express';
import { iniciarPagamento, confirmarPagamento, validarAcesso, liberarConteudo } from './paymentService.ts';

const router = express.Router();

// Iniciar sessão de pagamento
router.post('/checkout', async (req, res) => {
  try {
    const { userId, tccId } = req.body;
    const session = await iniciarPagamento(userId, tccId);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook para confirmação de pagamento
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    await confirmarPagamento(event);
    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Validar acesso
router.get('/validate/:userId/:tccId', async (req, res) => {
  try {
    const { userId, tccId } = req.params;
    const hasAccess = await validarAcesso(userId, tccId);
    res.json({ hasAccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar sessão de pagamento para pacote (Bundle)
router.post('/checkout-bundle', async (req, res) => {
  try {
    const { userId, bundleId } = req.body;
    // Mock checkout session
    res.json({ 
      url: `/checkout-mock?userId=${userId}&bundleId=${bundleId}`,
      status: 'pending' 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as paymentRouter };
