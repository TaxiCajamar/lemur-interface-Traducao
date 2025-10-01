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

window.onload = async () => {
    console.log("🎯 Iniciando carregamento...");
    
    let localStream = null;
    
    try {
        // ✅ **SOLUÇÃO: Primeiro verifica se existe câmera, depois solicita**
        console.log("🔍 Verificando dispositivos de mídia disponíveis...");
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log(`📹 Câmeras encontradas: ${videoDevices.length}`);
        
        if (videoDevices.length === 0) {
            console.log("⚠️ Nenhuma câmera encontrada, pulando solicitação...");
            throw new Error("Nenhuma câmera disponível");
        }
        
        // ✅ Só solicita permissão se houver câmera
        console.log("🎥 Solicitando acesso à câmera...");
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log("✅ Câmera autorizada com sucesso!");
        
        // ✅ Exibe vídeo local
        const localVideo = document.getElementById('localVideo');
        if (localVideo && localStream) {
            localVideo.srcObject = localStream;
        }

    } catch (error) {
        console.log("ℹ️ Câmera não disponível ou não autorizada, continuando sem vídeo...");
        // ⚠️ Não mostra alerta, apenas continua sem câmera
    }

    // ✅ **AGORA INICIALIZA TUDO (com ou sem câmera)**
    console.log("🚀 Inicializando WebRTC e interface...");
    
    window.rtcCore = new WebRTCCore();

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

    const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
    QRCodeGenerator.generate("qrcode", callerUrl);

    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

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

    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
        if (!localStream) {
            console.log("⚠️ Chamada recebida, mas sem câmera local");
            return;
        }

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

    // ✅ Traduções
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
    })();

    aplicarBandeiraLocal(lang);

    setTimeout(() => {
        if (typeof initializeTranslator === 'function') {
            initializeTranslator();
        }
    }, 1000);

    console.log("🎉 Aplicação carregada com sucesso!");
};
