import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 🐒 LEMUR LOADER - Imagem animada durante o processamento
class LemurLoader {
    constructor() {
        this.loaderElement = null;
        this.impatiente = null;
        this.olhosFechados = null;
        this.isActive = false;
        this.intervalId = null;
        this.createLoader();
    }

    createLoader() {
        // Cria o elemento do loader se não existir
        if (!document.getElementById('lemur-loader')) {
            const loader = document.createElement('div');
            loader.id = 'lemur-loader';
            loader.className = 'lemur-loader';
            loader.innerHTML = `
                <img src="assets/images/lemurImpaciente.png" id="lemur-impatiente" class="lemur-image active">
                <img src="assets/images/lemurOlhos.png" id="lemur-olhos-fechados" class="lemur-image">
            `;
            document.body.appendChild(loader);
        }

        this.loaderElement = document.getElementById('lemur-loader');
        this.impatiente = document.getElementById('lemur-impatiente');
        this.olhosFechados = document.getElementById('lemur-olhos-fechados');
    }

    start() {
        if (this.isActive) return;
        
        console.log('🐒 Iniciando Lemur Loader...');
        this.isActive = true;
        
        if (this.loaderElement) {
            this.loaderElement.style.display = 'block';
        }
        
        this.cycleImages();
    }

    stop() {
        console.log('🐒 Parando Lemur Loader...');
        this.isActive = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        if (this.loaderElement) {
            this.loaderElement.style.display = 'none';
        }
        
        this.resetImages();
    }

    cycleImages() {
        let isImpatiente = true;
        
        // Começa com a imagem impaciente
        this.showImpatiente();
        
        // Alterna as imagens a cada 3 segundos
        this.intervalId = setInterval(() => {
            if (!this.isActive) return;
            
            if (isImpatiente) {
                this.showOlhosFechados();
            } else {
                this.showImpatiente();
            }
            isImpatiente = !isImpatiente;
        }, 3000);
    }

    showImpatiente() {
        if (this.impatiente && this.olhosFechados) {
            this.impatiente.classList.add('active');
            this.olhosFechados.classList.remove('active');
            
            // Programa para mostrar olhos fechados depois de 2 segundos
            setTimeout(() => {
                if (this.isActive) {
                    this.showOlhosFechados();
                }
            }, 2000);
        }
    }

    showOlhosFechados() {
        if (this.impatiente && this.olhosFechados) {
            this.olhosFechados.classList.add('active');
            this.impatiente.classList.remove('active');
            
            // Volta para impaciente após 1 segundo
            setTimeout(() => {
                if (this.isActive) {
                    this.showImpatiente();
                }
            }, 1000);
        }
    }

    resetImages() {
        if (this.impatiente && this.olhosFechados) {
            this.impatiente.classList.add('active');
            this.olhosFechados.classList.remove('active');
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
};// ✅ 1. COLOCAR CONSOLE LOGS ESTRATÉGICOS para identificar onde trava
console.log("🔸 [1] Script começou a carregar");

import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

console.log("🔸 [2] Imports carregados");

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

// ✅ 2. VERIFICAR se há código executando ANTES do window.onload
console.log("🔸 [3] Funções definidas, aguardando window.onload...");

window.onload = async () => {
    console.log("🔸 [4] Window.onload INICIOU - solicitando câmera AGORA");
    
    try {
        // ✅ SOLICITAÇÃO IMEDIATA DA CÂMERA - PRIMEIRA COISA
        console.log("🔸 [5] Chamando getUserMedia()...");
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log("🔸 [6] Câmera autorizada! Continuando...");

        // ✅ Captura da câmera local
        let localStream = stream;

        // ✅ Exibe vídeo local no PiP azul
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        // ✅ AGORA faz todo o resto
        console.log("🔸 [7] Inicializando WebRTC...");
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

        console.log("🔸 [8] Gerando QR Code...");
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

        // ✅ Traduções (podem ser feitas depois)
        console.log("🔸 [9] Aplicando traduções...");
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

        console.log("🔸 [10] Tudo carregado com sucesso!");

    } catch (error) {
        console.error("❌ Erro ao solicitar acesso à câmera:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        return;
    }
};

console.log("🔸 [11] Window.onload definido, aguardando carregamento...");
