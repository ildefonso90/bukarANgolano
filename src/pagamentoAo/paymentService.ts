import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';

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
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    purchasedBundleIds: arrayUnion(bundleId)
  });
}

export async function liberarConteudo(userId: string, tccId: string) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    purchasedTccs: arrayUnion(tccId)
  });
}

export async function validarAcesso(userId: string, tccId: string) {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const data = userSnap.data();
    return data.purchasedTccs?.includes(tccId) || false;
  }
  return false;
}
