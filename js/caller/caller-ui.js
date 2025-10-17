// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';
import { CameraVigilante } from '../../core/camera-vigilante.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO
let primeiraFraseTTS = true;
let navegadorTTSPreparado = false;
let ultimoIdiomaTTS = 'pt-BR';

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES (IGUAL AO RECEIVER)
function setupInstructionToggle() {
    const instructionBox = document.getElementById('instructionBox');
    const toggleButton = document.getElementById('instructionToggle');
    
    if (!instructionBox || !toggleButton) return;
    
    // Estado inicial: expandido
    let isExpanded = true;
    
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation(); // Impede que o clique propague para o box
        
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            instructionBox.classList.remove('recolhido');
            instructionBox.classList.add('expandido');
            console.log('📖 Instruções expandidas');
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            console.log('📖 Instruções recolhidas');
        }
    });
    
    // Opcional: fechar ao clicar fora (se quiser)
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
            console.log('📖 Instruções fechadas (clique fora)');
        }
    });
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS (IGUAL AO RECEIVER)
async function traduzirFrasesFixas() {
  try {
    // ✅✅✅ AGORA USA O IDIOMA GUARDADO!
    const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
    
    console.log(`🌐 Traduzindo frases fixas para: ${idiomaExato}`);

    const frasesParaTraduzir = {
       "translator-label": "Real-time translation.",      // ⬅️ PRIMEIRO ELEMENTO
  "translator-label-2": "Real-time translation.",   // ⬅️ SEGUNDO ELEMENTO (NOVO)
  "welcome-text": "Welcome! Let's begin.",
  "wait-connection": "Waiting for connection.",
  "both-connected": "Both online.",
  "drop-voice": "Speak clearly.",
  "check-replies": "Read the message.",
  "flip-cam": "Flip the camera. Share!"
    };

    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, idiomaExato);
        el.textContent = traduzido;
        console.log(`✅ Traduzido: ${texto} → ${traduzido}`);
      }
    }

    console.log('✅ Frases fixas traduzidas com sucesso');

  } catch (error) {
    console.error("❌ Erro ao traduzir frases fixas:", error);
  }
}

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

// 🎵 INICIAR ÁUDIO APÓS INTERAÇÃO DO USUÁRIO
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

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ (IGUAL AO RECEIVER)
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
    const response = await fetch('https://chat-tradutor.onrender.com/translate', {
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
    
    const response = await fetch('https://serve-app.onrender.com/send-notification', {
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

// 📞 FUNÇÃO: Criar tela de chamada visual COM IMAGEM DO LEMUR
function criarTelaChamando() {
  // Primeiro, mostra a imagem do lemur
  const lemurWaiting = document.getElementById('lemurWaiting');
  if (lemurWaiting) {
    lemurWaiting.style.display = 'block';
  }

  const telaChamada = document.createElement('div');
  telaChamada.id = 'tela-chamando';
  telaChamada.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(102, 126, 234, 0.3); /* Violeta com 30% de transparência */
    z-index: 9997;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;

  // Botão de cancelar apenas
  telaChamada.innerHTML = `
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
      z-index: 9999;
    ">
      ✕
    </div>
  `;

  document.body.appendChild(telaChamada);

  document.getElementById('botao-cancelar').addEventListener('click', function() {
    // Esconde a imagem do lemur ao cancelar
    if (lemurWaiting) {
      lemurWaiting.style.display = 'none';
    }
    telaChamada.remove();
    window.conexaoCancelada = true;
    console.log('❌ Chamada cancelada pelo usuário');
  });

  return telaChamada;
}

// 🎥 FUNÇÃO PARA ALTERNAR ENTRE CÂMERAS (CORRIGIDA - ROBUSTA)
function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user'; // 'user' = frontal, 'environment' = traseira
    let isSwitching = false; // Evita múltiplos cliques

    if (!toggleButton) {
        console.log('❌ Botão de alternar câmera não encontrado');
        return;
    }

    toggleButton.addEventListener('click', async () => {
        // Evita múltiplos cliques durante a troca
        if (isSwitching) {
            console.log('⏳ Troca de câmera já em andamento...');
            return;
        }

        isSwitching = true;
        toggleButton.style.opacity = '0.5'; // Feedback visual
        toggleButton.style.cursor = 'wait';

        try {
            console.log('🔄 Iniciando troca de câmera...');
            
            // ✅ 1. PARA COMPLETAMENTE a stream atual
            if (window.localStream) {
                console.log('⏹️ Parando stream atual...');
                window.localStream.getTracks().forEach(track => {
                    track.stop(); // Para completamente cada track
                });
                window.localStream = null;
            }

            // ✅ 2. PEQUENA PAUSA para o navegador liberar a câmera
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ 3. Alterna entre frontal e traseira
            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            console.log(`🎯 Solicitando câmera: ${currentCamera === 'user' ? 'Frontal' : 'Traseira'}`);
            
            // ✅ 4. TENTATIVA PRINCIPAL com facingMode
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        facingMode: currentCamera,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });

                await handleNewStream(newStream, currentCamera);
                
            } catch (facingModeError) {
                console.log('❌ facingMode falhou, tentando fallback...');
                await tryFallbackCameras(currentCamera);
            }

        } catch (error) {
            console.error('❌ Erro crítico ao alternar câmera:', error);
            alert('Não foi possível alternar a câmera. Tente novamente.');
        } finally {
            // ✅ SEMPRE restaura o botão
            isSwitching = false;
            toggleButton.style.opacity = '1';
            toggleButton.style.cursor = 'pointer';
        }
    });

    // ✅ FUNÇÃO PARA LIDAR COM NOVA STREAM
    async function handleNewStream(newStream, cameraType) {
        // Atualiza o vídeo local
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = newStream;
        }

        // ✅ ATUALIZAÇÃO CRÍTICA: Atualiza stream global
        window.localStream = newStream;

        // ✅ ATUALIZAÇÃO CRÍTICA: WebRTC
        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            console.log(`📡 Estado da conexão WebRTC: ${connectionState}`);
            
            if (connectionState === 'connected') {
                console.log('🔄 Atualizando WebRTC com nova câmera...');
                
                try {
                    // Atualiza o stream local no core
                    window.rtcCore.localStream = newStream;
                    
                    // Usa replaceTrack para atualizar a transmissão
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    let videoUpdated = false;
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            await sender.replaceTrack(newVideoTrack);
                            videoUpdated = true;
                            console.log('✅ Sender de vídeo atualizado no WebRTC');
                        }
                    }
                    
                    if (!videoUpdated) {
                        console.log('⚠️ Nenhum sender de vídeo encontrado');
                    }
                } catch (webrtcError) {
                    console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
                }
            } else {
                console.log(`ℹ️ WebRTC não conectado (${connectionState}), apenas atualização local`);
            }
        }

        console.log(`✅ Câmera alterada para: ${cameraType === 'user' ? 'Frontal' : 'Traseira'}`);
    }

    // ✅ FALLBACK PARA DISPOSITIVOS MÚLTIPLOS
    async function tryFallbackCameras(requestedCamera) {
        try {
            console.log('🔄 Buscando dispositivos de câmera...');
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`📷 Câmeras encontradas: ${videoDevices.length}`);
            
            if (videoDevices.length > 1) {
                // ✅ Estratégia: Pega a próxima câmera disponível
                const currentDeviceId = window.localStream ? 
                    window.localStream.getVideoTracks()[0]?.getSettings()?.deviceId : null;
                
                let newDeviceId;
                if (currentDeviceId && videoDevices.length > 1) {
                    // Encontra a próxima câmera na lista
                    const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
                    newDeviceId = videoDevices[(currentIndex + 1) % videoDevices.length].deviceId;
                } else {
                    // Primeira vez ou não conseguiu identificar, pega a primeira disponível
                    newDeviceId = videoDevices[0].deviceId;
                }
                
                console.log(`🎯 Tentando câmera com deviceId: ${newDeviceId.substring(0, 10)}...`);
                
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        deviceId: { exact: newDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });

                await handleNewStream(newStream, 'fallback');
                console.log('✅ Câmera alternada via fallback de dispositivos');
                
            } else {
                console.warn('⚠️ Apenas uma câmera disponível');
                alert('Apenas uma câmera foi detectada neste dispositivo.');
            }
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
            alert('Não foi possível acessar outra câmera. Verifique as permissões.');
        }
    }

    console.log('✅ Botão de alternar câmera configurado com tratamento robusto');
}

// 🔄 FUNÇÃO UNIFICADA: Tentar conexão visual (COM ESPERA INTELIGENTE)
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
    
    // ✅ ESCONDE A IMAGEM DO LEMUR AO CONECTAR
    const lemurWaiting = document.getElementById('lemurWaiting');
    if (lemurWaiting) {
        lemurWaiting.style.display = 'none';
    }
    
    // ✅ FECHA A CAIXA DE INSTRUÇÕES QUANDO CONECTAR
    const instructionBox = document.getElementById('instructionBox');
    if (instructionBox) {
        instructionBox.classList.remove('expandido');
        instructionBox.classList.add('recolhido');
        console.log('📖 Instruções fechadas (WebRTC conectado)');
    }
    
    const telaChamada = document.getElementById('tela-chamando');
    if (telaChamada) telaChamada.remove();
    
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = stream;
});
}

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK) - CORRIGIDA
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    // ✅ CORREÇÃO: Remove o loader correto (mobileLoading) - IGUAL AO RECEIVER
    const mobileLoading = document.getElementById('mobileLoading');
    if (mobileLoading) {
        mobileLoading.style.display = 'none';
        console.log('✅ Loader mobileLoading removido');
    }
    
    console.log('✅ Interface liberada via fallback');
}

// 🏳️ Aplica bandeira do idioma local
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        // ✅✅✅ SOLUÇÃO INTELIGENTE: Guardar o idioma original
        window.meuIdiomaLocal = langCode;
        console.log('💾 Idioma local guardado:', window.meuIdiomaLocal);

        // ✅ MESMA BANDEIRA NAS DUAS POSIÇÕES (usando elementos que EXISTEM)
        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

        console.log('🏳️ Bandeira local aplicada no CALLER:', bandeira, 'em duas posições');

    } catch (error) {
        console.error('Erro ao carregar bandeira local no caller:', error);
    }
}

// 🏳️ Aplica bandeira do idioma remota
async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        // ✅✅✅ SOLUÇÃO INTELIGENTE: Guardar o idioma REMOTO também!
        window.meuIdiomaRemoto = langCode;
        console.log('💾 Idioma REMOTO guardado:', window.meuIdiomaRemoto);

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        console.error('Erro ao carregar bandeira remota:', error);
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO - SUBSTITUIÇÃO COMPLETA

// 🎤 FUNÇÃO TTS DO NAVEGADOR (GRÁTIS) - OTIMIZADA
function falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma) {
    return new Promise((resolve) => {
        try {
            // Para qualquer fala anterior
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(mensagem);
            utterance.lang = idioma;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.9;
            
            // EVENTO: FALA COMEÇOU
            utterance.onstart = () => {
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
                
                console.log(`🔊 Áudio Navegador TTS iniciado em ${idioma}`);
            };
            
            // EVENTO: FALA TERMINOU
            utterance.onend = () => {
                console.log('🔚 Áudio Navegador TTS terminado');
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
                resolve(true);
            };
            
            // EVENTO: ERRO NA FALA
            utterance.onerror = (error) => {
                pararSomDigitacao();
                console.log('❌ Erro no áudio Navegador TTS:', error);
                if (elemento) {
                    elemento.style.animation = 'none';
                    elemento.style.backgroundColor = '';
                    elemento.style.border = '';
                }
                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'none';
                }
                resolve(false);
            };
            
            window.speechSynthesis.speak(utterance);
            
        } catch (error) {
            console.error('❌ Erro no Navegador TTS:', error);
            resolve(false);
        }
    });
}

// 🔄 PREPARAR NAVEGADOR TTS EM SEGUNDO PLANO
function prepararNavegadorTTS(idioma) {
    if (navegadorTTSPreparado) return;
    
    try {
        // Fala silenciosa para carregar o motor de voz
        const utterance = new SpeechSynthesisUtterance('');
        utterance.lang = idioma;
        utterance.volume = 0; // Silencioso
        utterance.onend = () => {
            navegadorTTSPreparado = true;
            console.log(`✅ Navegador TTS preparado para ${idioma}`);
        };
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.log('⚠️ Não foi possível preparar navegador TTS:', error);
    }
}

// 🎤 FUNÇÃO GOOGLE TTS (PAGO) - ATUALIZADA
async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎤 Iniciando Google TTS para ${idioma}:`, mensagem.substring(0, 50) + '...');
        
        const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: idioma,
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
            
            console.log(`🔊 Áudio Google TTS iniciado em ${idioma}`);
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
        throw error; // Repassa o erro para o fallback
    }
}

// 🎯 FUNÇÃO HÍBRIDA PRINCIPAL - SISTEMA AVANÇADO
async function falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
        
        // Atualiza último idioma usado
        ultimoIdiomaTTS = idioma;
        
        if (primeiraFraseTTS) {
            console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
            
            // ✅ 1. PRIMEIRA FRASE: Google TTS (rápido)
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            // ✅ 2. PREPARA NAVEGADOR EM SEGUNDO PLANO
            console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
            prepararNavegadorTTS(idioma);
            
            primeiraFraseTTS = false;
            
        } else {
            console.log('💰 PRÓXIMAS FRASES: Usando Navegador TTS (grátis)');
            
            // ✅ 3. PRÓXIMAS FRASES: Navegador TTS (grátis)
            const sucesso = await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            // ✅ 4. FALLBACK: Se navegador falhar, volta para Google
            if (!sucesso) {
                console.log('🔄 Fallback: Navegador falhou, usando Google TTS');
                await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            }
        }
        
        console.log('✅ TTS concluído com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no sistema híbrido TTS:', error);
        
        // ✅ FALLBACK FINAL: Tenta navegador como última opção
        console.log('🔄 Tentando fallback final com navegador TTS...');
        await falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma);
    }
}

// ✅ FUNÇÃO PARA INICIAR CÂMERA APÓS PERMISSÕES (MODO RESILIENTE)
async function iniciarCameraAposPermissoes() {
    try {
        console.log('🎥 Tentando iniciar câmera CALLER (modo resiliente)...');
        
        // ✅ TENTA a câmera, mas NÃO TRAVA se falhar
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        }).catch(error => {
            console.log('⚠️ Câmera CALLER indisponível, continuando sem vídeo...', error);
            return null; // ⬅️ RETORNA NULL EM VEZ DE THROW ERROR
        });

        // ✅ SE CÂMERA FUNCIONOU: Configura normalmente
        if (stream) {
            window.localStream = stream;
            
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
            }

            // 🎥 CONFIGURA BOTÃO DE ALTERNAR CÂMERA (só se câmera funcionou)
            setupCameraToggle();
            
            console.log('✅ Câmera CALLER iniciada com sucesso');

            // 🆕 🆕 🆕 ADICIONAR ESTAS 2 LINHAS AQUI 🆕 🆕 🆕
    window.cameraVigilante = new CameraVigilante();
    window.cameraVigilante.iniciarMonitoramento();
    // 🆕 🆕 🆕 FIM DAS 2 LINHAS 🆕 🆕 🆕
        
        } else {
            // ✅ SE CÂMERA FALHOU: Apenas avisa, mas continua
            console.log('ℹ️ CALLER operando em modo áudio/texto (sem câmera)');
            window.localStream = null;
        }

        // ✅✅✅ REMOVE LOADING INDEPENDENTE DA CÂMERA
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        console.log('🌐 Inicializando WebRTC CALLER...');
        window.rtcCore = new WebRTCCore();

        // ✅✅✅ CONFIGURA CALLBACKS ANTES DE INICIALIZAR (MANTÉM CÓDIGO ORIGINAL)
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida no CALLER:', mensagem);

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

            // ✅✅✅ SOLUÇÃO DEFINITIVA: Usar o idioma GUARDADO
            const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
            
            console.log(`🎯 TTS Caller: Idioma guardado = ${idiomaExato}`);
            
            // 🎤 CHAMADA PARA SISTEMA HÍBRIDO TTS AVANÇADO
            await falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idiomaExato);
        });

        const myId = crypto.randomUUID().substr(0, 8);
        document.getElementById('myId').textContent = myId;

        console.log('🔌 Inicializando socket handlers CALLER...');
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ MARCA QUE O WEBRTC ESTÁ INICIALIZADO
        window.rtcCore.isInitialized = true;
        console.log('✅ WebRTC CALLER inicializado com ID:', myId);

        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const receiverToken = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        window.receiverInfo = {
          id: receiverId,
          token: receiverToken,
          lang: receiverLang
        };

        // ✅✅✅ CORREÇÃO CRÍTICA: INICIA CONEXÃO MESMO SEM CÂMERA
        if (receiverId) {
          document.getElementById('callActionBtn').style.display = 'none';
          
          // ✅✅✅ REMOVEMOS a verificação "if (localStream)" - AGORA SEMPRE INICIA!
          const meuIdioma = window.meuIdiomaLocal || 'pt-BR';
          
          // ✅ PEQUENO ATRASO PARA GARANTIR QUE TUDO ESTÁ ESTÁVEL
          setTimeout(() => {
            // ✅✅✅ ENVIA null se câmera falhou - WebRTC deve aceitar!
            const streamParaEnviar = window.localStream || null;
            iniciarConexaoVisual(receiverId, receiverToken, myId, streamParaEnviar, meuIdioma);
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
        // ✅✅✅ EM CASO DE ERRO: Remove loading E continua
        console.error("❌ Erro não crítico na câmera CALLER:", error);
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        // ✅ NÃO FAZ throw error! Apenas retorna normalmente
        console.log('🟡 CALLER continua funcionando (áudio/texto)');
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA (ATUALIZADA COM NOVAS FUNCIONALIDADES)
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação caller automaticamente...');
        
        // 1. Obtém o idioma para tradução - APENAS DO NAVEGADOR (IGUAL AO RECEIVER)
        const lang = navigator.language || 'pt-BR';
        
        // ✅✅✅ PRIMEIRO: Aplica bandeira e GUARDA o idioma
        await aplicarBandeiraLocal(lang);

        // ✅✅✅ DEPOIS: Traduz frases com o idioma JÁ GUARDADO  
        await traduzirFrasesFixas();
        
        // 3. Inicia áudio
        iniciarAudio();
        
        // 4. Carrega sons da máquina de escrever
        await carregarSomDigitacao();
        
        // 5. Solicita TODAS as permissões (câmera + microfone) - AUTOMÁTICO
        await solicitarTodasPermissoes();
        
        // 6. Configura o toggle das instruções (NOVO)
        setupInstructionToggle();
        
        // 7. Libera interface (remove loading)
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
        // 8. Inicia câmera e WebRTC (já inclui setupCameraToggle)
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Caller iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar caller:', error);
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};
