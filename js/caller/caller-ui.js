// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoMicrofoneConcedida = false;
let permissaoCameraConcedida = false;

// 🎵 CARREGAR SOM DE DIGITAÇÃO
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

// 🎵 INICIAR LOOP DE DIGITAÇÃO
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

// 🎵 PARAR SOM DE DIGITAÇÃO
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

// 🎵 DESBLOQUEAR ÁUDIO (silenciosamente)
function desbloquearAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Cria um som quase inaudível para desbloquear áudio
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = 0.001; // Quase mudo
    oscillator.frequency.value = 1; // Frequência muito baixa
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    console.log('🎵 Áudio desbloqueado silenciosamente');
}

// 🎤 SOLICITAR PERMISSÃO DO MICROFONE (apenas quando necessário)
async function solicitarPermissaoMicrofone() {
    try {
        console.log('🎤 Solicitando permissão do microfone...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        console.log('✅ Permissão do microfone concedida!');
        permissaoMicrofoneConcedida = true;
        
        // Para o stream imediatamente - só precisávamos da permissão
        stream.getTracks().forEach(track => track.stop());
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro na permissão do microfone:', error);
        permissaoMicrofoneConcedida = false;
        throw error;
    }
}

// 📹 SOLICITAR PERMISSÃO DA CÂMERA (apenas quando necessário)
async function solicitarPermissaoCamera() {
    try {
        console.log('📹 Solicitando permissão da câmera...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
        
        console.log('✅ Permissão da câmera concedida!');
        permissaoCameraConcedida = true;
        
        // Configura o vídeo local
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
        }
        
        // Remove o placeholder
        const placeholder = document.getElementById('cameraPlaceholder');
        if (placeholder) {
            placeholder.style.display = 'none';
        }
        
        return stream;
        
    } catch (error) {
        console.error('❌ Erro na permissão da câmera:', error);
        permissaoCameraConcedida = false;
        throw error;
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

// 🔔 FUNÇÃO: Notificação SIMPLES para acordar receiver
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

// 📞 FUNÇÃO: Criar tela de chamada visual (sem textos)
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

// 🔄 FUNÇÃO UNIFICADA: Tentar conexão visual (COM ESPERA INTELIGENTE)
async function iniciarConexaoVisual(receiverId, receiverToken, meuId, meuIdioma) {
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
          // Inicia chamada SEM stream de mídia inicial
          window.rtcCore.startCall(receiverId, null, meuIdioma);
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
            window.rtcCore.startCall(receiverId, null, meuIdioma);
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

// 🎤 FUNÇÃO GOOGLE TTS SEPARADA
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

// ✅ FUNÇÃO PARA INICIAR WEBRTC SEM MÍDIA
async function iniciarWebRTCAposCarregamento() {
    try {
        console.log('🌐 Inicializando WebRTC sem mídia...');
        window.rtcCore = new WebRTCCore();

        // Configura callbacks ANTES de inicializar
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            const imagemImpaciente = document.getElementById('lemurFixed');
            
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
                elemento.style.transition = 'opacity 0.5s ease';
                
                elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elemento.style.border = '2px solid #ff0000';
            }

            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'block';
            }

            // 🎤 CHAMADA PARA GOOGLE TTS
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

        window.receiverInfo = {
          id: receiverId,
          token: receiverToken,
          lang: receiverLang
        };

        // ✅ SÓ INICIA CONEXÃO SE TIVER receiverId
        if (receiverId) {
          document.getElementById('callActionBtn').style.display = 'none';
          
          const meuIdioma = await obterIdiomaCompleto(navigator.language);
          
          // ✅ PEQUENO ATRASO PARA GARANTIR QUE TUDO ESTÁ ESTÁVEL
          setTimeout(() => {
            iniciarConexaoVisual(receiverId, receiverToken, myId, meuIdioma);
          }, 1000);
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
        console.error("Erro ao iniciar WebRTC:", error);
        throw error;
    }
}

// 🎯 CONFIGURA BOTÃO DA CÂMERA
function configurarBotaoCamera() {
    const pipWrapper = document.querySelector('.pip-local-wrapper');
    if (!pipWrapper) return;
    
    pipWrapper.style.cursor = 'pointer';
    pipWrapper.addEventListener('click', async function() {
        try {
            console.log('📹 Usuário clicou para ativar câmera...');
            await solicitarPermissaoCamera();
        } catch (error) {
            console.error('❌ Usuário recusou a câmera:', error);
            alert('Para usar a câmera, por favor permita o acesso quando solicitado.');
        }
    });
}

window.onload = async () => {
  try {
    console.log('🚀 Iniciando aplicação Caller...');
    
    // 1. ✅ DESBLOQUEIA ÁUDIO SILENCIOSAMENTE
    desbloquearAudio();
    
    // 2. ✅ CARREGA SONS EM BACKGROUND
    await carregarSomDigitacao();
    
    // 3. ✅ INICIA WEBRTC (sem mídia)
    await iniciarWebRTCAposCarregamento();
    
    // 4. ✅ CONFIGURA BOTÃO DA CÂMARA
    configurarBotaoCamera();
    
    console.log('✅ Aplicação Caller iniciada com sucesso!');

  } catch (error) {
    console.error("Erro ao inicializar aplicação:", error);
    alert("Erro ao inicializar a aplicação.");
  }
};
