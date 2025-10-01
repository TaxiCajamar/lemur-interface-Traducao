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

// 🔔 FUNÇÃO: Notificação SIMPLES para acordar receiver
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma) {
  try {
    console.log('🔔 Enviando notificação para acordar receiver...');
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: receiverToken,
        title: '📞 Nova Chamada',
        body: `Toque para atender a chamada`,
        data: {
          type: 'wake_up',
          callerId: meuId,
          callerLang: meuIdioma
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

// ⏳ FUNÇÃO: Mostrar estado "Aguardando resposta" COM ATRASO
function mostrarEstadoAguardando() {
  const statusElement = document.createElement('div');
  statusElement.id = 'aguardando-status';
  statusElement.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                text-align: center; z-index: 1000;">
      <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
      <div>Preparando conexão...</div>
      <div style="font-size: 12px; opacity: 0.8;">Iniciando em 3 segundos</div>
    </div>
  `;
  document.body.appendChild(statusElement);

  return statusElement;
}

// 🔄 FUNÇÃO UNIFICADA: Tentar conexão + notificação se necessário COM ATRASO
async function iniciarConexaoUnificada(receiverId, receiverToken, meuId, localStream, meuIdioma) {
  console.log('🚀 Agendando fluxo unificado de conexão em 3 segundos...');
  
  let conexaoEstabelecida = false;
  let tentativasRestantes = 15; // 30 segundos no total
  let notificacaoEnviada = false;
  
  // ✅ MOSTRA ESTADO INICIAL COM ATRASO
  const statusElement = mostrarEstadoAguardando();
  
  // ⏰ ATRASO DE 3 SEGUNDOS ANTES DE COMEÇAR AS TENTATIVAS
  setTimeout(() => {
    
    // ATUALIZA A INTERFACE PARA "CONECTANDO"
    statusElement.innerHTML = `
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                  text-align: center; z-index: 1000;">
        <div style="font-size: 24px; margin-bottom: 10px;">📞</div>
        <div>Conectando com receptor...</div>
        <div style="font-size: 12px; opacity: 0.8;">Aguardando resposta</div>
        <div id="contador-tempo" style="margin-top: 10px;">30s</div>
      </div>
    `;

    let tempoRestante = 30;
    const contador = setInterval(() => {
      tempoRestante--;
      const contadorElement = document.getElementById('contador-tempo');
      if (contadorElement) contadorElement.textContent = tempoRestante + 's';
      
      if (tempoRestante <= 0) {
        clearInterval(contador);
        if (!conexaoEstabelecida) {
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
      }
    }, 1000);

    const tentarConexao = async () => {
      if (conexaoEstabelecida) return;
      
      if (tentativasRestantes > 0) {
        console.log(`🔄 Tentativa ${16 - tentativasRestantes} de conexão com: ${receiverId}`);
        
        // Tenta conexão direta
        window.rtcCore.startCall(receiverId, localStream, meuIdioma);
        
        tentativasRestantes--;
        
        // Se é a 3ª tentativa e ainda não enviou notificação, ENVIA
        if (tentativasRestantes === 12 && !notificacaoEnviada) {
          console.log('📨 Enviando notificação wake-up...');
          notificacaoEnviada = await enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma);
        }
        
        // Agenda próxima tentativa
        setTimeout(tentarConexao, 2000);
      } else {
        console.log('❌ Timeout - Não foi possível conectar');
        if (!conexaoEstabelecida) {
          statusElement.innerHTML = `
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
              <div>Não foi possível conectar</div>
              <button onclick="this.parentElement.parentElement.remove()" 
                      style="margin-top: 10px; padding: 5px 10px; background: #ff4444; color: white; border: none; border-radius: 5px;">
                Fechar
              </button>
            </div>
          `;
        }
      }
    };
    
    // ✅ INICIA AS TENTATIVAS APÓS O ATRASO
    tentarConexao();
    
  }, 3000); // ⏰ ATRASO DE 3 SEGUNDOS
  
  // Callback quando conexão é estabelecida
  window.rtcCore.setRemoteStreamCallback(stream => {
    conexaoEstabelecida = true;
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Remove tela de aguardando
    if (statusElement) statusElement.remove();
    
    // Configura stream remoto
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = stream;
  });
}

window.onload = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    let localStream = stream;
    document.getElementById('localVideo').srcObject = localStream;

    window.rtcCore = new WebRTCCore();

    // ✅ CORRETO: Data Channel Callback
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

    // ✅✅✅ FLUXO UNIFICADO: Se tem receiverId, inicia conexão COM ATRASO
    if (receiverId) {
      document.getElementById('callActionBtn').style.display = 'none';
      
      if (localStream) {
        const meuIdioma = await obterIdiomaCompleto(navigator.language);
        
        // ⭐⭐ INICIA FLUXO UNIFICADO COM ATRASO
        iniciarConexaoUnificada(receiverId, receiverToken, myId, localStream, meuIdioma);
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
