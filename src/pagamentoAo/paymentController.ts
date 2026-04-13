import express from 'express';
import { iniciarPagamento, confirmarPagamento, validarAcesso, registrarCompra, liberarConteudo } from './paymentService';

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

export { router as paymentRouter };
