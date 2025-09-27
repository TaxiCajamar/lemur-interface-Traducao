// js/receiver-notification.js - MODO NOTIFICAÇÃO INDEPENDENTE
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

// 🔥🔥🔥 FUNÇÃO PRINCIPAL - MODO NOTIFICAÇÃO INDEPENDENTE
window.onload = async () => {
    try {
        console.log('🚀 INICIANDO MODO NOTIFICAÇÃO INDEPENDENTE');

        // ✅ 1. CONFIGURA INTERFACE PARA MODO CHAMADA
        console.log('🎬 Configurando interface para modo chamada...');
        
        // Atualiza textos para modo notificação
        const translatorLabel = document.getElementById('translator-label');
        if (translatorLabel) translatorLabel.textContent = 'Chamada Recebida';
        
        const connectionTitle = document.getElementById('connection-title');
        if (connectionTitle) connectionTitle.textContent = 'Conectando...';

        // ✅ 2. SOLICITA ACESSO À CÂMERA E MICROFONE JUNTOS
        console.log('📷🎤 Solicitando acesso à câmera e microfone...');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });

        let localStream = stream;
        window.localStream = localStream;
        
        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;

        // ✅ 3. INICIALIZA WEBRTC
        window.rtcCore = new WebRTCCore();

        const params = new URLSearchParams(window.location.search);
        const pendingCaller = params.get('pendingCaller');
        const callerLang = params.get('callerLang');
        const receiverId = params.get('receiverId');
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        console.log('🔔 Parâmetros notificação:', { 
            pendingCaller, 
            callerLang, 
            receiverId 
        });

        if (!pendingCaller) {
            console.error('❌ ERRO: Modo notificação sem pendingCaller!');
            alert('Link de notificação inválido.');
            return;
        }

        // ✅ 4. ID FIXO DO RECEIVER (do QR code impresso)
        let myId;
        if (receiverId) {
            myId = receiverId; // ✅ ID do QR code impresso
            console.log('🎯 Usando ID fixo do receiver:', myId);
        } else {
            // Fallback: gera ID da URL
            const url = window.location.href;
            const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);
            
            function fakeRandomUUID(fixedValue) {
                return {
                    substr: function(start, length) {
                        return fixedValue.substr(start, length);
                    }
                };
            }
            
            myId = fakeRandomUUID(fixedId).substr(0, 8);
            console.log('🔄 Usando ID gerado:', myId);
        }

        window.targetTranslationLang = lang;

        // ✅ 5. INICIALIZA WEBRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ 6. CONFIGURA CALLBACK PARA MENSAGENS RECEBIDAS
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

        // ✅ 7. CONFIGURA CALLBACK PARA CHAMADA RECEBIDA
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Chamada recebida do caller:', idiomaDoCaller);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                // ✅ ESCONDE OVERLAY DE CONEXÃO
                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) remoteVideo.srcObject = remoteStream;

                window.targetTranslationLang = idiomaDoCaller || lang;

                // ✅ ATUALIZA INTERFACE PARA "CONECTADO"
                const translatorLabel = document.getElementById('translator-label');
                if (translatorLabel) translatorLabel.textContent = 'Chamada Ativa';

                // ✅ APLICA BANDEIRA DO CALLER
                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }

                console.log('✅ CONEXÃO ESTABELECIDA VIA NOTIFICAÇÃO!');
            });
        };

        // ✅ 8. APLICA BANDEIRAS
        aplicarBandeiraLocal(lang);
        if (callerLang) aplicarBandeiraRemota(callerLang);

        // ✅ 9. TRADUZ TEXTOS DA INTERFACE
        const frasesParaTraduzir = {
            "translator-label": "Real-time translation.",
            "connection-title": "Incoming Call",
            "connection-description": "You received a call via notification."
        };

        for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
            const el = document.getElementById(id);
            if (el) {
                const traduzido = await translateText(texto, lang);
                el.textContent = traduzido;
            }
        }

        // ✅ 10. AVISA O TRADUTOR QUE O MICROFONE JÁ ESTÁ CONCEDIDO
        setTimeout(() => {
            window.microphonePermissionGranted = true;
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        console.log('✅ MODO NOTIFICAÇÃO INDEPENDENTE PRONTO!');

    } catch (error) {
        console.error("❌ Erro no modo notificação:", error);
        
        // ✅ MOSTRA ERRO NA INTERFACE
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.innerHTML = `
                <div style="text-align: center; color: white; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">❌</div>
                    <div>Erro na conexão</div>
                    <div style="font-size: 12px; opacity: 0.8;">Tente novamente</div>
                </div>
            `;
        }
        
        alert("Erro ao iniciar chamada. Verifique as permissões de câmera e microfone.");
    }
};
