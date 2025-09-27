import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO (CORRIGIDA)
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;

  // ✅ CORREÇÃO: Não espera pelo fetch, usa fallback imediato
  const fallback = {
    'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
    'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
    'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
  };
  
  return fallback[lang] || `${lang}-${lang.toUpperCase()}`;
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

// 🔄 NOVA FUNÇÃO: Iniciar chamada reversa para o caller (CORRIGIDA)
async function iniciarChamadaReversa(callerId, localStream, meuIdioma) {
  console.log('📞 Iniciando chamada reversa para caller:', callerId);
  
  if (window.rtcCore && localStream) {
    try {
      // ✅ CORREÇÃO: Pequeno delay para garantir que WebRTC está pronto
      setTimeout(() => {
        window.rtcCore.startCall(callerId, localStream, meuIdioma);
        mostrarEstadoConectando();
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro na chamada reversa:', error);
    }
  }
}

// ⏳ NOVA FUNÇÃO: Mostrar estado "Conectando..."
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
        <span>Conectando...</span>
      </div>
    </div>
  `;
  document.body.appendChild(statusElement);
  
  setTimeout(() => {
    if (statusElement.parentNode) {
      statusElement.remove();
    }
  }, 5000);
}

window.onload = async () => {
    try {
        console.log('🚀 Iniciando receiver-ui.js...'); // ✅ DEBUG

        // ✅ Solicita acesso à câmera (vídeo sem áudio)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log('📷 Câmera acessada com sucesso'); // ✅ DEBUG

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
        console.log('🆔 Meu ID:', myId); // ✅ DEBUG

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        const pendingCaller = params.get('pendingCaller');

        console.log('🔍 Parâmetros URL:', { token, lang, pendingCaller }); // ✅ DEBUG

        window.targetTranslationLang = lang;

        const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
        
        // ✅ CORREÇÃO: Pequeno delay antes de gerar QR Code
        setTimeout(() => {
            QRCodeGenerator.generate("qrcode", callerUrl);
            console.log('📱 QR Code gerado'); // ✅ DEBUG
        }, 100);

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        console.log('🔌 WebRTC inicializado'); // ✅ DEBUG

        // ✅ CORRETO: Box SEMPRE visível e fixo, frase só aparece com a voz
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

        // 🔄 NOVO: Se foi aberto via notificação, inicia chamada reversa (CORRIGIDO)
        if (pendingCaller) {
          console.log('🔔 Receiver acordado por notificação. Caller aguardando:', pendingCaller);
          
          // ✅ CORREÇÃO: Delay maior para garantir tudo carregado
          setTimeout(async () => {
            console.log('📞 Iniciando chamada reversa...');
            const meuIdioma = await obterIdiomaCompleto(lang);
            await iniciarChamadaReversa(pendingCaller, localStream, meuIdioma);
          }, 2000); // ↑ Aumentei para 2 segundos
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

        // ✅ MANTIDO: Tradução dos títulos da interface (MAS COM TRY/CATCH)
        const frasesParaTraduzir = {
            "translator-label": "Real-time translation.",
            "qr-modal-title": "This is your online key",
            "qr-modal-description": "You can ask to scan, share or print on your business card."
        };

        // ✅ CORREÇÃO: Não trava se a tradução falhar
        setTimeout(async () => {
            try {
                for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
                    const el = document.getElementById(id);
                    if (el) {
                        const traduzido = await translateText(texto, lang);
                        el.textContent = traduzido;
                    }
                }
            } catch (error) {
                console.log('⚠️ Tradução de interface falhou, mas continuando...');
            }
        }, 3000); // ↑ Tradução acontece depois de tudo

        // 🏳️ Aplica bandeira do idioma local (CORRIGIDA)
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
                // ✅ CORREÇÃO: Fallback imediato
                const bandeira = '🏳️';
                const localLangElement = document.querySelector('.local-mic-Lang');
                if (localLangElement) localLangElement.textContent = bandeira;
            }
        }

        // 🏳️ Aplica bandeira do idioma remoto (CORRIGIDA)
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

        // ✅ CORREÇÃO: Aplica bandeira com timeout
        setTimeout(() => {
            aplicarBandeiraLocal(lang);
        }, 1000);

        console.log('✅ Receiver-ui.js carregado com sucesso'); // ✅ DEBUG

    } catch (error) {
        console.error("❌ Erro ao solicitar acesso à câmera:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        return;
    }
};
