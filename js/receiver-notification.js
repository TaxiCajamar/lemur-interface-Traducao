// js/receiver-notification.js - VERSÃO COMPLETA (modo notificação)
import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

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

// 🔥 CONFIGURA TELA PARA MODO CHAMADA
function configurarTelaChamada() {
    console.log('🎬 Configurando tela para modo chamada...');
    
    // ✅ ESCONDE ELEMENTOS DO QR CODE
    const qrModal = document.querySelector('.qr-modal');
    const qrContainer = document.getElementById('qrcode');
    if (qrModal) qrModal.style.display = 'none';
    if (qrContainer) qrContainer.style.display = 'none';
    
    // ✅ STATUS DE CONEXÃO
    const statusElement = document.createElement('div');
    statusElement.id = 'notification-status';
    statusElement.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; 
                    background: linear-gradient(90deg, #006400, #008000);
                    color: white; padding: 15px; text-align: center; 
                    z-index: 10000; font-size: 16px; font-weight: bold;">
            📞 CONECTANDO COM CHAMADOR...
        </div>
    `;
    document.body.insertBefore(statusElement, document.body.firstChild);
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

// 🔥🔥🔥 FUNÇÃO PRINCIPAL - MODO NOTIFICAÇÃO COMPLETO
window.onload = async () => {
    try {
        console.log('🚀 INICIANDO MODO NOTIFICAÇÃO COMPLETO');

        // ✅ 1. CONFIGURA TELA
        configurarTelaChamada();
        
        // ✅ 2. SOLICITA ACESSO À CÂMERA
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        let localStream = stream;
        window.localStream = localStream; // ✅ IMPORTANTE: Define global
        
        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;

        // ✅ 3. INICIALIZA WEBRTC
        window.rtcCore = new WebRTCCore();

        const params = new URLSearchParams(window.location.search);
        const pendingCaller = params.get('pendingCaller');
        const callerLang = params.get('callerLang');
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        const token = params.get('token') || '';

        console.log('🔔 Modo Notificação - Caller:', pendingCaller);

        if (!pendingCaller) {
            console.error('❌ ERRO: Modo notificação sem pendingCaller!');
            return;
        }

        // ✅ 4. GERA ID FIXO
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
        window.targetTranslationLang = lang;

        // ✅ 5. INICIALIZA WEBRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ 6. CONFIGURA CALLBACKS
        window.rtcCore.setDataChannelCallback((mensagem) => {
            console.log('📩 Mensagem recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
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

        // ✅ 7. CONFIGURA CHAMADA RECEBIDA
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller fala:', idiomaDoCaller);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) remoteVideo.srcObject = remoteStream;

                window.targetTranslationLang = idiomaDoCaller || lang;

                // ✅ REMOVE STATUS DE CONEXÃO
                const statusElement = document.getElementById('notification-status');
                if (statusElement) statusElement.remove();

                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }

                console.log('✅ CONEXÃO ESTABELECIDA VIA NOTIFICAÇÃO!');
            });
        };

        // ✅ 8. APLICA BANDEIRAS
        aplicarBandeiraLocal(lang);
        if (callerLang) aplicarBandeiraRemota(callerLang);

        // ✅ 9. TRADUZ TEXTOS FIXOS
        const frasesParaTraduzir = {
            "translator-label": "Real-time translation."
        };

        for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
            const el = document.getElementById(id);
            if (el) {
                const traduzido = await translateText(texto, lang);
                el.textContent = traduzido;
            }
        }

        // ✅ 10. INICIALIZA TRADUTOR
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        console.log('✅ receiver-notification.js PRONTO');

    } catch (error) {
        console.error("❌ Erro no modo notificação:", error);
        
        const statusElement = document.getElementById('notification-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="background: #cc0000; color: white; padding: 15px; text-align: center;">
                    ❌ Erro na conexão
                </div>
            `;
        }
    }
};
