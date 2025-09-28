// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;

  try {
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
    return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
  } catch (error) {
    console.error('Erro ao carregar JSON de bandeiras:', error);
    const fallback = {
      'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
      'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
      'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
    };
    return fallback[lang] || 'en-US';
  }
}

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
  if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
    window.rtcDataChannel.send(texto);
    console.log('✅ Texto enviado:', texto);
  } else {
    console.log('⏳ Canal não disponível ainda. Tentando novamente...');
    setTimeout(() => enviarParaOutroCelular(texto), 1000);
  }
}

// 🌐 Tradução apenas para texto
async function translateText(text, targetLang) {
  try {
    const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });

    const result = await response.json();
    return result.translatedText || text;
  } catch (error) {
    console.error('Erro na tradução:', error);
    return text;
  }
}

// 🔔🔔🔔 FUNÇÃO MELHORADA: Enviar notificação FCM COM DADOS VISÍVEIS
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma, targetLang) {
  try {
    console.log('🔔 Enviando notificação FCM para acordar receiver...');
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: receiverToken,
        title: '📞 Nova Chamada',  // ✅ TÍTULO MAIS CLARO
        body: `ID ${meuId} quer conectar com ID ${receiverId} | Eu falo ${meuIdioma}`,  // ✅ CORPO COM DADOS REAIS
        data: {
          type: 'wake_up_call',
          callerId: meuId,           // ID de QUEM está chamando
          callerLang: meuIdioma,     // Idioma de QUEM está chamando
          targetLang: targetLang,    // Idioma de destino
          receiverId: receiverId     // SEU ID (quem recebe)
        }
      })
    });

    const result = await response.json();
    console.log('✅ Notificação enviada:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
}

// ⏳ FUNÇÃO: Mostrar estado "Aguardando resposta" (SÓ PARA OFFLINE)
function mostrarEstadoAguardando() {
  const statusElement = document.createElement('div');
  statusElement.id = 'aguardando-status';
  statusElement.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                text-align: center; z-index: 1000;">
      <div style="font-size: 24px; margin-bottom: 10px;">📞</div>
      <div>Chamando receptor...</div>
      <div style="font-size: 12px; opacity: 0.8;">Aguardando atender</div>
      <div id="contador-tempo" style="margin-top: 10px;">30s</div>
    </div>
  `;
  document.body.appendChild(statusElement);

  let tempoRestante = 30;
  const contador = setInterval(() => {
    tempoRestante--;
    document.getElementById('contador-tempo').textContent = tempoRestante + 's';
    
    if (tempoRestante <= 0) {
      clearInterval(contador);
      statusElement.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
          <div>Receptor indisponível</div>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="margin-top: 10px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 5px;">
            Fechar
          </button>
        </div>
      `;
    }
  }, 1000);
}

// 🔄 FUNÇÃO: Iniciar escuta para conexão reversa (SÓ PARA OFFLINE)
function iniciarEscutaConexaoReversa(receiverId, meuId) {
  console.log('👂 Escutando por conexão reversa do receiver...');
  
  // Configura callback para quando receiver se conectar
  window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
    console.log('✅ Receiver conectou via notificação! Aceitando chamada...');
    
    // Remove tela de aguardando
    const statusElement = document.getElementById('aguardando-status');
    if (statusElement) statusElement.remove();
    
    // Aceita a chamada normalmente
    window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);
      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo) remoteVideo.srcObject = remoteStream;
      console.log('🎉 Conexão bidirecional estabelecida via notificação!');
    });
  };

  // Timeout de 30 segundos
  setTimeout(() => {
    console.log('⏰ Timeout da escuta reversa');
    window.rtcCore.onIncomingCall = null;
  }, 30000);
}

window.onload = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
   let localStream = stream;
   document.getElementById('localVideo').srcObject = localStream;

    window.rtcCore = new WebRTCCore();

   // ✅ CORRETO: Box SEMPRE visível e fixo, frase só aparece com a voz
window.rtcCore.setDataChannelCallback((mensagem) => {
  console.log('📩 Mensagem recebida:', mensagem);

  const elemento = document.getElementById('texto-recebido');
  if (elemento) {
    // Box SEMPRE visível, mas texto vazio inicialmente
    elemento.textContent = ""; // ← TEXTO FICA VAZIO NO INÍCIO
    elemento.style.opacity = '1'; // ← BOX SEMPRE VISÍVEL
    elemento.style.transition = 'opacity 0.5s ease'; // ← Transição suave
    
    // ✅ PULSAÇÃO AO RECEBER MENSAGEM:
    elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
    elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    elemento.style.border = '2px solid #ff0000';
  }

  if (window.SpeechSynthesis) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(mensagem);
    utterance.lang = window.targetTranslationLang || 'pt-BR';
    utterance.rate = 0.9;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      if (elemento) {
        // ✅ PARA A PULSAÇÃO E VOLTA AO NORMAL QUANDO A VOZ COMEÇA:
        elemento.style.animation = 'none';
        elemento.style.backgroundColor = ''; // Volta ao fundo original
        elemento.style.border = ''; // Remove a borda vermelha
        
        // SÓ MOSTRA O TEXTO QUANDO A VOZ COMEÇA
        elemento.textContent = mensagem;
      }
    };

    window.speechSynthesis.speak(utterance);
  }
});
    const myId = crypto.randomUUID().substr(0, 8);
    document.getElementById('myId').textContent = myId;

    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    const urlParams = new URLSearchParams(window.location.search);
    const receiverId = urlParams.get('targetId') || '';
    const receiverToken = urlParams.get('token') || '';
    const receiverLang = urlParams.get('lang') || 'pt-BR';

    window.receiverInfo = {
      id: receiverId,
      token: receiverToken,
      lang: receiverLang
    };

    // ✅✅✅ FLUXO MELHORADO: Tenta conexão normal PRIMEIRO, depois notificação
    if (receiverId) {
      document.getElementById('callActionBtn').style.display = 'none';
      
      if (localStream) {
        const meuIdioma = await obterIdiomaCompleto(navigator.language);
        console.log('🚀 Tentando conexão normal com receiver...');
        
        // ⭐⭐ PRIMEIRO: Tenta conexão direta
        window.rtcCore.startCall(receiverId, localStream, meuIdioma);
        
        // 🔄 MONITOR: Se conexão falhar em 5 segundos, tenta notificação
        let conexaoEstabelecida = false;
        
        const timeoutConexao = setTimeout(() => {
          if (!conexaoEstabelecida) {
            console.log('❌ Conexão normal falhou. Tentando notificação...');
            tentarFluxoNotificacao(receiverToken, receiverId, myId, meuIdioma, receiverLang);
          }
        }, 5000);
        
        // Se conectar com sucesso, cancela o timeout
        window.rtcCore.setRemoteStreamCallback(stream => {
          conexaoEstabelecida = true;
          clearTimeout(timeoutConexao);
          console.log('✅ Conexão normal estabelecida com sucesso!');
          
          stream.getAudioTracks().forEach(track => track.enabled = false);
          const remoteVideo = document.getElementById('remoteVideo');
          remoteVideo.srcObject = stream;
        });
      }
    }

    // 🔄 FUNÇÃO: Tentar fluxo de notificação apenas se conexão normal falhar
    async function tentarFluxoNotificacao(receiverToken, receiverId, meuId, meuIdioma, targetLang) {
      console.log('📞 Iniciando fluxo de notificação...');
      
      const notificacaoEnviada = await enviarNotificacaoWakeUp(
        receiverToken, 
        receiverId, 
        meuId, 
        meuIdioma, 
        targetLang
      );
      
      if (notificacaoEnviada) {
        mostrarEstadoAguardando();
        iniciarEscutaConexaoReversa(receiverId, meuId);
      } else {
        alert('❌ Não foi possível notificar o receptor. Tente novamente.');
      }
    }

    const navegadorLang = await obterIdiomaCompleto(navigator.language);

    // ✅ MANTIDO: Tradução dos títulos da interface
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation."
    };

    (async () => {
      for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
        const el = document.getElementById(id);
        if (el) {
          const traduzido = await translateText(texto, navegadorLang);
          el.textContent = traduzido;
        }
      }
    })();

    // 🏳️ Aplica bandeira do idioma local
    async function aplicarBandeiraLocal(langCode) {
      try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        const localLangElement = document.querySelector('.local-mic-Lang');
        if (localLangElement) localLangElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;
      } catch (error) {
        console.error('Erro ao carregar bandeira local:', error);
      }
    }

    // 🏳️ Aplica bandeira do idioma remoto
    async function aplicarBandeiraRemota(langCode) {
      try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;
      } catch (error) {
        console.error('Erro ao carregar bandeira remota:', error);
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
      }
    }

    aplicarBandeiraLocal(navegadorLang);
    aplicarBandeiraRemota(receiverLang);

  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
    return;
  }
};
