import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

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

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ
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

// 🏳️ Aplica bandeira do idioma local
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        // ✅ CORREÇÃO: MESMA BANDEIRA NAS DUAS POSIÇÕES
        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

        console.log('🏳️ Bandeira local aplicada:', bandeira, 'em duas posições');

    } catch (error) {
        console.error('Erro ao carregar bandeira local:', error);
    }
}

// 🏳️ Aplica bandeira do idioma remota
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

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (MELHORADA E CONFIÁVEL)
function liberarInterfaceFallback() {
    console.log('🔓 Liberando interface...');
    
    // 1. Remove tela de loading principal
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading principal removida');
    }
    
    // 2. Remove loading mobile específico
    const mobileLoading = document.getElementById('mobileLoading');
    if (mobileLoading) {
        mobileLoading.style.display = 'none';
        console.log('✅ Loading mobile removido');
    }
    
    // 3. Mostra todos os elementos escondidos
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
        elemento.style.visibility = 'visible';
        elemento.style.opacity = '1';
    });
    
    // 4. Garante que o vídeo local seja mostrado
    const localVideo = document.getElementById('localVideo');
    if (localVideo) {
        localVideo.style.display = 'block';
    }
    
    // 5. Remove qualquer overlay de bloqueio restante
    const overlays = document.querySelectorAll('.loading-overlay, .permission-overlay');
    overlays.forEach(overlay => {
        if (overlay && overlay.parentNode) {
            overlay.style.display = 'none';
        }
    });
    
    console.log(`✅ Interface liberada - ${elementosEscondidos.length} elementos ativados`);
    
    // Marca globalmente que a interface foi liberada
    window.interfaceLiberada = true;
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS (AGORA SEPARADA)
async function traduzirFrasesFixas(lang) {
    try {
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
                console.log(`✅ Traduzido: ${texto} → ${traduzido}`);
            }
        }
        
        aplicarBandeiraLocal(lang);
        
    } catch (error) {
        console.error('❌ Erro ao traduzir frases:', error);
    }
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

// ✅ FUNÇÃO PARA INICIAR CÂMERA APÓS PERMISSÕES
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        let localStream = stream;
        window.localStream = localStream; // Armazena globalmente

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
            
            // ✅ MOSTRA BOTÃO E REMOVE LOADING QUANDO CÂMERA ESTIVER PRONTA
            const mobileLoading = document.getElementById('mobileLoading');
            if (mobileLoading) {
                mobileLoading.style.display = 'none';
            }

            // Aparece 2 segundos após a câmera carregar
            setTimeout(() => {
                const elementoClick = document.getElementById('click');
                if (elementoClick) {
                    elementoClick.style.display = 'block';
                    elementoClick.classList.add('piscar-suave'); // Começa a piscar
                }
            }, 500);
        }

        // 🎥 CONFIGURA BOTÃO DE ALTERNAR CÂMERA
        setupCameraToggle();

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

        // ✅ GUARDA as informações para gerar QR Code depois (QUANDO O USUÁRIO CLICAR)
        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        // ✅ CONFIGURA o botão para gerar QR Code quando clicado
        document.getElementById('logo-traduz').addEventListener('click', function() {
           
            // ✅ FAZ O #click DESAPARECER
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.style.display = 'none';
            }
            
            // 🔒 BLOQUEIA se WebRTC já estiver conectado
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo && remoteVideo.srcObject) {
                console.log('❌ WebRTC conectado - Botão bloqueado');
                return; // Simplesmente não faz nada
            }
            
            console.log('🗝️ Gerando QR Code...');
            
            const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
            
            // Gera o QR Code
            QRCodeGenerator.generate("qrcode", callerUrl);
            
            // Mostra o overlay do QR Code
            const overlay = document.querySelector('.info-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            
            console.log('✅ QR Code gerado!');
        });

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

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

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        
        // ✅ EM CASO DE ERRO TAMBÉM REMOVE LOADING
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        throw error;
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA (SEM BOTÃO DE PERMISSÕES)
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação receiver automaticamente...');
        
        // 1. Obtém o idioma para tradução
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        // 2. Traduz as frases fixas PRIMEIRO
        await traduzirFrasesFixas(lang);
        
        // 3. Inicia áudio
        iniciarAudio();
        
        // 4. Carrega sons da máquina de escrever
        await carregarSomDigitacao();
        
        // 5. Solicita TODAS as permissões (câmera + microfone)
        await solicitarTodasPermissoes();
        
        // 6. Libera interface
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
        // 7. Inicia câmera e WebRTC
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Receiver iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar receiver:', error);
        
        // ✅ LIBERAR INTERFACE MESMO EM CASO DE ERRO
        liberarInterfaceFallback();
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
    
    // ✅ GARANTIR QUE A INTERFACE SEJA LIBERADA (LINHA ADICIONAL)
    setTimeout(() => {
        if (!window.interfaceLiberada) {
            console.log('🔄 Garantindo liberação da interface...');
            liberarInterfaceFallback();
        }
    }, 5000); // 5 segundos como fallback
};
