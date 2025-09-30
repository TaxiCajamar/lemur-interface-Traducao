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

// 🔄 Inicialização RÁPIDA da interface
function inicializarInterfaceRapida() {
  // ✅ Configura elementos básicos IMEDIATAMENTE
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') || navigator.language || 'pt-BR';
  
  // 🏳️ Aplica bandeira local básica
  aplicarBandeiraLocal(lang);
  
  // 📱 Mostra QR Code placeholder ou básico
  const url = window.location.href;
  const fixedId = url.split('?')[1] || 'loading...';
  const myId = fixedId.length > 8 ? fixedId.substr(0, 8) : fixedId;
  
  const token = params.get('token') || '';
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
  
  // Gera QR Code básico (não depende de câmera)
  QRCodeGenerator.generate("qrcode", callerUrl);
  
  console.log('✅ Interface básica inicializada');
}

// 🔧 Inicialização COMPLETA (câmera + WebRTC + traduções)
async function inicializacaoCompleta() {
  try {
    console.log('🎯 Iniciando inicialização completa...');
    
    // ✅ 1. Solicita acesso à câmera (após interface estar visível)
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    // ✅ 2. Captura da câmera local
    let localStream = stream;

    // ✅ 3. Exibe vídeo local no PiP azul
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
      localVideo.srcObject = localStream;
      console.log('✅ Câmera local ativada');
    }

    // ✅ 4. Inicializa WebRTC
    window.rtcCore = new WebRTCCore();
    
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

    // ✅ 5. Atualiza QR Code com ID real
    const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
    QRCodeGenerator.generate("qrcode", callerUrl);

    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    // ✅ 6. Configura callback do data channel
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

    // ✅ 7. Configura handler de chamada recebida
    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
      if (!localStream) return;

      console.log('🎯 Caller fala:', idiomaDoCaller);
      console.log('🎯 Eu (receiver) entendo:', lang);

      window.sourceTranslationLang = idiomaDoCaller;
      window.targetTranslationLang = lang;

      console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

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
    };

    // ✅ 8. Traduz textos da interface (em background, não bloqueante)
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation.",
      "qr-modal-title": "This is your online key",
      "qr-modal-description": "You can ask to scan, share or print on your business card."
    };

    (async () => {
      for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
        const el = document.getElementById(id);
        if (el) {
          const traduzido = await translateText(texto, lang);
          el.textContent = traduzido;
        }
      }
      console.log('✅ Traduções da interface concluídas');
    })();

    // ✅ 9. Atualiza bandeira com idioma correto
    aplicarBandeiraLocal(lang);

    setTimeout(() => {
      if (typeof initializeTranslator === 'function') {
        initializeTranslator();
      }
    }, 1000);

    console.log('🎉 Inicialização completa concluída!');

  } catch (error) {
    console.error("❌ Erro na inicialização completa:", error);
    // Mostra erro para o usuário de forma amigável
    const qrCodeContainer = document.getElementById('qrcode');
    if (qrCodeContainer) {
      qrCodeContainer.innerHTML = '<p style="color: red;">Erro ao acessar câmera</p>';
    }
  }
}

// 🚀 INICIALIZAÇÃO PRINCIPAL
window.onload = async () => {
  // ✅ PASSO 1: Interface RÁPIDA (instantânea)
  inicializarInterfaceRapida();
  
  // ✅ PASSO 2: Inicialização COMPLETA (assíncrona, não bloqueante)
  setTimeout(() => {
    inicializacaoCompleta();
  }, 100); // Pequeno delay para garantir que a interface renderizou
};
