// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../core/webrtc-core.js';

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

// 🔔 NOVA FUNÇÃO: Enviar notificação FCM para acordar receiver
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId) {
  try {
    console.log('🔔 Enviando notificação FCM para acordar receiver...');
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: receiverToken,
        title: '📞 Chamada de Tradução',
        body: 'Alguém quer conversar com você!',
        data: {
          type: 'wake_up_call',
          callerId: meuId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          url: window.location.origin + '/receiver.html?pendingCaller=' + meuId
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

// 🔍 NOVA FUNÇÃO: Verificar se receiver está online
function verificarReceiverOnline(receiverId) {
  return new Promise((resolve) => {
    // Timeout de 3 segundos para verificação
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout - receiver não respondeu');
      resolve(false);
    }, 3000);

    // Tenta enviar mensagem de teste via WebRTC
    if (window.rtcCore && window.rtcCore.socket) {
      window.rtcCore.socket.emit('test-connection', receiverId, (response) => {
        clearTimeout(timeout);
        if (response && response.online) {
          console.log('✅ Receiver está online');
          resolve(true);
        } else {
          console.log('❌ Receiver offline');
          resolve(false);
        }
      });
    } else {
      clearTimeout(timeout);
      console.log('❌ Socket não disponível');
      resolve(false);
    }
  });
}

// ⏳ NOVA FUNÇÃO: Mostrar estado "Aguardando resposta"
function mostrarEstadoAguardando() {
  const statusElement = document.createElement('div');
  statusElement.id = 'aguardando-status';
  statusElement.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                text-align: center; z-index: 1000;">
      <div style="font-size: 24px; margin-bottom: 10px;">📞</div>
      <div>Chamando...</div>
      <div style="font-size: 12px; opacity: 0.8;">Aguardando receptor atender</div>
      <div id="contador-tempo" style="margin-top: 10px;">30s</div>
    </div>
  `;
  document.body.appendChild(statusElement);

  // Contador de 30 segundos
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

// 🔄 NOVA FUNÇÃO: Iniciar escuta para conexão reversa
function iniciarEscutaConexaoReversa(receiverId, meuId) {
  console.log('👂 Escutando por conexão reversa do receiver...');
  
  // Configura callback para quando receiver se conectar
  window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
    console.log('✅ Receiver conectou! Aceitando chamada...');
    
    // Remove tela de aguardando
    const statusElement = document.getElementById('aguardando-status');
    if (statusElement) statusElement.remove();
    
    // Aceita a chamada normalmente
    window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);
      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo) remoteVideo.srcObject = remoteStream;
    });
  };

  // Timeout de 30 segundos
  setTimeout(() => {
    console.log('⏰ Timeout da escuta reversa');
    window.rtcCore.onIncomingCall = null; // Remove listener
  }, 30000);
}

window.onload = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    window.localStream = stream;
    document.getElementById('localVideo').srcObject = window.localStream;

    window.rtcCore = new WebRTCCore();

    // ✅ CORRETO: Box SEMPRE visível e fixo, frase só aparece com a voz
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('📩 Mensagem recebida:', mensagem);

      const elemento = document.getElementById('texto-recebido');
      if (elemento) {
        elemento.textContent = "";
        elemento.style.opacity = '1';
        elemento.style.transition = 'opacity 0.5s ease';
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
            elemento.style.animation = 'none';
            elemento.style.backgroundColor = '';
            elemento.style.border = '';
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

    // ✅ AUTOMATIZADO - AGORA COM VERIFICAÇÃO BIDIRECIONAL
    if (receiverId) {
      document.getElementById('callActionBtn').style.display = 'none';
      
      if (window.localStream) {
        const meuIdioma = await obterIdiomaCompleto(navigator.language);
        
        // 🔄 NOVO FLUXO: Verifica se receiver está online primeiro
        console.log('🔍 Verificando se receiver está online...');
        const isOnline = await verificarReceiverOnline(receiverId);
        
        if (isOnline) {
          // ✅ RECEIVER ONLINE: Funciona como antes
          console.log('🚀 Chamada automática iniciada. Idioma:', meuIdioma);
          window.rtcCore.startCall(receiverId, window.localStream, meuIdioma);
        } else {
          // 🔔 RECEIVER OFFLINE: Novo fluxo bidirecional
          console.log('📞 Receiver offline. Enviando notificação...');
          const notificacaoEnviada = await enviarNotificacaoWakeUp(receiverToken, receiverId, myId);
          
          if (notificacaoEnviada) {
            mostrarEstadoAguardando();
            iniciarEscutaConexaoReversa(receiverId, myId);
          } else {
            alert('❌ Não foi possível notificar o receptor. Tente novamente.');
          }
        }
      }
    }

    window.rtcCore.setRemoteStreamCallback(stream => {
      stream.getAudioTracks().forEach(track => track.enabled = false);
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = stream;
    });

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
