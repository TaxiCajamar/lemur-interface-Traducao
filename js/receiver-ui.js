import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO (RESTAURADA)
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

// 🌐 Tradução apenas para texto (RESTAURADA)
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

// ⏳ Mostrar estado "Conectando..." (NOVA)
function mostrarEstadoConectando() {
    const estadoAnterior = document.getElementById('estado-conexao');
    if (estadoAnterior) estadoAnterior.remove();
    
    const statusElement = document.createElement('div');
    statusElement.id = 'estado-conexao';
    statusElement.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                    background: rgba(0,100,0,0.8); color: white; padding: 10px 20px; 
                    border-radius: 20px; text-align: center; z-index: 1000; font-size: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔗</span>
                <span>Conectando com caller...</span>
            </div>
        </div>
    `;
    document.body.appendChild(statusElement);
    
    setTimeout(() => {
        if (statusElement.parentNode) statusElement.remove();
    }, 10000);
}

// 🔄 FUNÇÃO: Mudar para modo WebRTC (tela de conversação)
function mudarParaModoWebRTC() {
    console.log('🔄 Mudando para modo WebRTC (tela de conversação)...');
    
    // ✅ ESCONDE elementos do QR Code
    const qrModal = document.querySelector('.qr-modal');
    if (qrModal) qrModal.style.display = 'none';
    
    const qrContainer = document.getElementById('qrcode');
    if (qrContainer) qrContainer.style.display = 'none';
    
    // ✅ MOSTRA elementos da conversação WebRTC
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) videoContainer.style.display = 'block';
    
    const overlay = document.querySelector('.info-overlay');
    if (overlay) overlay.classList.remove('hidden');
    
    // ✅ Atualiza interface para modo "em chamada"
    const statusElement = document.createElement('div');
    statusElement.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                    background: rgba(0,100,0,0.8); color: white; padding: 10px 20px; 
                    border-radius: 20px; text-align: center; z-index: 1000; font-size: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>📞</span>
                <span>Conectando com caller...</span>
            </div>
        </div>
    `;
    document.body.appendChild(statusElement);
}

// 🏳️ Aplica bandeira do idioma local (RESTAURADA)
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

// 🏳️ Aplica bandeira do idioma remoto (RESTAURADA)
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

// 🔄 NOVA FUNÇÃO: Escutar por offer existente do caller
function escutarPorOfferExistente(callerId, localStream, meuIdioma) {
    console.log('👂 Escutando por offer existente do caller:', callerId);
    
    return new Promise((resolve, reject) => {
        let offerRecebido = false;
        
        // ⏰ Timeout de 15 segundos
        const timeout = setTimeout(() => {
            if (!offerRecebido) {
                console.log('❌ Timeout: Offer não recebido em 15 segundos');
                reject(new Error('Timeout esperando offer do caller'));
            }
        }, 15000);
        
        // 🔔 Configura callback para quando offer chegar
        const callbackOriginal = window.rtcCore.onIncomingCall;
        
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            console.log('✅ Offer recebido do caller!', offer ? '✅' : '❌');
            
            if (offer) {
                offerRecebido = true;
                clearTimeout(timeout);
                
                // Restaura callback original
                window.rtcCore.onIncomingCall = callbackOriginal;
                
                // Aceita a chamada existente
                window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                    remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                    const overlay = document.querySelector('.info-overlay');
                    if (overlay) overlay.classList.add('hidden');

                    const remoteVideo = document.getElementById('remoteVideo');
                    if (remoteVideo) {
                        remoteVideo.srcObject = remoteStream;
                    }

                    window.targetTranslationLang = idiomaDoCaller || window.targetTranslationLang;
                    console.log('🎯 Conexão estabelecida via notificação!');
                    
                    resolve(true);
                });
            }
        };
    });
}

window.onload = async () => {
    try {
        console.log('🚀 Iniciando receiver-ui.js...');

        // ✅✅✅ CRÍTICO: Verificar MUITO ANTES se é notificação
        const params = new URLSearchParams(window.location.search);
        const pendingCaller = params.get('pendingCaller');
        const callerLang = params.get('callerLang');

        // 🔥🔥🔥 SE FOR NOTIFICAÇÃO: Muda para tela WebRTC IMEDIATAMENTE
        if (pendingCaller) {
            console.log('🔔🔔🔔 RECEIVER ABERTO VIA NOTIFICAÇÃO! Mudando para tela WebRTC...');
            mudarParaModoWebRTC();
        }

        // ✅ 1. Solicita acesso à câmera (vídeo sem áudio)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log('📷 Câmera acessada com sucesso');

        let localStream = stream;
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        // ✅ 2. Inicializa WebRTC
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

        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        console.log('🔍 Parâmetros URL:', { 
            token: token ? '✅' : '❌', 
            lang, 
            pendingCaller: pendingCaller || 'Nenhum',
            callerLang: callerLang || 'Não informado'
        });

        window.targetTranslationLang = lang;

        // ✅ 3. COMPORTAMENTO CRÍTICO: Já verificamos acima, mas reforça
        if (pendingCaller) {
            console.log('🔔 Modo notificação ativado - Caller aguardando:', pendingCaller);

            // ✅ Aplica bandeira do CALLER se veio na notificação
            if (callerLang) {
                console.log('🎯 Aplicando bandeira do caller:', callerLang);
                aplicarBandeiraRemota(callerLang);
            }

        } else {
            // ✅ COMPORTAMENTO NORMAL: Gera QR Code normalmente
            console.log('📱 Modo normal: gerando QR Code');
            const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
            QRCodeGenerator.generate("qrcode", callerUrl);
        }

        // ✅ 4. Inicializa WebRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();
        console.log('🔌 WebRTC inicializado');

        // ✅ 5. Configura callbacks WebRTC (RESTAURADO)
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

        // ✅ 6. Callback para chamada recebida (RESTAURADO)
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

                // ✅ RESTAURADO: Aplica bandeira remota quando caller conecta
                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                } else {
                    const remoteLangElement = document.querySelector('.remoter-Lang');
                    if (remoteLangElement) remoteLangElement.textContent = '🔴';
                }
            });
        };

        // ✅ 7. 🔥 CORREÇÃO CRÍTICA: Se foi aberto via notificação, ESCUTA por offer existente
        if (pendingCaller) {
            console.log('📞 Modo notificação: Escutando por offer do caller...');
            
            const conectarViaNotificacao = async () => {
                try {
                    mostrarEstadoConectando();
                    
                    // 🔄 AGORA CORRETO: Escuta por offer existente do caller
                    await escutarPorOfferExistente(pendingCaller, localStream, lang);
                    
                    console.log('✅ Conexão estabelecida via notificação!');
                    
                } catch (error) {
                    console.error('❌ Falha na conexão via notificação:', error);
                    
                    // ⚠️ Fallback: Tenta conexão normal se escuta falhar
                    console.log('🔄 Tentando fallback para conexão normal...');
                    try {
                        const meuIdioma = await obterIdiomaCompleto(lang);
                        window.rtcCore.startCall(pendingCaller, localStream, meuIdioma);
                    } catch (fallbackError) {
                        console.error('❌ Fallback também falhou:', fallbackError);
                    }
                }
            };

            // Inicia após breve delay para WebRTC inicializar
            setTimeout(conectarViaNotificacao, 1000);
        }

        // ✅ 8. TRADUÇÃO DOS TEXTOS FIXOS (RESTAURADO)
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

        // ✅ 9. APLICA BANDEIRA LOCAL (RESTAURADO)
        aplicarBandeiraLocal(lang);

        // ✅ 10. Inicializa tradutor após tudo carregar (RESTAURADO)
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        console.log('✅ Receiver-ui.js carregado com sucesso');

    } catch (error) {
        console.error("Erro ao solicitar acesso à câmera:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        return;
    }
};
