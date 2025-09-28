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

// 🔔 FUNÇÃO: Notificar servidor que estou online
async function notificarServidorOnline(meuId, meuIdioma) {
  try {
    console.log('📢 Notificando servidor que estou online:', meuId);
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/user-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: meuId,
        userLang: meuIdioma,
        status: 'online',
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    console.log('✅ Servidor notificado:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao notificar servidor:', error);
    return false;
  }
}

// 🔥 FUNÇÃO: Iniciar chamada quando acordado por notificação
async function iniciarChamadaQuandoAcordado(callerId, callerLang) {
  console.log('🔥 Acordado por notificação! Iniciando chamada para:', callerId);
  
  // Remove tela de aguardando
  const statusElement = document.getElementById('aguardando-status');
  if (statusElement) statusElement.remove();
  
  // Mostra estado de conectando
  const conectandoElement = document.createElement('div');
  conectandoElement.id = 'conectando-status';
  conectandoElement.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                text-align: center; z-index: 1000;">
      <div style="font-size: 24px; margin-bottom: 10px;">🔥</div>
      <div>Conectando com caller...</div>
      <div style="font-size: 12px; opacity: 0.8;">Iniciando chamada</div>
    </div>
  `;
  document.body.appendChild(conectandoElement);
  
  try {
    // ⭐⭐ RECEIVER toma iniciativa de conectar com CALLER
    if (window.rtcCore && window.localStream) {
      window.rtcCore.startCall(callerId, window.localStream, callerLang);
      console.log('✅ Chamada iniciada pelo receiver para o caller');
    }
  } catch (error) {
    console.error('❌ Erro ao iniciar chamada:', error);
    if (conectandoElement) conectandoElement.remove();
  }
}

// ⏳ FUNÇÃO: Mostrar estado "Aguardando chamadas"
function mostrarEstadoAguardando() {
  const statusElement = document.createElement('div');
  statusElement.id = 'aguardando-status';
  statusElement.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                text-align: center; z-index: 1000;">
      <div style="font-size: 24px; margin-bottom: 10px;">📞</div>
      <div>Aguardando chamada...</div>
      <div style="font-size: 12px; opacity: 0.8;">Pronto para receber conexão</div>
    </div>
  `;
  document.body.appendChild(statusElement);
}

window.onload = async () => {
  try {
    // ✅✅✅ SOLICITAÇÃO DE CÂMERA
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    let localStream = stream;
    window.localStream = localStream; // Disponibiliza globalmente
    
    // ✅✅✅ CONFIGURAÇÃO DO VÍDEO LOCAL
    const localVideo = document.getElementById('localVideo');
    if (localVideo) localVideo.srcObject = localStream;

    // ✅✅✅ INICIALIZAÇÃO WebRTC
    window.rtcCore = new WebRTCCore();

    // ✅✅✅ DATA CHANNEL CALLBACK
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

    // ✅✅✅ GERA ID (USA DA URL SE EXISTIR)
    const urlParams = new URLSearchParams(window.location.search);
    const meuId = urlParams.get('id') || crypto.randomUUID().substr(0, 8);
    
    // ✅✅✅ ATUALIZA O ID NA INTERFACE
    const myIdElement = document.getElementById('myId');
    if (myIdElement) myIdElement.textContent = meuId;

    // ✅✅✅ INICIALIZA WebRTC
    window.rtcCore.initialize(meuId);
    window.rtcCore.setupSocketHandlers();

    // ✅✅✅ AVISA SERVIDOR QUE ESTOU ONLINE!
    const meuIdioma = await obterIdiomaCompleto(urlParams.get('lang') || navigator.language);
    await notificarServidorOnline(meuId, meuIdioma);

    // ✅✅✅ CONFIGURA RECEPÇÃO DE CHAMADAS
    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller, callerId) => {
      console.log('📞 Chamada recebida de:', callerId);
      
      // Remove tela de aguardando se existir
      const statusElement = document.getElementById('aguardando-status');
      if (statusElement) statusElement.remove();
      
      const conectandoElement = document.getElementById('conectando-status');
      if (conectandoElement) conectandoElement.remove();
      
      // ✅✅✅ ACEITA CHAMADA AUTOMATICAMENTE
      window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        console.log('✅ Chamada atendida com sucesso!');
        
        // ✅✅✅ CONFIGURA VÍDEO REMOTO
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) remoteVideo.srcObject = remoteStream;
      });
    };

    // ✅✅✅ VERIFICA SE FOI ACORDADO POR NOTIFICAÇÃO
    const urlParams = new URLSearchParams(window.location.search);
    const wakeupCallerId = urlParams.get('callerId');
    const wakeupCallerLang = urlParams.get('callerLang');
    
    if (wakeupCallerId) {
      console.log('🔥🔥🔥 ACORDADO POR NOTIFICAÇÃO - Iniciando chamada reversa');
      // Pequeno delay para garantir que tudo está inicializado
      setTimeout(() => {
        iniciarChamadaQuandoAcordado(wakeupCallerId, wakeupCallerLang);
      }, 1000);
    } else {
      // ✅✅✅ SE NÃO FOI ACORDADO, MOSTRA ESTADO NORMAL
      mostrarEstadoAguardando();
    }

    // ✅✅✅ TRADUÇÃO DA INTERFACE
    const navegadorLang = await obterIdiomaCompleto(navigator.language);
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

    // ✅✅✅ BANDEIRAS DE IDIOMA
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
    aplicarBandeiraRemota(meuIdioma);

    console.log('✅ Notificador inicializado - Aguardando chamadas');

  } catch (error) {
    console.error("❌ Erro ao inicializar notificador:", error);
    
    // ✅✅✅ TRATAMENTO DE ERRO
    const errorElement = document.createElement('div');
    errorElement.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                  background: #f44336; color: white; display: flex; 
                  align-items: center; justify-content: center; text-align: center;">
        <div>
          <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
          <div style="font-size: 18px; margin-bottom: 10px;">Erro ao carregar</div>
          <div style="font-size: 14px; opacity: 0.8;">Recarregue a página</div>
        </div>
      </div>
    `;
    document.body.appendChild(errorElement);
  }
};
