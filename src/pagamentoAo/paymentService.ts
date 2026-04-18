import { supabase } from '../lib/supabase';

export async function iniciarPagamento(userId: string, tccId: string) {
  console.log(`Iniciando pagamento para usuário ${userId} e TCC ${tccId}`);
  // In a real app, integrate Stripe here
  return {
    id: `session_${Math.random().toString(36).substr(2, 9)}`,
    url: `/checkout-mock?userId=${userId}&tccId=${tccId}`
  };
}

export async function confirmarPagamento(event: any) {
  const { userId, tccId, bundleId } = event;
  
  if (userId && (tccId || bundleId)) {
    if (bundleId) {
      await liberarPacote(userId, bundleId);
    } else if (tccId) {
      await liberarConteudo(userId, tccId);
    }
  }
}

export async function liberarPacote(userId: string, bundleId: string) {
  // Get current bundle IDs
  const { data: user } = await supabase
    .from('users')
    .select('purchased_bundle_ids')
    .eq('uid', userId)
    .single();

  const currentBundles = user?.purchased_bundle_ids || [];
  if (!currentBundles.includes(bundleId)) {
    await supabase
      .from('users')
      .update({ purchased_bundle_ids: [...currentBundles, bundleId] })
      .eq('uid', userId);
  }
}

export async function liberarConteudo(userId: string, tccId: string) {
  // Implementation for single TCC if needed, or just use bundles
  console.log(`Liberando TCC ${tccId} para usuário ${userId}`);
}

export async function validarAcesso(userId: string, tccId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('purchased_bundle_ids')
    .eq('uid', userId)
    .single();

  if (user) {
    // Check if the TCC belongs to any purchased bundle
    const { data: tcc } = await supabase
      .from('contents')
      .select('bundle_id')
      .eq('id', tccId)
      .single();

    return tcc && user.purchased_bundle_ids?.includes(tcc.bundle_id);
  }
  return false;
}
