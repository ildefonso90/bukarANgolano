# PagamentoAo

Lógica de processamento de pagamentos focada no mercado angolano (Kwanza/Multicaixa).

## 💸 Fluxo de Pagamento
1.  **Checkout**: O utilizador inicia o processo na página de detalhes do TCC.
2.  **Processamento**: O `paymentService.ts` gere a criação da transação.
3.  **Confirmação**: Em ambiente de produção, isto seria ligado a um webhook de um gateway de pagamento (ex: Proxypay, Unitel Money).
4.  **Desbloqueio**: Após sucesso, o perfil do utilizador no Firestore é atualizado com o ID do TCC comprado.

## 📁 Arquivos
- `paymentService.ts`: Funções core para registar compras e validar pagamentos.
- `paymentController.ts`: Endpoints da API Express para checkout e webhooks.

