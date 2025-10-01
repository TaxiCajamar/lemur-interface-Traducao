import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 🐒 LEMUR LOADER DENTRO DO BOX PRINCIPAL
class LemurLoader {
    constructor() {
        this.intervalId = null;
    }

    start() {
        if (this.intervalId) return;
        
        console.log('🐒 Iniciando Lemur Loader...');
        
        // Remove loader existente
        this.stop();
        
        // Encontra o box principal
        const boxPrincipal = document.querySelector('.box-principal');
        if (!boxPrincipal) return;
        
        // Cria o loader DENTRO do box principal
        const loader = document.createElement('div');
        loader.id = 'lemur-loader';
        loader.style.position = 'absolute';
        loader.style.top = '50%';
        loader.style.left = '50%';
        loader.style.transform = 'translate(-50%, -50%)';
        loader.style.zIndex = '9999';
        loader.style.pointerEvents = 'none';

        const impaciente = document.createElement('img');
        impaciente.src = 'assets/images/lemurImpaciente.png';
        impaciente.style.width = '120px';
        impaciente.style.height = 'auto';
        impaciente.style.display = 'block';

        const olhosFechados = document.createElement('img');
        olhosFechados.src = 'assets/images/lemurOlhos.png';
        olhosFechados.style.width = '120px';
        olhosFechados.style.height = 'auto';
        olhosFechados.style.display = 'none';
        olhosFechados.style.position = 'absolute';
        olhosFechados.style.top = '0';
        olhosFechados.style.left = '0';

        loader.appendChild(impaciente);
        loader.appendChild(olhosFechados);
        boxPrincipal.appendChild(loader);

        // Alterna as imagens
        let mostrarImpatiente = true;
        this.intervalId = setInterval(() => {
            if (mostrarImpatiente) {
                impaciente.style.display = 'none';
                olhosFechados.style.display = 'block';
            } else {
                impaciente.style.display = 'block';
                olhosFechados.style.display = 'none';
            }
            mostrarImpatiente = !mostrarImpatiente;
        }, 2000);
    }

    stop() {
        console.log('🐒 Parando Lemur Loader...');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        const loader = document.getElementById('lemur-loader');
        if (loader) {
            loader.remove();
        }
    }
}

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

window.onload = async () => {
    try {
        // ✅ Inicializa o Lemur Loader
        window.lemurLoader = new LemurLoader();

        // ✅ Solicita acesso à câmera (vídeo sem áudio)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        // ✅ Captura da câmera local
        let localStream = stream;

        // ✅ Exibe vídeo local no PiP azul
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        // ✅ Inicializa WebRTC
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

        // ✅ CONFIGURAÇÃO DO CANAL DE DADOS COM LEMUR LOADER
        window.rtcCore.setDataChannelCallback((mensagem) => {
            console.log('📩 Mensagem recebida:', mensagem);

            // 🐒 INICIA O LEMUR LOADER (imagem animada)
            if (window.lemurLoader) {
                window.lemurLoader.start();
            }

            const elemento = document.getElementById('texto-recebido');
            if (elemento) {
                // ✅ BOX CINTILANTE (vermelho pulsante)
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
                    console.log('🗣️ Voz iniciada - parando loader e cintilação');
                    
                    // 🐒 PARA O LEMUR LOADER quando a voz começa
                    if (window.lemurLoader) {
                        window.lemurLoader.stop();
                    }

                    if (elemento) {
                        // ✅ PARA A CINTILAÇÃO e volta ao normal
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = '';
                        elemento.style.border = '';
                        
                        // MOSTRA O TEXTO quando a voz começa
                        elemento.textContent = mensagem;
                    }
                };

                utterance.onend = () => {
                    console.log('🔚 Voz terminada');
                    // Garante que o loader pare mesmo se houver algum erro
                    if (window.lemurLoader) {
                        window.lemurLoader.stop();
                    }
                };

                utterance.onerror = () => {
                    console.log('❌ Erro na voz - parando loader');
                    if (window.lemurLoader) {
                        window.lemurLoader.stop();
                    }
                };

                window.speechSynthesis.speak(utterance);
            }
        });

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

        // ✅ Tradução dos títulos da interface
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

        aplicarBandeiraLocal(lang);

        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

    } catch (error) {
        console.error("Erro ao solicitar acesso à câmera:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        return;
    }
};
