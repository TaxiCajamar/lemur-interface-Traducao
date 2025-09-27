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

// 🔥🔥🔥 FUNÇÃO FORTE PARA MUDAR TELA - VERSÃO MELHORADA
function mudarParaModoWebRTC() {
    console.log('🔄🔥 MUDANDO PARA MODO WEBRTC COM FORÇA!');
    
    // ✅ PARA TUDO QUE É DO QR CODE
    const qrModal = document.querySelector('.qr-modal');
    const qrContainer = document.getElementById('qrcode');
    const scanBtn = document.getElementById('scanBtn');
    
    if (qrModal) {
        qrModal.style.display = 'none';
        qrModal.style.visibility = 'hidden';
        qrModal.style.opacity = '0';
    }
    
    if (qrContainer) {
        qrContainer.style.display = 'none';
        qrContainer.innerHTML = ''; // Limpa QR code se já foi gerado
    }
    
    if (scanBtn) {
        scanBtn.style.display = 'none';
    }
    
    // ✅ MOSTRA TUDO DO WEBRTC
    const videoContainer = document.querySelector('.video-container');
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const overlay = document.querySelector('.info-overlay');
    
    if (videoContainer) {
        videoContainer.style.display = 'flex';
        videoContainer.style.visibility = 'visible';
        videoContainer.style.opacity = '1';
    }
    
    if (localVideo) {
        localVideo.style.display = 'block';
    }
    
    if (remoteVideo) {
        remoteVideo.style.display = 'block';
    }
    
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'block';
    }
    
    // ✅ MUDA O TÍTULO DA PÁGINA
    document.title = 'Conectando... - Tradutor';
    
    // ✅ ADICIONA STATUS DE CONEXÃO
    const existingStatus = document.getElementById('connection-status');
    if (existingStatus) existingStatus.remove();
    
    const statusElement = document.createElement('div');
    statusElement.id = 'connection-status';
    statusElement.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; 
                    background: linear-gradient(90deg, #006400, #008000);
                    color: white; padding: 15px; text-align: center; 
                    z-index: 10000; font-size: 16px; font-weight: bold;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span>📞</span>
                <span>CONECTANDO COM CHAMADOR...</span>
                <span>📞</span>
            </div>
        </div>
    `;
    document.body.insertBefore(statusElement, document.body.firstChild);
}

// ⏳ Mostrar estado "Conectando..."
function mostrarEstadoConectando() {
    const estadoAnterior = document.getElementById('estado-conexao');
    if (estadoAnterior) estadoAnterior.remove();
    
    const statusElement = document.createElement('div');
    statusElement.id = 'estado-conexao';
    statusElement.innerHTML = `
        <div style="position: fixed; top: 60px; left: 50%; transform: translateX(-50%); 
                    background: rgba(0,100,0,0.9); color: white; padding: 10px 20px; 
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

// 🔄 Escutar por offer existente do caller
function escutarPorOfferExistente(callerId, localStream, meuIdioma) {
    console.log('👂 Escutando por offer existente do caller:', callerId);
    
    return new Promise((resolve, reject) => {
        let offerRecebido = false;
        const timeout = setTimeout(() => {
            if (!offerRecebido) {
                console.log('❌ Timeout: Offer não recebido em 15 segundos');
                reject(new Error('Timeout esperando offer do caller'));
            }
        }, 15000);
        
        const callbackOriginal = window.rtcCore.onIncomingCall;
        
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            console.log('✅ Offer recebido do caller!', offer ? '✅' : '❌');
            
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

                    window.targetTranslationLang = idiomaDoCaller || window.targetTranslationLang;
                    console.log('🎯 Conexão estabelecida via notificação!');
                    
                    // ✅ REMOVE STATUS DE CONEXÃO
                    const statusElement = document.getElementById('connection-status');
                    if (statusElement) statusElement.remove();
                    
                    resolve(true);
                });
            }
        };
    });
}

// 🔥🔥🔥 VERIFICAÇÃO IMEDIATA - EXECUTA ANTES DE TUDO
function verificarModoImediatamente() {
    const params = new URLSearchParams(window.location.search);
    const pendingCaller = params.get('pendingCaller');
    
    if (pendingCaller) {
        console.log('🔔🔔🔔 MODO NOTIFICAÇÃO DETECTADO IMEDIATAMENTE!');
        
        // ✅ MUDA A TELA ANTES MESMO DA PÁGINA CARREGAR COMPLETAMENTE
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                mudarParaModoWebRTC();
            }, 100);
        });
        
        // ✅ TAMBÉM TENTA MUDAR AGORA (CASO DOM JÁ ESTEJA PRONTO)
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', mudarParaModoWebRTC);
        } else {
            setTimeout(mudarParaModoWebRTC, 200);
        }
        
        return true;
    }
    return false;
}

// 🔥 EXECUTA A VERIFICAÇÃO IMEDIATA
const isNotificationMode = verificarModoImediatamente();

window.onload = async () => {
    try {
        console.log('🚀 Iniciando receiver-ui.js...');

        // ✅ 1. Solicita acesso à câmera (vídeo sem áudio)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log('📷 Câmera acessada com sucesso');

        let localStream = stream;
        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;

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

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        const pendingCaller = params.get('pendingCaller');
        const callerLang = params.get('callerLang');

        console.log('🔍 Parâmetros URL:', { 
            token: token ? '✅' : '❌', 
            lang, 
            pendingCaller: pendingCaller || 'Nenhum',
            callerLang: callerLang || 'Não informado'
        });

        window.targetTranslationLang = lang;

        // ✅ 3. SE FOR NOTIFICAÇÃO, JÁ MUDAMOS A TELA (verificarModoImediatamente)
        if (pendingCaller) {
            console.log('🔔 Modo notificação ativado - Caller aguardando:', pendingCaller);

            if (callerLang) {
                console.log('🎯 Aplicando bandeira do caller:', callerLang);
                aplicarBandeiraRemota(callerLang);
            }

        } else {
            // ✅ COMPORTAMENTO NORMAL: Gera QR Code normalmente
            console.log('📱 Modo normal: gerando QR Code');
            const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
            
            // ✅ SÓ GERA QR CODE SE O CONTAINER EXISTIR E ESTIVER VISÍVEL
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer && qrContainer.style.display !== 'none') {
                QRCodeGenerator.generate("qrcode", callerUrl);
            }
        }

        // ✅ 4. Inicializa WebRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();
        console.log('🔌 WebRTC inicializado');

        // ✅ 5. Configura callbacks WebRTC
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

        // ✅ 6. Callback para chamada recebida
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu (receiver) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) remoteVideo.srcObject = remoteStream;

                window.targetTranslationLang = idiomaDoCaller || lang;

                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }
            });
        };

        // ✅ 7. SE FOR NOTIFICAÇÃO, CONECTA
        if (pendingCaller) {
            console.log('📞 Modo notificação: Escutando por offer do caller...');
            
            const conectarViaNotificacao = async () => {
                try {
                    mostrarEstadoConectando();
                    await escutarPorOfferExistente(pendingCaller, localStream, lang);
                    console.log('✅ Conexão estabelecida via notificação!');
                } catch (error) {
                    console.error('❌ Falha na conexão via notificação:', error);
                    try {
                        const meuIdioma = await obterIdiomaCompleto(lang);
                        window.rtcCore.startCall(pendingCaller, localStream, meuIdioma);
                    } catch (fallbackError) {
                        console.error('❌ Fallback também falhou:', fallbackError);
                    }
                }
            };

            setTimeout(conectarViaNotificacao, 1000);
        }

        // ✅ 8. TRADUÇÃO DOS TEXTOS FIXOS
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

        // ✅ 9. APLICA BANDEIRA LOCAL
        aplicarBandeiraLocal(lang);

        // ✅ 10. Inicializa tradutor
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        console.log('✅ Receiver-ui.js carregado com sucesso');

    } catch (error) {
        console.error("Erro ao solicitar acesso à câmera:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
    }
};
