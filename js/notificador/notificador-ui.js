// js/notificador/notificador-ui.js - CLONE EXATO DO caller-ui.js
import { WebRTCCore } from '../../core/webrtc-core.js';

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
      headers: { 'Content-Type: 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });

    const result = await response.json();
    return result.translatedText || text;
  } catch (error) {
    console.error('Erro na tradução:', error);
    return text;
  }
}

// 🔥 CONFIGURA TELA PARA MODO CHAMADA (ADAPTADO PARA NOTIFICAÇÃO)
function configurarTelaChamada() {
    console.log('🎬 Configurando tela para modo notificação...');
    
    // ✅ ESCONDE TUDO DO QR CODE (igual ao caller quando inicia chamada)
    const qrModal = document.querySelector('.qr-modal');
    const qrContainer = document.getElementById('qrcode');
    const scanBtn = document.getElementById('scanBtn');
    
    if (qrModal) qrModal.style.display = 'none';
    if (qrContainer) qrContainer.style.display = 'none';
    if (scanBtn) scanBtn.style.display = 'none';
    
    // ✅ MOSTRA TUDO DA CHAMADA (igual ao caller)
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
    
    // ✅ MUDA TÍTULO PARA MODO NOTIFICAÇÃO
    document.title = 'Chamada Recebida - Tradutor';
    
    // ✅ ADICIONA STATUS ESPECÍFICO PARA NOTIFICAÇÃO
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

// 🏳️ Aplica bandeira do idioma local (igual ao caller)
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

// 🏳️ Aplica bandeira do idioma remoto (igual ao caller)
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

// 🔥🔥🔥 FUNÇÃO PRINCIPAL - MODO NOTIFICAÇÃO (CLONE DO caller-ui.js)
window.onload = async () => {
    try {
        console.log('🚀🔥 INICIANDO MODO NOTIFICAÇÃO - CLONE DO CALLER');

        // ✅ 1. CONFIGURA TELA IMEDIATAMENTE PARA MODO CHAMADA
        configurarTelaChamada();
        
        // ✅ 2. SOLICITA ACESSO À CÂMERA (EXATAMENTE IGUAL AO CALLER)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false  // ✅ APENAS CÂMERA - MICROFONE VEM NO TRZ
        });

        console.log('📷 Câmera acessada com sucesso (modo notificação)');

        // ✅ Captura da câmera local (igual ao caller)
        let localStream = stream;

        // ✅ Exibe vídeo local no PiP azul (igual ao caller)
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        // ✅ 3. INICIALIZA WEBRTC (igual ao caller)
        window.rtcCore = new WebRTCCore();

        // ✅✅✅ CORREÇÃO: Obtenção de parâmetros ESPECÍFICA PARA NOTIFICAÇÃO
        const params = new URLSearchParams(window.location.search);
        const pendingCaller = params.get('pendingCaller') || params.get('callerId');
        const callerLang = params.get('callerLang') || params.get('targetLang') || 'pt-BR';
        const lang = params.get('targetLang') || params.get('lang') || navigator.language || 'pt-BR';

        console.log('🔔 Parâmetros Notificação:', { 
            pendingCaller: pendingCaller || 'Nenhum',
            callerLang: callerLang,
            lang: lang
        });

        // ✅ VALIDAÇÃO ESPECÍFICA PARA NOTIFICAÇÃO
        if (!pendingCaller || pendingCaller === 'unknown') {
            console.error('❌ ERRO: Modo notificação sem pendingCaller!');
            return;
        }

        // ✅✅✅ CORREÇÃO CRÍTICA: USA pendingCaller COMO ID (MESMO QUE O CALLER ESPERA)
        const myId = pendingCaller;
        console.log('🎯 ID DO RECEIVER (USANDO pendingCaller):', myId);

        // ✅ 5. INICIALIZA WEBRTC COM ID DO CALLER (igual ao caller)
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();
        console.log('🔌 WebRTC inicializado com ID do caller:', myId);

        // ✅ 6. CONFIGURA CALLBACKS (EXATAMENTE IGUAL AO CALLER)
        window.rtcCore.setDataChannelCallback((mensagem) => {
            console.log('📩 Mensagem recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            if (elemento) {
                // ✅ Box SEMPRE visível, mas texto vazio inicialmente (igual ao caller)
                elemento.textContent = ""; // ← TEXTO FICA VAZIO NO INÍCIO
                elemento.style.opacity = '1'; // ← BOX SEMPRE VISÍVEL
                elemento.style.transition = 'opacity 0.5s ease'; // ← Transição suave
                
                // ✅ PULSAÇÃO AO RECEBER MENSAGEM (igual ao caller):
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
                        // ✅ PARA A PULSAÇÃO E VOLTA AO NORMAL QUANDO A VOZ COMEÇA (igual ao caller):
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = ''; // Volta ao fundo original
                        elemento.style.border = ''; // Remove a borda vermelha
                        
                        // ✅ SÓ MOSTRA O TEXTO QUANDO A VOZ COMEÇA (igual ao caller)
                        elemento.textContent = mensagem;
                    }
                };

                window.speechSynthesis.speak(utterance);
            }
        });

        // ✅ 7. CONFIGURA CALLBACK PARA CHAMADA RECEBIDA (igual ao caller)
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu (receiver) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                // ✅ DESABILITA ÁUDIO REMOTO (igual ao caller)
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

                // ✅ REMOVE STATUS DE CONEXÃO (específico para notificação)
                const statusElement = document.getElementById('notification-status');
                if (statusElement) statusElement.remove();
            });
        };

        // ✅ 8. APLICA BANDEIRAS (igual ao caller)
        aplicarBandeiraLocal(lang);
        if (callerLang) {
            aplicarBandeiraRemota(callerLang);
        }

        // ✅ 9. TRADUZ TEXTOS FIXOS (igual ao caller)
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

        // ✅ 10. 🔥🔥🔥 CONEXÃO DIRETA - ESCUTA POR OFFER EXISTENTE
        console.log('📞🔔 INICIANDO CONEXÃO DIRETA VIA NOTIFICAÇÃO...');
        console.log('🎯 Aguardando conexão do caller com ID:', myId);
        
        // ✅ INICIALIZA TRADUTOR (igual ao caller)
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        console.log('✅✅✅ notificador-ui.js CARREGADO COM SUCESSO (CLONE DO CALLER)');

    } catch (error) {
        console.error("❌ Erro ao solicitar acesso à câmera:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        return;
    }
};
