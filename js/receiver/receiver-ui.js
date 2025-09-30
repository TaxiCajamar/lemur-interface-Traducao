import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

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

// 🔄 INICIALIZAÇÃO PRINCIPAL OTIMIZADA
window.onload = async () => {
  console.log('🚀 Iniciando carregamento...');
  
  // ✅ 1. PRIMEIRO: Configuração Básica IMEDIATA (síncrona)
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || navigator.language || 'pt-BR';
  const url = window.location.href;
  const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);
  
  function fakeRandomUUID(fixedValue) {
    return {
      substr: function(start, length) {
        return fixedValue.substr(start, length);
      }
    };
  }

  const myId = fakeRandomUUID(fixedId).substr(0, 8);
  const token = params.get('token') || '';
  window.targetTranslationLang = lang;

  // ✅ 2. GERA QR CODE IMEDIATAMENTE (sem esperar câmera)
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
  QRCodeGenerator.generate("qrcode", callerUrl);
  
  // ✅ 3. Aplica bandeira local básica
  aplicarBandeiraLocal(lang);
  
  console.log('✅ Interface básica renderizada');

  // ✅ 4. AGORA inicia processos ASSÍNCRONOS (não bloqueantes)
  try {
    // 🔄 4.1. Inicia traduções em background
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation.",
      "qr-modal-title": "This is your online key", 
      "qr-modal-description": "You can ask to scan, share or print on your business card."
    };

    Promise.all(
      Object.entries(frasesParaTraduzir).map(async ([id, texto]) => {
        const el = document.getElementById(id);
        if (el) {
          const traduzido = await translateText(texto, lang);
          el.textContent = traduzido;
        }
      })
    ).then(() => {
      console.log('✅ Traduções concluídas');
    });

    // 🔄 4.2. Inicializa WebRTC (sem câmera ainda)
    window.rtcCore = new WebRTCCore();
    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    // 🔄 4.3. Configura callback do data channel
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

    // 🔄 4.4. Configura handler de chamada recebida
    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
      console.log('🎯 Caller fala:', idiomaDoCaller);
      console.log('🎯 Eu (receiver) entendo:', lang);

      window.sourceTranslationLang = idiomaDoCaller;
      window.targetTranslationLang = lang;

      // ⚠️ AGORA solicita câmera apenas quando necessário
      inicializarCameraEResponderChamada(offer, idiomaDoCaller, lang);
    };

    // 🔄 4.5. SÓ DEPOIS de tudo: tenta inicializar câmera (opcional)
    setTimeout(async () => {
      try {
        console.log('🎥 Tentando inicializar câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
          localVideo.srcObject = stream;
          console.log('✅ Câmera inicializada com sucesso');
        }
      } catch (error) {
        console.log('⚠️ Câmera não inicializada, mas interface funciona:', error);
        // A interface continua funcionando mesmo sem câmera
      }
    }, 2000); // Delay para não competir com renderização inicial

  } catch (error) {
    console.error('❌ Erro em processos assíncronos:', error);
  }
};

// 📹 Função separada para inicializar câmera apenas quando necessário
async function inicializarCameraEResponderChamada(offer, idiomaDoCaller, lang) {
  try {
    console.log('📹 Inicializando câmera para responder chamada...');
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    const localStream = stream;
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
      localVideo.srcObject = localStream;
    }

    window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      const overlay = document.querySelector('.info-overlay');
      if (overlay) overlay.classList.add('hidden');

      const remoteVideo = document.getElementById('remoteVideo');
      if (remoteVideo) {
        remoteVideo.srcObject = remoteStream;
      }

      window.targetTranslationLang = idiomaDoCaller || lang;
      console.log('🎯 Idioma definido para tradução:', window.targetTranslationLang);

      if (idiomaDoCaller) {
        aplicarBandeiraRemota(idiomaDoCaller);
      } else {
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
      }
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar câmera para chamada:', error);
    alert('Não foi possível acessar a câmera para atender a chamada.');
  }
}

// 🔧 Inicializa tradutor se existir
setTimeout(() => {
  if (typeof initializeTranslator === 'function') {
    initializeTranslator();
  }
}, 3000);
