import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO (igual ao caller)
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

// 🌐 Tradução apenas para texto (igual ao caller)
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

// ✅ INICIALIZAÇÃO RÁPIDA (QR Code e interface)
async function initializeApp() {
  console.log('🚀 Inicializando app rapidamente...');
  
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
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const lang = params.get('lang') || navigator.language || 'pt-BR';

  window.targetTranslationLang = lang;

  // ✅ GERA QR CODE IMEDIATAMENTE
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  // ✅ INICIALIZA WebRTC
  window.rtcCore = new WebRTCCore();
  window.rtcCore.initialize(myId);
  window.rtcCore.setupSocketHandlers();

  // ✅ CONFIGURA callback das mensagens
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

  // ✅ CONFIGURA chamada recebida
  window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
    if (!window.localStream) return;

    console.log('🎯 Caller fala:', idiomaDoCaller);
    console.log('🎯 Eu (receiver) entendo:', lang);

    window.sourceTranslationLang = idiomaDoCaller;
    window.targetTranslationLang = lang;

    console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

    window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
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
  };

  // ✅ TRADUZ interface
  const frasesParaTraduzir = {
    "translator-label": "Real-time translation.",
    "qr-modal-title": "This is your online key",
    "qr-modal-description": "You can ask to scan, share or print on your business card."
  };

  for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
    const el = document.getElementById(id);
    if (el) {
      const traduzido = await translateText(texto, lang);
      el.textContent = traduzido;
    }
  }

  // ✅ APLICA bandeira
  aplicarBandeiraLocal(lang);

  // ✅ INICIALIZA tradutor
  setTimeout(() => {
    if (typeof initializeTranslator === 'function') {
      initializeTranslator();
    }
  }, 1000);
}

// ✅ INICIALIZA CÂMERA (em paralelo)
async function initializeCamera() {
  try {
    console.log('📷 Inicializando câmera...');
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    window.localStream = stream;

    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
      localVideo.srcObject = stream;
    }
    
    console.log('✅ Câmera inicializada');
  } catch (error) {
    console.error("❌ Erro ao solicitar acesso à câmera:", error);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
  }
}

// ✅ INICIALIZAÇÃO PARALELA (RÁPIDA)
window.onload = async () => {
  console.log('🎬 Iniciando carregamento paralelo...');
  
  // Inicia tudo ao mesmo tempo
  await Promise.all([
    initializeCamera(),
    initializeApp()
  ]);
  
  console.log('✅ Aplicação totalmente carregada');
};
