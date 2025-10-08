// =============================================
// CONTROLE DE INTERFACE - TOGGLE DE INSTRUÇÕES
// =============================================

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES
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

// Inicializa o toggle quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});

// =============================================
// IMPORTAÇÕES DE MÓDULOS
// =============================================

import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// =============================================
// VARIÁVEIS GLOBAIS DE ÁUDIO
// =============================================

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// =============================================
// SISTEMA DE ÁUDIO - SOM DE DIGITAÇÃO
// =============================================

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

// =============================================
// SISTEMA DE PERMISSÕES
// =============================================

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

// =============================================
// SISTEMA DE IDIOMAS E TRADUÇÃO
// =============================================

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

// 🌐 TRADUÇÃO APENAS PARA TEXTO
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

// =============================================
// SISTEMA DE BANDEIRAS DE IDIOMA
// =============================================

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

// 🏳️ APLICA BANDEIRA DO IDIOMA REMOTA
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

// =============================================
// TRADUÇÃO DE TEXTOS DA INTERFACE
// =============================================

// 🌐 TRADUÇÃO DAS FRASES FIXAS (AGORA SEPARADA)
async function traduzirFrasesFixas(lang) {
  try {
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation.",
      "qr-modal-title": "This is your online key",
      "qr-modal-description": "You can ask to scan, share or print on your business card.",
      "welcome-text": "Hi, welcome!",
      "tap-qr": "Tap that QR Code",
      "quick-scan": "Quick scan",
      "drop-voice": "Drop your voice",
      "check-replies": "Check the replies",
      "flip-cam": "Flip the cam and show the vibes"
    };

    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, lang);
        el.textContent = traduzido;
      }
    }

    aplicarBandeiraLocal(lang); // ✅ chamada correta dentro do bloco
  } catch (error) {
    console.error("❌ Erro ao traduzir frases fixas:", error);
  }
}

// =============================================
// SISTEMA DE CÂMERA - TOGGLE E CONTROLE
// =============================================

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

// =============================================
// CONTROLE DE INTERFACE - BOTÃO CLICK
// =============================================

// ✅ FUNÇÃO PARA ESCONDER O BOTÃO CLICK QUANDO WEBRTC CONECTAR
function esconderClickQuandoConectar() {
    const elementoClick = document.getElementById('click');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (!elementoClick || !remoteVideo) return;
    
    // Observa mudanças no remoteVideo para detectar conexão
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'srcObject') {
                if (remoteVideo.srcObject) {
                    // WebRTC conectou - esconde o botão click DEFINITIVAMENTE
                    elementoClick.style.display = 'none';
                    elementoClick.classList.remove('piscar-suave');
                    console.log('🔗 WebRTC conectado - botão Click removido');
                    observer.disconnect(); // Para de observar
                }
            }
        });
    });
    
    // Começa a observar o remoteVideo
    observer.observe(remoteVideo, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
    
    console.log('👀 Observando conexão WebRTC para esconder botão Click');
}

// =============================================
// SISTEMA DE QR CODE
// =============================================

// ✅ CONFIGURAÇÃO DO BOTÃO QR CODE (VERSÃO FINAL)
function setupQRCodeButton() {
    const qrButton = document.getElementById('logo-traduz');
    if (!qrButton) return;

    qrButton.addEventListener('click', function() {
        // 🔄 VERIFICA SE JÁ EXISTE UM QR CODE ATIVO
        const overlay = document.querySelector('.info-overlay');
        const qrcodeContainer = document.getElementById('qrcode');
        
        // Se o overlay já está visível, apenas oculta (toggle)
        if (overlay && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            console.log('📱 QR Code fechado pelo usuário');
            return;
        }
        
        // 🔄 VERIFICA CONEXÃO WEBRTC DE FORMA MAIS INTELIGENTE
        const remoteVideo = document.getElementById('remoteVideo');
        const isConnected = remoteVideo && remoteVideo.srcObject;
        
        if (isConnected) {
            console.log('❌ WebRTC já conectado - QR Code não pode ser reaberto');
            return; // ⬅️ Apenas retorna silenciosamente
        }
        
        console.log('🗝️ Gerando/Reabrindo QR Code...');
        
        // 🔄 LIMPA QR CODE ANTERIOR SE EXISTIR
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
        }
        
        const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
        
        // Gera o QR Code
        QRCodeGenerator.generate("qrcode", callerUrl);
        
        // Mostra o overlay do QR Code
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        
        console.log('✅ QR Code gerado/reativado!');
    });

    // ✅ FECHA QR CODE AO CLICAR FORA (opcional)
    document.querySelector('.info-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
            console.log('📱 QR Code fechado (clique fora)');
        }
    });
}

// =============================================
// SISTEMA DE TEXTO PARA FALA (TTS) - VERSÃO HÍBRIDA CORRIGIDA
// =============================================

// 🎤 SISTEMA HÍBRIDO TTS - Google + Navegador
let primeiraFrase = true;
let navegadorPreparado = false;

// 🎤 FUNÇÃO TTS DO NAVEGADOR (GRÁTIS) - CORRIGIDA
function falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma) {
    return new Promise((resolve) => {
        try {
            // Para qualquer fala anterior
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(mensagem);
            utterance.lang = idioma; // ✅ CORREÇÃO: Usa o idioma da frase
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
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

// 🔄 PREPARAR NAVEGADOR TTS EM SEGUNDO PLANO - CORRIGIDA
function prepararNavegadorTTS(idioma) {
    if (navegadorPreparado) return;
    
    try {
        // Fala silenciosa para carregar o motor de voz
        const utterance = new SpeechSynthesisUtterance('');
        utterance.lang = idioma; // ✅ CORREÇÃO: Usa o idioma da frase
        utterance.volume = 0; // Silencioso
        utterance.onend = () => {
            navegadorPreparado = true;
            console.log(`✅ Navegador TTS preparado para ${idioma}`);
        };
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.log('⚠️ Não foi possível preparar navegador TTS:', error);
    }
}

// 🎤 FUNÇÃO GOOGLE TTS (PAGO) - CORRIGIDA
async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎤 Iniciando Google TTS para ${idioma}:`, mensagem.substring(0, 50) + '...');
        
        const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: idioma, // ✅ CORREÇÃO: Usa o idioma da frase
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

// 🎯 FUNÇÃO HÍBRIDA PRINCIPAL - CORRIGIDA
async function falarTexto(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
        
        if (primeiraFrase) {
            console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
            
            // ✅ 1. PRIMEIRA FRASE: Google TTS (rápido)
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            // ✅ 2. PREPARA NAVEGADOR EM SEGUNDO PLANO
            console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
            prepararNavegadorTTS(idioma);
            
            primeiraFrase = false;
            
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

// =============================================
// SISTEMA DE ENVIO DE MENSAGENS
// =============================================

// ✅ FUNÇÃO GLOBAL PARA ENVIAR MENSAGENS TRADUZIDAS
window.enviarMensagemTraduzida = function(mensagemTraduzida) {
    if (window.rtcCore && window.rtcCore.dataChannel && window.rtcCore.dataChannel.readyState === 'open') {
        window.rtcCore.dataChannel.send(mensagemTraduzida);
        console.log('✅ Mensagem traduzida enviada para outro celular:', mensagemTraduzida);
        return true;
    } else {
        console.log('⏳ Canal WebRTC não está pronto, tentando novamente em 1 segundo...');
        setTimeout(() => {
            window.enviarMensagemTraduzida(mensagemTraduzida);
        }, 1000);
        return false;
    }
};


// =============================================
// INICIALIZAÇÃO DA CÂMERA E WEBRTC
// =============================================

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

        // 🌐 INICIALIZA WEBRTC CORE
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

        // 🎯 CONFIGURA O BOTÃO QR CODE
        setupQRCodeButton();

        // 🔌 INICIALIZA WEBRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // 📩 CONFIGURA CALLBACK PARA MENSAGENS RECEBIDAS
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

    // ✅ LINHA ADICIONADA - PEGA O IDIOMA DE QUEM ENVIOU
    const idiomaDaFrase = window.sourceTranslationLang || 'pt-BR';
    
    // 🎤 CHAMADA CORRETA PARA TTS HÍBRIDO
    await falarTexto(mensagem, elemento, imagemImpaciente, idiomaDaFrase);
});

   // 📞 CONFIGURA HANDLER PARA CHAMADAS ENTRANTES
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
                    
                    // ✅ AGORA SIM: Esconde o botão Click quando WebRTC conectar
                    const elementoClick = document.getElementById('click');
                    if (elementoClick) {
                        elementoClick.style.display = 'none';
                        elementoClick.classList.remove('piscar-suave');
                        console.log('🔗 WebRTC conectado - botão Click removido permanentemente');
                    }
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

        // 🌐 TRADUZ FRASES FIXAS DA INTERFACE
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

        // 🏳️ APLICA BANDEIRA DO IDIOMA LOCAL
        aplicarBandeiraLocal(lang);

        // ⏳ INICIA TRADUTOR APÓS UM SEGUNDO
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        // ✅ INICIA O OBSERVADOR PARA ESCONDER O CLICK QUANDO CONECTAR
        esconderClickQuandoConectar();

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

// =============================================
// FUNÇÕES DE FALLBACK E UTILITÁRIOS
// =============================================

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    // Remove tela de loading
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    // Mostra conteúdo principal
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
}

// =============================================
// INICIALIZAÇÃO PRINCIPAL DA APLICAÇÃO
// =============================================

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
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};// =============================================
// CONTROLE DE INTERFACE - TOGGLE DE INSTRUÇÕES
// =============================================

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES
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

// Inicializa o toggle quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});

// =============================================
// IMPORTAÇÕES DE MÓDULOS
// =============================================

import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// =============================================
// VARIÁVEIS GLOBAIS DE ÁUDIO
// =============================================

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// =============================================
// SISTEMA DE ÁUDIO - SOM DE DIGITAÇÃO
// =============================================

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

// =============================================
// SISTEMA DE PERMISSÕES
// =============================================

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

// =============================================
// SISTEMA DE IDIOMAS E TRADUÇÃO
// =============================================

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

// 🌐 TRADUÇÃO APENAS PARA TEXTO
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

// =============================================
// SISTEMA DE BANDEIRAS DE IDIOMA
// =============================================

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

// 🏳️ APLICA BANDEIRA DO IDIOMA REMOTA
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

// =============================================
// TRADUÇÃO DE TEXTOS DA INTERFACE
// =============================================

// 🌐 TRADUÇÃO DAS FRASES FIXAS (AGORA SEPARADA)
async function traduzirFrasesFixas(lang) {
  try {
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation.",
      "qr-modal-title": "This is your online key",
      "qr-modal-description": "You can ask to scan, share or print on your business card.",
      "welcome-text": "Hi, welcome!",
      "tap-qr": "Tap that QR Code",
      "quick-scan": "Quick scan",
      "drop-voice": "Drop your voice",
      "check-replies": "Check the replies",
      "flip-cam": "Flip the cam and show the vibes"
    };

    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, lang);
        el.textContent = traduzido;
      }
    }

    aplicarBandeiraLocal(lang); // ✅ chamada correta dentro do bloco
  } catch (error) {
    console.error("❌ Erro ao traduzir frases fixas:", error);
  }
}

// =============================================
// SISTEMA DE CÂMERA - TOGGLE E CONTROLE
// =============================================

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

// =============================================
// CONTROLE DE INTERFACE - BOTÃO CLICK
// =============================================

// ✅ FUNÇÃO PARA ESCONDER O BOTÃO CLICK QUANDO WEBRTC CONECTAR
function esconderClickQuandoConectar() {
    const elementoClick = document.getElementById('click');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (!elementoClick || !remoteVideo) return;
    
    // Observa mudanças no remoteVideo para detectar conexão
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'srcObject') {
                if (remoteVideo.srcObject) {
                    // WebRTC conectou - esconde o botão click DEFINITIVAMENTE
                    elementoClick.style.display = 'none';
                    elementoClick.classList.remove('piscar-suave');
                    console.log('🔗 WebRTC conectado - botão Click removido');
                    observer.disconnect(); // Para de observar
                }
            }
        });
    });
    
    // Começa a observar o remoteVideo
    observer.observe(remoteVideo, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
    
    console.log('👀 Observando conexão WebRTC para esconder botão Click');
}

// =============================================
// SISTEMA DE QR CODE
// =============================================

// ✅ CONFIGURAÇÃO DO BOTÃO QR CODE (VERSÃO FINAL)
function setupQRCodeButton() {
    const qrButton = document.getElementById('logo-traduz');
    if (!qrButton) return;

    qrButton.addEventListener('click', function() {
        // 🔄 VERIFICA SE JÁ EXISTE UM QR CODE ATIVO
        const overlay = document.querySelector('.info-overlay');
        const qrcodeContainer = document.getElementById('qrcode');
        
        // Se o overlay já está visível, apenas oculta (toggle)
        if (overlay && !overlay.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            console.log('📱 QR Code fechado pelo usuário');
            return;
        }
        
        // 🔄 VERIFICA CONEXÃO WEBRTC DE FORMA MAIS INTELIGENTE
        const remoteVideo = document.getElementById('remoteVideo');
        const isConnected = remoteVideo && remoteVideo.srcObject;
        
        if (isConnected) {
            console.log('❌ WebRTC já conectado - QR Code não pode ser reaberto');
            return; // ⬅️ Apenas retorna silenciosamente
        }
        
        console.log('🗝️ Gerando/Reabrindo QR Code...');
        
        // 🔄 LIMPA QR CODE ANTERIOR SE EXISTIR
        if (qrcodeContainer) {
            qrcodeContainer.innerHTML = '';
        }
        
        const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
        
        // Gera o QR Code
        QRCodeGenerator.generate("qrcode", callerUrl);
        
        // Mostra o overlay do QR Code
        if (overlay) {
            overlay.classList.remove('hidden');
        }
        
        console.log('✅ QR Code gerado/reativado!');
    });

    // ✅ FECHA QR CODE AO CLICAR FORA (opcional)
    document.querySelector('.info-overlay').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.add('hidden');
            console.log('📱 QR Code fechado (clique fora)');
        }
    });
}

// =============================================
// SISTEMA DE TEXTO PARA FALA (TTS) - VERSÃO HÍBRIDA CORRIGIDA
// =============================================

// 🎤 SISTEMA HÍBRIDO TTS - Google + Navegador
let primeiraFrase = true;
let navegadorPreparado = false;

// 🎤 FUNÇÃO TTS DO NAVEGADOR (GRÁTIS) - CORRIGIDA
function falarComNavegadorTTS(mensagem, elemento, imagemImpaciente, idioma) {
    return new Promise((resolve) => {
        try {
            // Para qualquer fala anterior
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(mensagem);
            utterance.lang = idioma; // ✅ CORREÇÃO: Usa o idioma da frase
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
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

// 🔄 PREPARAR NAVEGADOR TTS EM SEGUNDO PLANO - CORRIGIDA
function prepararNavegadorTTS(idioma) {
    if (navegadorPreparado) return;
    
    try {
        // Fala silenciosa para carregar o motor de voz
        const utterance = new SpeechSynthesisUtterance('');
        utterance.lang = idioma; // ✅ CORREÇÃO: Usa o idioma da frase
        utterance.volume = 0; // Silencioso
        utterance.onend = () => {
            navegadorPreparado = true;
            console.log(`✅ Navegador TTS preparado para ${idioma}`);
        };
        window.speechSynthesis.speak(utterance);
    } catch (error) {
        console.log('⚠️ Não foi possível preparar navegador TTS:', error);
    }
}

// 🎤 FUNÇÃO GOOGLE TTS (PAGO) - CORRIGIDA
async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎤 Iniciando Google TTS para ${idioma}:`, mensagem.substring(0, 50) + '...');
        
        const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: idioma, // ✅ CORREÇÃO: Usa o idioma da frase
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

// 🎯 FUNÇÃO HÍBRIDA PRINCIPAL - CORRIGIDA
async function falarTexto(mensagem, elemento, imagemImpaciente, idioma) {
    try {
        console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
        
        if (primeiraFrase) {
            console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
            
            // ✅ 1. PRIMEIRA FRASE: Google TTS (rápido)
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente, idioma);
            
            // ✅ 2. PREPARA NAVEGADOR EM SEGUNDO PLANO
            console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
            prepararNavegadorTTS(idioma);
            
            primeiraFrase = false;
            
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
// =============================================
// INICIALIZAÇÃO DA CÂMERA E WEBRTC
// =============================================

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

        // 🌐 INICIALIZA WEBRTC CORE
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

        // 🎯 CONFIGURA O BOTÃO QR CODE
        setupQRCodeButton();

        // 🔌 INICIALIZA WEBRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // 📩 CONFIGURA CALLBACK PARA MENSAGENS RECEBIDAS
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

    // ✅ LINHA ADICIONADA - PEGA O IDIOMA DE QUEM ENVIOU
    const idiomaDaFrase = window.sourceTranslationLang || 'pt-BR';
    
    // 🎤 CHAMADA CORRETA PARA TTS HÍBRIDO
    await falarTexto(mensagem, elemento, imagemImpaciente, idiomaDaFrase);
});

   // 📞 CONFIGURA HANDLER PARA CHAMADAS ENTRANTES
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
                    
                    // ✅ AGORA SIM: Esconde o botão Click quando WebRTC conectar
                    const elementoClick = document.getElementById('click');
                    if (elementoClick) {
                        elementoClick.style.display = 'none';
                        elementoClick.classList.remove('piscar-suave');
                        console.log('🔗 WebRTC conectado - botão Click removido permanentemente');
                    }
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

        // 🌐 TRADUZ FRASES FIXAS DA INTERFACE
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

        // 🏳️ APLICA BANDEIRA DO IDIOMA LOCAL
        aplicarBandeiraLocal(lang);

        // ⏳ INICIA TRADUTOR APÓS UM SEGUNDO
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

        // ✅ INICIA O OBSERVADOR PARA ESCONDER O CLICK QUANDO CONECTAR
        esconderClickQuandoConectar();

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

// =============================================
// FUNÇÕES DE FALLBACK E UTILITÁRIOS
// =============================================

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    // Remove tela de loading
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    // Mostra conteúdo principal
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
}

// =============================================
// INICIALIZAÇÃO PRINCIPAL DA APLICAÇÃO
// =============================================

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
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};
