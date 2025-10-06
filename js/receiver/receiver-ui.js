import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES
function setupInstructionToggle() {
    const instructionBox = document.getElementById('instructionBox');
    const toggleButton = document.getElementById('instructionToggle');
    
    if (!instructionBox || !toggleButton) return;
    
    let isExpanded = true;
    
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation();
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            instructionBox.classList.remove('recolhido');
            instructionBox.classList.add('expandido');
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
        }
    });
}

// 🎥 FUNÇÃO PARA ALTERNAR ENTRE CÂMERAS
function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    let currentCamera = 'user';
    let isSwitching = false;

    if (!toggleButton) return;

    toggleButton.addEventListener('click', async () => {
        if (isSwitching) return;

        isSwitching = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.style.cursor = 'wait';

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            
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
                await tryFallbackCameras(currentCamera);
            }

        } catch (error) {
            console.error('❌ Erro ao alternar câmera:', error);
        } finally {
            isSwitching = false;
            toggleButton.style.opacity = '1';
            toggleButton.style.cursor = 'pointer';
        }
    });

    async function handleNewStream(newStream, cameraType) {
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = newStream;
        }

        window.localStream = newStream;

        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            
            if (connectionState === 'connected') {
                try {
                    window.rtcCore.localStream = newStream;
                    const newVideoTrack = newStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    let videoUpdated = false;
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            await sender.replaceTrack(newVideoTrack);
                            videoUpdated = true;
                        }
                    }
                } catch (webrtcError) {
                    console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
                }
            }
        }
    }

    async function tryFallbackCameras(requestedCamera) {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (videoDevices.length > 1) {
                const currentDeviceId = window.localStream ? 
                    window.localStream.getVideoTracks()[0]?.getSettings()?.deviceId : null;
                
                let newDeviceId;
                if (currentDeviceId && videoDevices.length > 1) {
                    const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
                    newDeviceId = videoDevices[(currentIndex + 1) % videoDevices.length].deviceId;
                } else {
                    newDeviceId = videoDevices[0].deviceId;
                }
                
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        deviceId: { exact: newDeviceId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });

                await handleNewStream(newStream, 'fallback');
                
            } else {
                alert('Apenas uma câmera foi detectada neste dispositivo.');
            }
        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError);
            alert('Não foi possível acessar outra câmera. Verifique as permissões.');
        }
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
                audioCarregado = true;
                resolve(true);
            });
            
            somDigitacao.addEventListener('error', () => {
                resolve(false);
            });
            
            somDigitacao.load();
            
        } catch (error) {
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
        somDigitacao.play().catch(error => {});
    } catch (error) {}
}

// 🎵 PARAR SOM DE DIGITAÇÃO
function pararSomDigitacao() {
    if (somDigitacao) {
        try {
            somDigitacao.pause();
            somDigitacao.currentTime = 0;
            somDigitacao.loop = false;
        } catch (error) {}
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
}

// 🎤 ✅✅✅ SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ (CORRIGIDA)
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 SOLICITANDO PERMISSÕES DE CÂMERA E MICROFONE...');
        
        // ✅✅✅ PARÂMETROS QUE GARANTEM OS POPUPS
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        
        console.log('✅✅✅ PERMISSÕES CONCEDIDAS! Popups apareceram com sucesso');
        
        // Para a stream imediatamente após conseguir permissão
        stream.getTracks().forEach(track => {
            track.stop();
            console.log(`⏹️ Track ${track.kind} parada`);
        });
        
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        window.audioContext = audioContext;
        
        return true;
        
    } catch (error) {
        console.error('❌❌❌ ERRO NAS PERMISSÕES:', error);
        console.error('❌ Detalhes do erro:', error.name, error.message);
        
        permissaoConcedida = false;
        window.permissoesConcedidas = false;
        
        // ✅ Tenta fallback se o erro for específico
        if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            console.log('🔄 Tentando fallback para permissões básicas...');
            return await tentarPermissoesFallback();
        }
        
        throw error;
    }
}

// ✅✅✅ FALLBACK PARA PERMISSÕES (SE A PRIMEIRA TENTATIVA FALHAR)
async function tentarPermissoesFallback() {
    try {
        console.log('🔄 Tentando fallback de permissões...');
        
        // Tentativa mais simples
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Fallback de permissões funcionou!');
        
        stream.getTracks().forEach(track => track.stop());
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        
        return true;
    } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        throw fallbackError;
    }
}

// ✅✅✅ FUNÇÃO PARA LIBERAR INTERFACE IMEDIATAMENTE
function liberarInterfaceImediatamente() {
    console.log('🔓 LIBERANDO INTERFACE - REMOVENDO LOADER...');
    
    // Remove o loader principal
    const mobileLoading = document.getElementById('mobileLoading');
    if (mobileLoading) {
        mobileLoading.style.display = 'none';
        console.log('✅ Loader mobileLoading REMOVIDO com sucesso');
    }
    
    // Remove outros loaders possíveis
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ LoadingScreen REMOVIDO com sucesso');
    }
    
    // Mostra conteúdo principal
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log('✅✅✅ INTERFACE COMPLETAMENTE LIBERADA');
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
    return text;
  }
}

// 🏳️ Aplica bandeira do idioma local
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

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
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

// 🎤 FUNÇÃO GOOGLE TTS SEPARADA
async function falarComGoogleTTS(mensagem, elemento) {
    try {
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
        
        audio.onplay = () => {
            pararSomDigitacao();
            
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
                elemento.textContent = mensagem;
            }
        };
        
        audio.onended = () => {
            console.log('🔚 Áudio Google TTS terminado');
        };
        
        audio.onerror = () => {
            pararSomDigitacao();
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
            }
        };

        await audio.play();
        
    } catch (error) {
        console.error('❌ Erro no Google TTS:', error);
    }
}

// ✅✅✅ FUNÇÃO PARA INICIAR CÂMERA E WEBRTC APÓS PERMISSÕES (CORRIGIDA)
async function iniciarCameraEWebRTC() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        console.log('📹 Iniciando câmera após permissões concedidas...');
        
        // ✅ SOLICITA APENAS CÂMERA AGORA (já temos áudio das permissões gerais)
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false  // ✅ Já temos permissão de áudio
        });
        
        let localStream = stream;
        window.localStream = localStream;
        
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        console.log('✅ Câmera iniciada com sucesso');

        // Configura botão de alternar câmera
        setupCameraToggle();

        // ✅ PEQUENA PAUSA PARA ESTABILIZAR
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🌐 Inicializando WebRTC...');
        window.rtcCore = new WebRTCCore();

        // ✅✅✅ CONFIGURAÇÃO CORRETA DO WEBRTC (do Arquivo 1)
        const url = window.location.href;
        const urlParts = url.split('?');
        const queryParams = urlParts[1] ? urlParts[1].split('&') : [];
        
        const myId = queryParams[0] && !queryParams[0].includes('=') 
            ? queryParams[0] 
            : crypto.randomUUID().substr(0, 8);

        let lang = 'pt-BR';
        const langParam = queryParams.find(param => param.startsWith('lang='));
        if (langParam) {
            lang = langParam.split('=')[1];
        }

        window.targetTranslationLang = lang;

        // ✅✅✅ CONFIGURA CALLBACKS ANTES DE INICIALIZAR (do Arquivo 1)
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

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

            // 🎤 CHAMADA PARA GOOGLE TTS
            await falarComGoogleTTS(mensagem, elemento);
        });

        // ✅✅✅ MANTÉM A FUNCIONALIDADE DE RECEBIMENTO DE CHAMADAS (do Arquivo 1)
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

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

                // ✅ FECHA A CAIXA DE INSTRUÇÕES QUANDO CONECTAR
                const instructionBox = document.getElementById('instructionBox');
                if (instructionBox) {
                    instructionBox.classList.remove('expandido');
                    instructionBox.classList.add('recolhido');
                    console.log('📖 Instruções fechadas (WebRTC conectado)');
                }
            });
        };

        // ✅ INICIALIZA WEBRTC (do Arquivo 2)
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // Marca que o WebRTC está inicializado (do Arquivo 2)
        window.rtcCore.isInitialized = true;
        console.log('✅ WebRTC inicializado com ID:', myId);

        // ✅ TRADUZ FRASES FIXAS
        const frasesParaTraduzir = {
            "translator-label": "Real-time translation."
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

        // ✅ VERIFICA SE É RECEIVER E INICIA CONEXÃO (do Arquivo 2)
        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const receiverToken = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        if (receiverId) {
            console.log('🎯 Modo Receiver - Iniciando conexão com:', receiverId);
            
            // ✅ IMPLEMENTAÇÃO SIMPLIFICADA DA CONEXÃO VISUAL
            setTimeout(() => {
                if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
                    window.rtcCore.startCall(receiverId, localStream, lang);
                    console.log('📞 Chamada iniciada para:', receiverId);
                }
            }, 1000);
        }

        console.log('✅✅✅ CÂMERA E WEBRTC INICIALIZADOS COM SUCESSO!');

    } catch (error) {
        console.error("❌ Erro ao iniciar câmera e WebRTC:", error);
        throw error;
    }
}

// 🚀✅✅✅ INICIALIZAÇÃO UNIFICADA - MELHOR DE AMBOS OS ARQUIVOS
window.onload = async () => {
    try {
        // ✅ CONFIGURA TOGGLE DAS INSTRUÇÕES
        setupInstructionToggle();
        
        // ✅ BOTÃO INTERATIVO PARA PERMISSÕES (do Arquivo 1)
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
                
                // 1. Inicia áudio
                iniciarAudio();
                
                // 2. Carrega sons
                await carregarSomDigitacao();
                
                // 3. ✅ SOLICITA TODAS AS PERMISSÕES (do Arquivo 2 - que funciona)
                await solicitarTodasPermissoes();
                
                // 4. Remove botão
                permissaoButton.remove();
                
                // 5. ✅ LIBERA INTERFACE IMEDIATAMENTE (do Arquivo 2)
                liberarInterfaceImediatamente();
                
                // 6. ✅ INICIA CÂMERA E WEBRTC (função unificada)
                await iniciarCameraEWebRTC();
                
                console.log('✅✅✅ FLUXO COMPLETO CONCLUÍDO COM SUCESSO!');
                
            } catch (error) {
                console.error('❌ Erro no fluxo:', error);
                
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
        console.error("❌ Erro ao inicializar:", error);
        alert("Erro ao inicializar a aplicação.");
    }
};
