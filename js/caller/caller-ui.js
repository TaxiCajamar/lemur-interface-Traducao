// 🔔🔔🔔 FUNÇÃO ATUALIZADA: Notificação SIMPLES igual ao servidor
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId) {
  try {
    console.log('🔔 Enviando notificação SIMPLES para acordar receiver...');
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: receiverToken,
        title: '📞 Nova Chamada',
        body: `Toque para atender a chamada`, // ✅ CORPO SIMPLES IGUAL AO SERVIDOR
        // ✅ DADOS SIMPLES: APENAS O NECESSÁRIO
        data: {
          type: 'wake_up' // ✅ MESMO TIPO QUE O SERVIDOR ESPERA
          // ❌ REMOVIDO: callerId, callerLang, targetLang, receiverId
        }
      })
    });

    const result = await response.json();
    console.log('✅ Notificação SIMPLES enviada:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
}

// 🔄 FUNÇÃO ATUALIZADA: Tentar fluxo de notificação SIMPLES
async function tentarFluxoNotificacaoSimples(receiverToken, receiverId, meuId) {
  console.log('📞 Iniciando fluxo de notificação SIMPLES...');
  
  // ✅✅✅ ENVIA APENAS NOTIFICAÇÃO SIMPLES "ACORDAR" (IGUAL AO SERVIDOR)
  const notificacaoEnviada = await enviarNotificacaoWakeUp(
    receiverToken, 
    receiverId, 
    meuId
  );
  
  if (notificacaoEnviada) {
    mostrarEstadoAguardando();
    iniciarEscutaConexaoReversa(receiverId, meuId);
  } else {
    alert('❌ Não foi possível notificar o receptor. Tente novamente.');
  }
}
