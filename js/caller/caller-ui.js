// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎵 VARIÁVEIS DE ÁUDIO (mantidas do seu código original)
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// ==== TRADUTOR SIMPLES INTEGRADO ====
let recognition = null;
let isRecording = false;
let isTranslating = false;

// 🎤 INICIALIZAR TRADUTOR DE VOZ
function initializeVoiceTranslator() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.log('❌ Reconhecimento de voz não suportado');
        document.getElementById('recordButton').style.display = 'none';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'pt-BR';

    // 🎯 CONFIGURAR EVENTOS DE VOZ
    recognition.onresult = async (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript && !isTranslating) {
            isTranslating = true;
            console.log('🎤 Texto capturado:', finalTranscript);
            
            try {
                // 🔄 TRADUZIR TEXTO
                const translatedText = await translateText(finalTranscript, window.targetTranslationLang || 'en');
                console.log('🌐 Texto traduzido:', translatedText);
                
                // 📤 ENVIAR PARA OUTRO CELULAR
                enviarParaOutroCelular(translatedText);
                
            } catch (error) {
                console.error('❌ Erro na tradução:', error);
            } finally {
                isTranslating = false;
            }
        }
    };

    recognition.onerror = (event) => {
        console.log('❌ Erro no reconhecimento:', event.error);
        stopRecording();
    };

    recognition.onend = () => {
        if (isRecording) {
            stopRecording();
        }
    };

    console.log('✅ Tradutor de voz inicializado');
}

// 🎤 INICIAR GRAVAÇÃO
function startRecording() {
    if (isRecording || isTranslating || !recognition) return;
    
    try {
        recognition.start();
        isRecording = true;
        
        const recordButton = document.getElementById('recordButton');
        if (recordButton) recordButton.classList.add('recording');
        
        const recordingModal = document.getElementById('recordingModal');
        if (recordingModal) recordingModal.classList.add('visible');
        
        console.log('🎤 Gravação iniciada');
        
    } catch (error) {
        console.error('❌ Erro ao iniciar gravação:', error);
        stopRecording();
    }
}

// ⏹️ PARAR GRAVAÇÃO
function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    
    const recordButton = document.getElementById('recordButton');
    if (recordButton) recordButton.classList.remove('recording');
    
    const recordingModal = document.getElementById('recordingModal');
    if (recordingModal) recordingModal.classList.remove('visible');
    
    console.log('⏹️ Gravação parada');
}

// 🔊 FALAR TEXTO RECEBIDO
function speakText(text) {
    if (!window.speechSynthesis || !text) return;
    
    // Parar qualquer fala anterior
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = window.targetTranslationLang || 'en-US';
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    
    utterance.onstart = () => {
        console.log('🔊 Iniciando fala:', text);
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '⏹';
    };
    
    utterance.onend = () => {
        console.log('🔊 Fala concluída');
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '🔊';
    };
    
    utterance.onerror = () => {
        console.log('❌ Erro na fala');
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '🔊';
    };
    
    window.speechSynthesis.speak(utterance);
}

// 🔄 ALTERNAR FALA (botão 🔊)
function toggleSpeech() {
    if (!window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '🔊';
    } else {
        const textoRecebido = document.getElementById('texto-recebido');
        if (textoRecebido && textoRecebido.textContent) {
            speakText(textoRecebido.textContent);
        }
    }
}

// 🌐 FUNÇÃO DE TRADUÇÃO (já existente no seu código)
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

// 📤 FUNÇÃO DE ENVIO (já existente no seu código)
function enviarParaOutroCelular(texto) {
    if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
        window.rtcDataChannel.send(texto);
        console.log('✅ Texto enviado:', texto);
    } else {
        console.log('⏳ Canal não disponível. Tentando novamente...');
        setTimeout(() => enviarParaOutroCelular(texto), 1000);
    }
}

// 🎵 CARREGAR SOM DE DIGITAÇÃO (seu código original)
function carregarSomDigitacao() {
    return new Promise((resolve) => {
        try {
            somDigitacao = new Audio('assets/audio/keyboard.mp3');
            somDigitacao.volume = 0.3;
            somDigitacao.preload = 'auto';
            
            somDigitacao.addEventListener('canplaythrough', () => {
                console.log('🎵 Áudio de digitação carregado');
                audioCarregado = true;
                resolve(true);
            });
            
            somDigitacao.addEventListener('error', () => {
                console.log('❌ Erro ao carregar áudio');
                resolve(false);
            });
            
            somDigitacao.load();
            
        } catch (error) {
            console.log('❌ Erro no áudio:', error);
            resolve(false);
        }
    });
}

// 🎵 INICIAR LOOP DE DIGITAÇÃO (seu código original)
function iniciarSomDigitacao() {
    if (!audioCarregado || !somDigitacao) return;
    
    pararSomDigitacao();
    
    try {
        somDigitacao.loop = true;
        somDigitacao.currentTime = 0;
        somDigitacao.play().catch(error => {
            console.log('🔇 Navegador bloqueou áudio automático');
        });
        
        console.log('🎵 Som de digitação iniciado');
    } catch (error) {
        console.log('❌ Erro ao tocar áudio:', error);
    }
}

// 🎵 PARAR SOM DE DIGITAÇÃO (seu código original)
function pararSomDigitacao() {
    if (somDigitacao) {
        try {
            somDigitacao.pause();
            somDigitacao.currentTime = 0;
            somDigitacao.loop = false;
            console.log('🎵 Som de digitação parado');
        } catch (error) {
            console.log('❌ Erro ao parar áudio:', error);
        }
    }
}

// 🎵 INICIAR ÁUDIO APÓS INTERAÇÃO DO USUÁRIO (seu código original)
function iniciarAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = 0.001;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    console.log('🎵 Áudio desbloqueado!');
}

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ (seu código original)
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 Solicitando todas as permissões...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Todas as permissões concedidas!');
        
        stream.getTracks().forEach(track => track.stop());
        
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        window.audioContext = audioContext;
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro nas permissões:', error);
        permissaoConcedida = false;
        window.permissoesConcedidas = false;
        throw error;
    }
}

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO (seu código original)
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

// 🔔 FUNÇÃO: Notificação SIMPLES para acordar receiver (seu código original)
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma) {
  try {
    console.log('🔔 Enviando notificação para acordar receiver...');
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: receiverToken,
        title: '📞 Nova Chamada',
        body: `Toque para atender a chamada`,
        data: {
          type: 'wake_up',
          callerId: meuId,
          callerLang: meuIdioma
        }
      })
    });

    const result = await response.json();
    console.log('✅ Notificação enviada:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
}

// 📞 FUNÇÃO: Criar tela de chamada visual (sem textos) (seu código original)
function criarTelaChamando() {
  const telaChamada = document.createElement('div');
  telaChamada.id = 'tela-chamando';
  telaChamada.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
  `;

  telaChamada.innerHTML = `
    <div style="text-align: center; animation: pulse 2s infinite;">
      <div style="font-size: 80px; margin-bottom: 20px;">📞</div>
      <div style="font-size: 24px; margin-bottom: 40px; opacity: 0.9;">•••</div>
    </div>
    
    <div id="botao-cancelar" style="
      position: absolute;
      bottom: 60px;
      background: #ff4444;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    ">
      ✕
    </div>

    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    </style>
  `;

  document.body.appendChild(telaChamada);

  document.getElementById('botao-cancelar').addEventListener('click', function() {
    telaChamada.remove();
    window.conexaoCancelada = true;
    console.log('❌ Chamada cancelada pelo usuário');
  });

  return telaChamada;
}

// 🔄 FUNÇÃO UNIFICADA: Tentar conexão visual (COM ESPERA INTELIGENTE) (seu código original)
async function iniciarConexaoVisual(receiverId, receiverToken, meuId, localStream, meuIdioma) {
  console.log('🚀 Iniciando fluxo visual de conexão...');
  
  let conexaoEstabelecida = false;
  let notificacaoEnviada = false;
  window.conexaoCancelada = false;
  
  // ✅ AGUARDA O WEBRTC ESTAR COMPLETAMENTE INICIALIZADO
  console.log('⏳ Aguardando inicialização completa do WebRTC...');
  
  // Função para verificar se o WebRTC está pronto
  const aguardarWebRTCPronto = () => {
    return new Promise((resolve) => {
      const verificar = () => {
        if (window.rtcCore && window.rtcCore.isInitialized && typeof window.rtcCore.startCall === 'function') {
          console.log('✅ WebRTC completamente inicializado');
          resolve(true);
        } else {
          console.log('⏳ Aguardando WebRTC...');
          setTimeout(verificar, 500);
        }
      };
      verificar();
    });
  };

  try {
    // Aguarda o WebRTC estar pronto antes de qualquer tentativa
    await aguardarWebRTCPronto();

    console.log('🔇 Fase 1: Tentativas silenciosas (6s)');
    
    let tentativasFase1 = 3;
    const tentarConexaoSilenciosa = async () => {
      if (conexaoEstabelecida || window.conexaoCancelada) return;
      
      if (tentativasFase1 > 0) {
        console.log(`🔄 Tentativa silenciosa ${4 - tentativasFase1}`);
        
        // ✅ VERIFICAÇÃO EXTRA ANTES DE CHAMAR
        if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
          window.rtcCore.startCall(receiverId, localStream, meuIdioma);
        } else {
          console.log('⚠️ WebRTC não está pronto, aguardando...');
        }
        
        tentativasFase1--;
        setTimeout(tentarConexaoSilenciosa, 2000);
      } else {
        console.log('📞 Fase 2: Mostrando tela de chamada');
        const telaChamada = criarTelaChamando();
        
        if (!notificacaoEnviada) {
          console.log('📨 Enviando notificação wake-up...');
          notificacaoEnviada = await enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma);
        }
        
        const tentarConexaoContinuamente = async () => {
          if (conexaoEstabelecida || window.conexaoCancelada) return;
          
          console.log('🔄 Tentando conexão...');
          
          // ✅ VERIFICAÇÃO SEMPRE ANTES DE TENTAR
          if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
            window.rtcCore.startCall(receiverId, localStream, meuIdioma);
          }
          
          setTimeout(tentarConexaoContinuamente, 3000);
        };
        
        tentarConexaoContinuamente();
      }
    };
    
    // ✅ PEQUENO ATRASO PARA GARANTIR ESTABILIDADE
    setTimeout(() => {
      tentarConexaoSilenciosa();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro no fluxo de conexão:', error);
  }
  
  window.rtcCore.setRemoteStreamCallback(stream => {
    conexaoEstabelecida = true;
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const telaChamada = document.getElementById('tela-chamando');
    if (telaChamada) telaChamada.remove();
    
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = stream;
  });
}

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK) (seu código original)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
}

// 🏳️ Aplica bandeira do idioma local (seu código original)
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

// 🏳️ Aplica bandeira do idioma remoto (seu código original)
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

// 🎤 FUNÇÃO GOOGLE TTS SEPARADA (seu código original)
async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente) {
    try {
        console.log('🎤 Iniciando Google TTS para:', mensagem.substring(0, 50) + '...');
        
        const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: window.targetTranslationLang || 'pt-BR',
                gender: 'FEMALE'
            })
        });

        if (!resposta.ok) {
            throw new Error('Erro na API de voz');
        }

        const blob = await resposta.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        // EVENTO: ÁUDIO COMEÇOU
        audio.onplay = () => {
            pararSomDigitacao();
            
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
                elemento.textContent = mensagem;
            }
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
            
            console.log('🔊 Áudio Google TTS iniciado');
        };
        
        // EVENTO: ÁUDIO TERMINOU
        audio.onended = () => {
            console.log('🔚 Áudio Google TTS terminado');
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
        };
        
        // EVENTO: ERRO NO ÁUDIO
        audio.onerror = () => {
            pararSomDigitacao();
            console.log('❌ Erro no áudio Google TTS');
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
            }
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
        };

        await audio.play();
        
    } catch (error) {
        console.error('❌ Erro no Google TTS:', error);
        // Fallback para síntese nativa se necessário
    }
}

// ✅ FUNÇÃO PARA INICIAR CÂMERA APÓS PERMISSÕES (COM ESPERA MELHORADA) (seu código original)
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        console.log('📹 Iniciando câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        
        let localStream = stream;
        document.getElementById('localVideo').srcObject = localStream;
        console.log('✅ Câmera iniciada com sucesso');

        // ✅ PEQUENA PAUSA PARA ESTABILIZAR
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🌐 Inicializando WebRTC...');
        window.rtcCore = new WebRTCCore();

        // ==== CONFIGURAÇÃO DO TRADUTOR INTEGRADO ====
        // Configura callbacks ANTES de inicializar
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            const imagemImpaciente = document.getElementById('lemurFixed');
            
            if (elemento) {
                elemento.textContent = mensagem;
                elemento.style.opacity = '1';
                elemento.style.transition = 'opacity 0.5s ease';
            }

            // 🎤 FALAR AUTOMATICAMENTE AO RECEBER
            speakText(mensagem);

            // 🎵 GOOGLE TTS (opcional - mantém seu código original)
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente);
        });

        const myId = crypto.randomUUID().substr(0, 8);
        document.getElementById('myId').textContent = myId;

        console.log('🔌 Inicializando socket handlers...');
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ MARCA QUE O WEBRTC ESTÁ INICIALIZADO
        window.rtcCore.isInitialized = true;
        console.log('✅ WebRTC inicializado com ID:', myId);

        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const receiverToken = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        // ✅ CONFIGURA IDIOMA DE TRADUÇÃO
        window.targetTranslationLang = receiverLang;

        window.receiverInfo = {
          id: receiverId,
          token: receiverToken,
          lang: receiverLang
        };

        // ✅ INICIALIZA TRADUTOR DE VOZ
        initializeVoiceTranslator();

        // ✅ CONFIGURA BOTÕES
        const recordButton = document.getElementById('recordButton');
        const sendButton = document.getElementById('sendButton');
        const speakerButton = document.getElementById('speakerButton');

        if (recordButton) {
            recordButton.disabled = false;
            recordButton.addEventListener('click', () => {
                if (isRecording) {
                    stopRecording();
                } else {
                    startRecording();
                }
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', stopRecording);
        }

        if (speakerButton) {
            speakerButton.disabled = false;
            speakerButton.addEventListener('click', toggleSpeech);
        }

        // ✅ SÓ INICIA CONEXÃO SE TIVER receiverId E APÓS TUDO ESTAR PRONTO
        if (receiverId) {
          document.getElementById('callActionBtn').style.display = 'none';
          
          if (localStream) {
            const meuIdioma = await obterIdiomaCompleto(navigator.language);
            
            // ✅ PEQUENO ATRASO PARA GARANTIR QUE TUDO ESTÁ ESTÁVEL
            setTimeout(() => {
              iniciarConexaoVisual(receiverId, receiverToken, myId, localStream, meuIdioma);
            }, 1000);
          }
        }

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

        aplicarBandeiraLocal(navegadorLang);
        aplicarBandeiraRemota(receiverLang);

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        throw error;
    }
}

window.onload = async () => {
  try {
    // ✅ BOTÃO ÚNICO PARA TODAS AS PERMISSÕES
    const permissaoButton = document.createElement('button');
    permissaoButton.innerHTML = `
        <span style="font-size: 32px;">🎤📹🎧</span><br>
        <span style="font-size: 14px;">Clique para ativar<br>Microfone, Câmera e Áudio</span>
    `;
    permissaoButton.style.position = 'fixed';
    permissaoButton.style.top = '50%';
    permissaoButton.style.left = '50%';
    permissaoButton.style.transform = 'translate(-50%, -50%)';
    permissaoButton.style.zIndex = '10000';
    permissaoButton.style.padding = '25px 35px';
    permissaoButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    permissaoButton.style.color = 'white';
    permissaoButton.style.border = 'none';
    permissaoButton.style.borderRadius = '20px';
    permissaoButton.style.cursor = 'pointer';
    permissaoButton.style.fontSize = '16px';
    permissaoButton.style.fontWeight = 'bold';
    permissaoButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
    permissaoButton.style.textAlign = 'center';
    permissaoButton.style.lineHeight = '1.4';
    permissaoButton.style.transition = 'all 0.3s ease';
    
    permissaoButton.onmouseover = () => {
        permissaoButton.style.transform = 'translate(-50%, -50%) scale(1.05)';
        permissaoButton.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)';
    };
    
    permissaoButton.onmouseout = () => {
        permissaoButton.style.transform = 'translate(-50%, -50%)';
        permissaoButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
    };
    
    permissaoButton.onclick = async () => {
        try {
            permissaoButton.innerHTML = '<span style="font-size: 24px;">⏳</span><br><span style="font-size: 12px;">Solicitando permissões...</span>';
            permissaoButton.style.background = '#ff9800';
            permissaoButton.disabled = true;
            
            // 1. Primeiro: Inicia áudio
            iniciarAudio();
            
            // 2. Segundo: Carrega sons
            await carregarSomDigitacao();
            
            // 3. Terceiro: Solicita TODAS as permissões (câmera + microfone)
            await solicitarTodasPermissoes();
            
            // 4. Quarto: Remove botão
            permissaoButton.remove();
            
            // 5. Quinto: Libera interface (com fallback)
            if (typeof window.liberarInterface === 'function') {
                window.liberarInterface();
                console.log('✅ Interface liberada via função global');
            } else {
                liberarInterfaceFallback();
                console.log('✅ Interface liberada via fallback');
            }
            
            // 6. Sexto: Inicia câmera e WebRTC
            await iniciarCameraAposPermissoes();
            
            console.log('✅ Fluxo completo concluído com sucesso!');
            
        } catch (error) {
            console.error('❌ Erro no fluxo:', error);
            
            if (typeof window.mostrarErroCarregamento === 'function') {
                window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
            } else {
                console.error('❌ Erro no carregamento:', error);
            }
            
            permissaoButton.innerHTML = `
                <span style="font-size: 32px;">❌</span><br>
                <span style="font-size: 12px;">Erro nas permissões<br>Clique para tentar novamente</span>
            `;
            permissaoButton.style.background = '#f44336';
            permissaoButton.disabled = false;
            
            alert('Por favor, permita o acesso à câmera e microfone para usar o aplicativo.');
        }
    };
    
    document.body.appendChild(permissaoButton);

  } catch (error) {
    console.error("Erro ao inicializar aplicação:", error);
    alert("Erro ao inicializar a aplicação.");
  }
};
