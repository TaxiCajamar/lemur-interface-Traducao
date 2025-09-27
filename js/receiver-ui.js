import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

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

// 🔄 NOVA FUNÇÃO: Iniciar chamada reversa para o caller
async function iniciarChamadaReversa(callerId, localStream, meuIdioma) {
  console.log('📞 Iniciando chamada reversa para caller:', callerId);
  
  if (window.rtcCore && localStream) {
    try {
      // Usa a função existente startCall para iniciar a chamada
      window.rtcCore.startCall(callerId, localStream, meuIdioma);
      
      // Mostra estado de "Conectando..."
      mostrarEstadoConectando();
      
    } catch (error) {
      console.error('❌ Erro na chamada reversa:', error);
    }
  }
}

// ⏳ NOVA FUNÇÃO: Mostrar estado "Conectando..."
function mostrarEstadoConectando() {
  // Remove estado anterior se existir
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
        <span>Conectando...</span>
      </div>
    </div>
  `;
  document.body.appendChild(statusElement);
  
  // Remove após 5 segundos
  setTimeout(() => {
    if (statusElement.parentNode) {
      statusElement.remove();
    }
  }, 5000);
}

window.onload = async () => {
    try {
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
        const pendingCaller = params.get('pendingCaller'); // 🔄 NOVO: Verifica se tem caller aguardando

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

        // 🔄 NOVO: Se foi aberto via notificação, inicia chamada reversa
        if (pendingCaller) {
          console.log('🔔 Receiver acordado por notificação. Caller aguardando:', pendingCaller);
          
          // Espera um pouco para garantir que tudo está carregado
          setTimeout(async () => {
            const meuIdioma = await obterIdiomaCompleto(lang);
            await iniciarChamadaReversa(pendingCaller, localStream, meuIdioma);
          }, 1000);
        }

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

        // ✅ MANTIDO: Tradução dos títulos da interface (inglês → idioma local)
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

        // 🏳️ Aplica bandeira do idioma local (função renomeada para clareza)
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
