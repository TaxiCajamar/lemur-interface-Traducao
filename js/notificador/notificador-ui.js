// js/receiver-notification.js - MODO NOTIFICAÇÃO APENAS (CORRIGIDO)
import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;

  try {
    const response = await fetch('./assets/bandeiras/language-flags.json');
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
    
    // ✅ ESCONDE TUDO DO QR CODE
    const qrModal = document.querySelector('.qr-modal');
    const qrContainer = document.getElementById('qrcode');
    const scanBtn = document.getElementById('scanBtn');
    
    if (qrModal) qrModal.style.display = 'none';
    if (qrContainer) qrContainer.style.display = 'none';
    if (scanBtn) scanBtn.style.display = 'none';
    
    // ✅ MOSTRA TUDO DA CHAMADA
    const videoContainer = document.querySelector('.video-container');
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const overlay = document.querySelector('.info-overlay');
    
    if (videoContainer) videoContainer.style.display = 'flex';
    if (localVideo) localVideo.style.display = 'block';
    if (remoteVideo) remoteVideo.style.display = 'block';
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'block';
    }
    
    // ✅ MUDA TÍTULO
    document.title = 'Chamada Recebida - Tradutor';
    
    // ✅ ADICIONA STATUS
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

// 🔥🔥🔥 FUNÇÃO PRINCIPAL - MODO NOTIFICAÇÃO (CORRIGIDA)
window.onload = async () => {
    try {
        console.log('🚀🔥 INICIANDO MODO NOTIFICAÇÃO - receiver-notification.js');
        
        // ✅ 1. CONFIGURA TELA IMEDIATAMENTE
        configurarTelaChamada();
        
        // ✅ 2. SOLICITA ACESSO À CÂMERA
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log('📷 Câmera acessada com sucesso');

        let localStream = stream;
        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;

        // ✅ 3. INICIALIZA WEBRTC
        window.rtcCore = new WebRTCCore();

        const params = new URLSearchParams(window.location.search);
        const pendingCaller = params.get('pendingCaller');
        const callerLang = params.get('callerLang');
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        const token = params.get('token') || '';

        console.log('🔔 Parâmetros Notificação:', { 
            pendingCaller: pendingCaller || 'Nenhum',
            callerLang: callerLang || 'Não informado',
            lang: lang
        });

        if (!pendingCaller) {
            console.error('❌ ERRO: Modo notificação sem pendingCaller!');
            return;
        }

        // ✅✅✅ 4. CORREÇÃO CRÍTICA: USA ID FIXO (IGUAL AO ORIGINAL)
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
        console.log('🎯 ID FIXO DO RECEIVER:', myId);

        // ✅ 5. INICIALIZA WEBRTC COM ID FIXO
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();
        console.log('🔌 WebRTC inicializado com ID fixo');

        // ✅ 6. CONFIGURA CALLBACKS (MESMO DO ORIGINAL)
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

        // ✅ 7. CONFIGURA CALLBACK PARA CHAMADA RECEBIDA
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            console.log('🎯 Offer recebido do caller:', idiomaDoCaller);

            if (!localStream) return;

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

                // ✅ APLICA BANDEIRA
                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }

                console.log('✅✅✅ CONEXÃO ESTABELECIDA VIA NOTIFICAÇÃO!');
            });
        };

        // ✅ 8. APLICA BANDEIRAS
        aplicarBandeiraLocal(lang);
        if (callerLang) {
            aplicarBandeiraRemota(callerLang);
        }

        // ✅ 9. TRADUZ TEXTOS FIXOS
        const frasesParaTraduzir = {
            "translator-label": "Real-time translation."
        };

       (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
        const el = document.getElementById(id);
        if (el) {
            const traduzido = await translateText(texto, lang); // ✅ await dentro de async
            el.textContent = traduzido;
        }
    }
})();

        // ✅ 10. 🔥🔥🔥 CONEXÃO DIRETA - ESCUTA POR OFFER EXISTENTE
        console.log('📞🔔 INICIANDO CONEXÃO DIRETA VIA NOTIFICAÇÃO...');
        
        let offerRecebido = false;
        
        // ⏰ TIMEOUT DE 20 SEGUNDOS
        const timeout = setTimeout(() => {
            if (!offerRecebido) {
                console.log('❌ Timeout: Tentando fallback...');
                
                // FALLBACK: Tenta iniciar chamada
                const meuIdioma = await obterIdiomaCompleto(lang);
                window.rtcCore.startCall(pendingCaller, localStream, meuIdioma);
            }
        }, 20000);
        
        // ✅ CONFIGURA ESCUTA
        const callbackOriginal = window.rtcCore.onIncomingCall;
        
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            console.log('✅✅✅ OFFER RECEBIDO DO CALLER!');
            
            if (offer) {
                offerRecebido = true;
                clearTimeout(timeout);
                window.rtcCore.onIncomingCall = callbackOriginal;
                
                window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                    remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                    const overlay = document.querySelector('.info-overlay');
                    if (overlay) overlay.classList.add('hidden');

                    const remoteVideo = document.getElementById('remoteVideo');
                    if (remoteVideo) remoteVideo.srcObject = remoteStream;

                    // ✅ REMOVE STATUS
                    const statusElement = document.getElementById('notification-status');
                    if (statusElement) statusElement.remove();

                    console.log('🎉🎉🎉 CONEXÃO BIDIRECIONAL ESTABELECIDA!');
                });
            }
        };

        // ✅ INICIALIZA TRADUTOR
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        console.log('✅✅✅ receiver-notification.js CARREGADO COM SUCESSO');

    } catch (error) {
        console.error("❌ Erro no modo notificação:", error);
        
        const statusElement = document.getElementById('notification-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="background: #cc0000; color: white; padding: 15px; text-align: center;">
                    ❌ Erro na conexão. Tente novamente.
                </div>
            `;
        }
    }
};
