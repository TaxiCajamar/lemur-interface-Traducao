// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
    if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
        window.rtcDataChannel.send(texto);
        console.log('✅ Texto enviado:', texto);
    } else {
        console.log('⏳ Canal não disponível ainda. Tentando novamente...');
        setTimeout(() => enviarParaOutroCelular(texto), 1000);
    }
}

async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                sourceLang: window.sourceTranslationLang || 'auto',
                targetLang: window.targetTranslationLang || 'en'
            })
        });

        const result = await response.json();
        const translatedText = result.translatedText || text;
        return translatedText;
        
    } catch (error) {
        return text;
    }
}

// ===== INICIALIZAÇÃO DO BOTÃO MUNDO (INDEPENDENTE) =====
function initializeWorldButton() {
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    const worldButton = document.getElementById('worldButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    if (!worldButton || !languageDropdown || !currentLanguageFlag) {
        console.log('⏳ Aguardando elementos do botão mundo...');
        setTimeout(initializeWorldButton, 300);
        return;
    }
    
    console.log('🎯 Inicializando botão mundo...');
    
    // 🎯 OBTÉM IDIOMA DOS PARÂMETROS DA URL
    let IDIOMA_ORIGEM = 'pt-BR';
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const langFromUrl = urlParams.get('lang');
        if (langFromUrl) {
            IDIOMA_ORIGEM = langFromUrl;
        }
    } catch (error) {
        console.log('Usando idioma padrão');
    }
    
    async function getBandeiraDoJson(langCode) {
        try {
            const response = await fetch('./assets/bandeiras/language-flags.json');
            const flags = await response.json();
            return flags[langCode] || flags[langCode.split('-')[0]] || '🎌';
        } catch (error) {
            console.error('Erro ao carregar bandeiras:', error);
            return '🎌';
        }
    }
    
    // Configurar bandeira inicial
    getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
        currentLanguageFlag.textContent = bandeira;
    });

    // Evento do botão mundo
    worldButton.addEventListener('click', function(e) {
        console.log('🎯 Botão Mundo clicado!');
        e.preventDefault();
        e.stopPropagation();
        languageDropdown.classList.toggle('show');
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!languageDropdown.contains(e.target) && e.target !== worldButton) {
            languageDropdown.classList.remove('show');
        }
    });

    // Eventos das opções de idioma
    languageOptions.forEach(option => {
        option.addEventListener('click', async function() {
            const novoIdioma = this.getAttribute('data-lang');
            IDIOMA_ORIGEM = novoIdioma;
            
            const bandeira = await getBandeiraDoJson(novoIdioma);
            currentLanguageFlag.textContent = bandeira;
            
            languageDropdown.classList.remove('show');
            
            // Atualizar idioma no contexto global para o tradutor
            window.currentSourceLang = novoIdioma;
            
            // Feedback visual
            const translatedText = document.getElementById('translatedText');
            if (translatedText) {
                translatedText.textContent = "✅";
                setTimeout(() => {
                    if (translatedText) translatedText.textContent = "🎤";
                }, 1000);
            }
            
            console.log('🌎 Idioma alterado para:', novoIdioma);
        });
    });
    
    console.log('✅ Botão mundo inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO DO TRADUTOR =====
function initializeTranslator() {
    
    // 🎯 OBTÉM IDIOMA DOS PARÂMETROS DA URL
    let IDIOMA_ORIGEM = 'pt-BR';
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const langFromUrl = urlParams.get('lang');
        if (langFromUrl) {
            IDIOMA_ORIGEM = langFromUrl;
        }
    } catch (error) {
        console.log('Usando idioma padrão para tradução');
    }
    
    function obterIdiomaDestino() {
        // 🎯 USA O IDIOMA DA URL COMO DESTINO
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const langFromUrl = urlParams.get('lang');
            return langFromUrl || 'en';
        } catch (error) {
            return 'en';
        }
    }

    function obterIdiomaFala() {
        const lang = obterIdiomaDestino();
        if (lang.includes('-')) return lang;
        
        const fallbackMap = {
            'en': 'en-US', 'pt': 'pt-BR', 'es': 'es-ES', 
            'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT'
        };
        
        return fallbackMap[lang] || 'en-US';
    }
    
    const IDIOMA_DESTINO = obterIdiomaDestino();
    const IDIOMA_FALA = obterIdiomaFala();
    
    console.log('🎯 Configuração de tradução:', {
        origem: IDIOMA_ORIGEM,
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA
    });

    const recordButton = document.getElementById('recordButton');
    const translatedText = document.getElementById('translatedText');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    
    if (!recordButton || !translatedText) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    translatedText.textContent = "🎤";
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        translatedText.textContent = "❌";
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        speakerButton.style.display = 'none';
    }
    
    let recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;
    
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false;
    let lastTranslationTime = 0;
    
    function setupRecognitionEvents() {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            // ✅ CORREÇÃO: NUNCA mostra o que estou falando, apenas o ícone
            if (translatedText) {
                translatedText.textContent = "🎤"; // Mantém apenas o ícone
            }
            
            // ✅ CORREÇÃO: Processo totalmente silencioso
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    // ✅ Traduz e envia SEM MOSTRAR o processo
                    translateText(finalTranscript).then(translation => {
                        enviarParaOutroCelular(translation); // Envia silenciosamente
                        
                        // ✅ Apenas confirmação visual breve
                        if (translatedText) {
                            translatedText.textContent = "✅";
                            setTimeout(() => {
                                if (translatedText) translatedText.textContent = "🎤";
                            }, 500);
                        }
                        isTranslating = false;
                    }).catch(error => {
                        console.error('Erro na tradução:', error);
                        if (translatedText) translatedText.textContent = "🎤";
                        isTranslating = false;
                    });
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.log('Erro recognition:', event.error);
            if (event.error !== 'no-speech' && translatedText) {
                translatedText.textContent = "❌";
            }
            stopRecording();
        };
        
        recognition.onend = function() {
            if (isRecording) {
                stopRecording();
            }
        };
    }
    
    async function requestMicrophonePermission() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophonePermission = devices.some(device => 
                device.kind === 'audioinput' && device.deviceId !== ''
            );
            
            if (hasMicrophonePermission) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                translatedText.textContent = "🎤";
                setupRecognitionEvents();
                return;
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 1000);
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            translatedText.textContent = "🎤";
            setupRecognitionEvents();
            
        } catch (error) {
            console.error('Erro permissão microfone:', error);
            translatedText.textContent = "🚫";
            recordButton.disabled = true;
        }
    }
    
    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_FALA;
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        
        utterance.onerror = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    function toggleSpeech() {
        if (!SpeechSynthesis) return;
        
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        } else {
            // ✅ CORREÇÃO: Lê apenas o texto recebido (não o que eu falo)
            const textoRecebido = document.getElementById("texto-recebido");
            if (textoRecebido && textoRecebido.textContent) {
                const textToSpeak = textoRecebido.textContent;
                if (textToSpeak && textToSpeak.trim() !== "") {
                    speakText(textToSpeak);
                }
            }
        }
    }
    
    function startRecording() {
        if (isRecording || isTranslating) return;
        
        try {
            // Atualizar idioma dinamicamente
            const currentLang = window.currentSourceLang || IDIOMA_ORIGEM;
            recognition.lang = currentLang;
            
            recognition.start();
            isRecording = true;
            
            if (recordButton) recordButton.classList.add('recording');
            recordingStartTime = Date.now();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
            
            if (translatedText) translatedText.textContent = "🎙️";
            if (speakerButton) {
                speakerButton.disabled = true;
                speakerButton.textContent = '🔇';
            }
            
        } catch (error) {
            console.error('Erro ao iniciar gravação:', error);
            if (translatedText) translatedText.textContent = "❌";
            stopRecording();
        }
    }
    
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        if (recordButton) recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
        
        if (translatedText && !isTranslating) {
            translatedText.textContent = "🎤";
        }
    }
    
    function showRecordingModal() {
        if (recordingModal) recordingModal.classList.add('visible');
    }
    
    function hideRecordingModal() {
        if (recordingModal) recordingModal.classList.remove('visible');
    }
    
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        if (recordingTimer) {
            recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (elapsedSeconds >= 30) {
            stopRecording();
        }
    }
    
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    tapMode = false;
                    startRecording();
                    showRecordingModal();
                }, 300);
            }
        });
        
        recordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
            
            if (isRecording) {
                stopRecording();
            } else {
                if (microphonePermissionGranted && !isTranslating) {
                    tapMode = true;
                    startRecording();
                    showRecordingModal();
                }
            }
        });
        
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
                showRecordingModal();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', stopRecording);
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', toggleSpeech);
    }
    
    requestMicrophonePermission();
    
    console.log('✅ Tradutor inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    initializeWorldButton(); // Inicializa primeiro (independente)
    setTimeout(initializeTranslator, 500); // Inicializa depois
});
// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';

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

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
  if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
    window.rtcDataChannel.send(texto);
    console.log('✅ Texto enviado:', texto);
  } else {
    console.log('⏳ Canal não disponível ainda. Tentando novamente...');
    setTimeout(() => enviarParaOutroCelular(texto), 1000);
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

// 🔔 FUNÇÃO: Notificar servidor que estou online
async function notificarServidorOnline(meuId, meuIdioma) {
  try {
    console.log('📢 Notificando servidor que estou online:', meuId);
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/user-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: meuId,
        userLang: meuIdioma,
        status: 'online',
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    console.log('✅ Servidor notificado:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao notificar servidor:', error);
    return false;
  }
}

// ⏳ FUNÇÃO: Mostrar estado "Aguardando chamadas"
function mostrarEstadoAguardando() {
  const statusElement = document.createElement('div');
  statusElement.id = 'aguardando-status';
  statusElement.innerHTML = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                text-align: center; z-index: 1000;">
      <div style="font-size: 24px; margin-bottom: 10px;">📞</div>
      <div>Aguardando chamada...</div>
      <div style="font-size: 12px; opacity: 0.8;">Pronto para receber conexão</div>
    </div>
  `;
  document.body.appendChild(statusElement);
}

window.onload = async () => {
  try {
    // ✅✅✅ SOLICITAÇÃO DE CÂMERA (CRÍTICO)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    let localStream = stream;
    window.localStream = localStream;
    
    // ✅✅✅ CONFIGURAÇÃO DO VÍDEO LOCAL (CRÍTICO)
    const localVideo = document.getElementById('localVideo');
    if (localVideo) localVideo.srcObject = localStream;

    // ✅✅✅ INICIALIZAÇÃO WebRTC
    window.rtcCore = new WebRTCCore();

    // ✅✅✅ DATA CHANNEL CALLBACK
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

    // ✅✅✅ CORREÇÃO CRÍTICA: USA APENAS ID DA URL (não gera novo)
    const urlParams = new URLSearchParams(window.location.search);
    const meuId = urlParams.get('id'); // ← USA SÓ DA URL, SEM FALLBACK
    
    if (!meuId) {
      console.error('❌ ERRO: ID não encontrado na URL');
      alert('Link inválido: ID não encontrado');
      return;
    }
    
    // ✅✅✅ ATUALIZA O ID NA INTERFACE
    const myIdElement = document.getElementById('myId');
    if (myIdElement) myIdElement.textContent = meuId;

    // ✅✅✅ INICIALIZA WebRTC COM ID DA URL
    window.rtcCore.initialize(meuId);
    window.rtcCore.setupSocketHandlers();

    // ✅✅✅ AVISA SERVIDOR QUE ESTOU ONLINE!
    const meuIdioma = await obterIdiomaCompleto(urlParams.get('lang') || navigator.language);
    await notificarServidorOnline(meuId, meuIdioma);

    // ✅✅✅ CONFIGURA RECEPÇÃO DE CHAMADAS
    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller, callerId) => {
      console.log('📞 Chamada recebida de:', callerId);
      
      // Remove tela de aguardando se existir
      const statusElement = document.getElementById('aguardando-status');
      if (statusElement) statusElement.remove();
      
      const conectandoElement = document.getElementById('conectando-status');
      if (conectandoElement) conectandoElement.remove();
      
      // ✅✅✅ ACEITA CHAMADA AUTOMATICAMENTE
      window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        console.log('✅ Chamada atendida com sucesso!');
        
        // ✅✅✅ CONFIGURA VÍDEO REMOTO
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) remoteVideo.srcObject = remoteStream;
      });
    };

    // ✅✅✅ VERIFICA SE FOI ACORDADO POR NOTIFICAÇÃO
    const wakeupCallerId = urlParams.get('callerId');
    const wakeupCallerLang = urlParams.get('callerLang');
    
    if (wakeupCallerId) {
      console.log('🔥🔥🔥 ACORDADO POR NOTIFICAÇÃO - Iniciando chamada para caller:', wakeupCallerId);
      
      // Remove tela de aguardando
      const statusElement = document.getElementById('aguardando-status');
      if (statusElement) statusElement.remove();
      
      // Mostra estado de conectando
      const conectandoElement = document.createElement('div');
      conectandoElement.id = 'conectando-status';
      conectandoElement.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px;
                    text-align: center; z-index: 1000;">
          <div style="font-size: 24px; margin-bottom: 10px;">🔥</div>
          <div>Conectando com caller...</div>
          <div style="font-size: 12px; opacity: 0.8;">Iniciando chamada</div>
        </div>
      `;
      document.body.appendChild(conectandoElement);
      
      // ⭐⭐ RECEIVER INICIA CHAMADA PARA O CALLER
      setTimeout(() => {
        if (window.rtcCore && window.localStream) {
          window.rtcCore.startCall(wakeupCallerId, window.localStream, wakeupCallerLang);
          console.log('✅ Chamada iniciada pelo receiver para o caller');
        }
      }, 1000);
    } else {
      // ✅✅✅ SE NÃO FOI ACORDADO, SÓ ESPERA
      mostrarEstadoAguardando();
    }

    // ✅✅✅ TRADUÇÃO DA INTERFACE
    const navegadorLang = await obterIdiomaCompleto(navigator.language);
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation."
    };

    (async () => {
      for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
        const el = document.getElementById(id);
        if (el) {
          const traduzido = await translateText(texto, navegadorLang);
          el.textContent = traduzido;
        }
      }
    })();

    // ✅✅✅ BANDEIRAS DE IDIOMA
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

    aplicarBandeiraLocal(navegadorLang);
    aplicarBandeiraRemota(meuIdioma);

    console.log('✅ Notificador inicializado - Aguardando chamadas');

  } catch (error) {
    console.error("❌ Erro ao inicializar notificador:", error);
    
    // ✅✅✅ TRATAMENTO DE ERRO
    const errorElement = document.createElement('div');
    errorElement.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                  background: #f44336; color: white; display: flex; 
                  align-items: center; justify-content: center; text-align: center;">
        <div>
          <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
          <div style="font-size: 18px; margin-bottom: 10px;">Erro ao carregar</div>
          <div style="font-size: 14px; opacity: 0.8;">Recarregue a página</div>
        </div>
      </div>
    `;
    document.body.appendChild(errorElement);
  }
};
