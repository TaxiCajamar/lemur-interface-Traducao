import { WebRTCCore } from '../../core/webrtc-core.js';
import { CameraVigilante } from '../../core/camera-vigilante.js';

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
        console.log('🎯 Solicitando permissões para notificador...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Permissões concedidas para notificador!');
        
        stream.getTracks().forEach(track => track.stop());
        
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro nas permissões:', error);
        permissaoConcedida = false;
        window.permissoesConcedidas = false;
        throw error;
    }
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

        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

        console.log('🏳️ Bandeira local aplicada:', bandeira);

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

// 🌐 TRADUÇÃO DAS FRASES FIXAS
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

// 🎥 FUNÇÃO PARA ALTERNAR ENTRE CÂMERAS
function setupCameraToggle() {
    const toggleButton = document.getElementById('toggleCamera');
    if (!toggleButton) {
        console.log('❌ Botão de alternar câmera não encontrado');
        return;
    }

    let currentCamera = 'user';
    let isSwitching = false;

    toggleButton.addEventListener('click', async () => {
        if (isSwitching) return;
        isSwitching = true;
        toggleButton.style.opacity = '0.5';
        toggleButton.style.cursor = 'wait';

        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            currentCamera = currentCamera === 'user' ? 'environment' : 'user';
            
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: currentCamera,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = newStream;
            }

            window.localStream = newStream;

            console.log(`✅ Câmera alterada para: ${currentCamera === 'user' ? 'Frontal' : 'Traseira'}`);

        } catch (error) {
            console.error('❌ Erro ao alternar câmera:', error);
        } finally {
            isSwitching = false;
            toggleButton.style.opacity = '1';
            toggleButton.style.cursor = 'pointer';
        }
    });

    console.log('✅ Botão de alternar câmera configurado');
}

// 🎤 SISTEMA HÍBRIDO TTS AVANÇADO
let primeiraFraseTTS = true;
let navegadorTTSPreparado = false;

// 🎤 FUNÇÃO TTS DO NAVEGADOR (GRÁTIS) - OTIMIZADA
function falarComNavegadorTTS(mensagem, elemento, idioma) {
    return new Promise((resolve) => {
        try {
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(mensagem);
            utterance.lang = idioma;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.9;
            
            utterance.onstart = () => {
                pararSomDigitacao();
                
                if (elemento) {
                    elemento.style.animation = 'none';
                    elemento.style.backgroundColor = '';
                    elemento.style.border = '';
                    elemento.textContent = mensagem;
                }
                
                console.log(`🔊 Áudio Navegador TTS iniciado em ${idioma}`);
            };
            
            utterance.onend = () => {
                console.log('🔚 Áudio Navegador TTS terminado');
                resolve(true);
            };
            
            utterance.onerror = (error) => {
                pararSomDigitacao();
                console.log('❌ Erro no áudio Navegador TTS:', error);
                if (elemento) {
                    elemento.style.animation = 'none';
                    elemento.style.backgroundColor = '';
                    elemento.style.border = '';
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
        const utterance = new SpeechSynthesisUtterance('');
        utterance.lang = idioma;
        utterance.volume = 0;
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
async function falarComGoogleTTS(mensagem, elemento, idioma) {
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
        
        audio.onplay = () => {
            pararSomDigitacao();
            
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
                elemento.textContent = mensagem;
            }
            
            console.log(`🔊 Áudio Google TTS iniciado em ${idioma}`);
        };
        
        audio.onended = () => {
            console.log('🔚 Áudio Google TTS terminado');
        };
        
        audio.onerror = () => {
            pararSomDigitacao();
            console.log('❌ Erro no áudio Google TTS');
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
            }
        };

        await audio.play();
        
    } catch (error) {
        console.error('❌ Erro no Google TTS:', error);
        throw error;
    }
}

// 🎯 FUNÇÃO HÍBRIDA PRINCIPAL - SISTEMA AVANÇADO
async function falarTextoSistemaHibrido(mensagem, elemento, idioma) {
    try {
        console.log(`🎯 TTS Híbrido: "${mensagem.substring(0, 50)}..." em ${idioma}`);
        
        if (primeiraFraseTTS) {
            console.log('🚀 PRIMEIRA FRASE: Usando Google TTS (rápido)');
            
            await falarComGoogleTTS(mensagem, elemento, idioma);
            
            console.log(`🔄 Preparando navegador TTS para ${idioma}...`);
            prepararNavegadorTTS(idioma);
            
            primeiraFraseTTS = false;
            
        } else {
            console.log('💰 PRÓXIMAS FRASES: Usando Navegador TTS (grátis)');
            
            const sucesso = await falarComNavegadorTTS(mensagem, elemento, idioma);
            
            if (!sucesso) {
                console.log('🔄 Fallback: Navegador falhou, usando Google TTS');
                await falarComGoogleTTS(mensagem, elemento, idioma);
            }
        }
        
        console.log('✅ TTS concluído com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no sistema híbrido TTS:', error);
        
        console.log('🔄 Tentando fallback final com navegador TTS...');
        await falarComNavegadorTTS(mensagem, elemento, idioma);
    }
}

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

// ✅ FUNÇÃO PRINCIPAL PARA INICIAR CÂMERA E WEBRTC (MODO RESILIENTE)
async function iniciarCameraAposPermissoes() {
    try {
        console.log('🎥 Tentando iniciar câmera NOTIFICADOR (modo resiliente)...');
        
        // ✅ TENTA a câmera, mas NÃO TRAVA se falhar
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        }).catch(error => {
            console.log('⚠️ Câmera NOTIFICADOR indisponível, continuando sem vídeo...', error);
            return null; // ⬅️ RETORNA NULL EM VEZ DE THROW ERROR
        });

        // ✅ SE CÂMERA FUNCIONOU: Configura normalmente
        if (stream) {
            window.localStream = stream;

            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = stream;
            }

            setupCameraToggle();
            console.log('✅ Câmera NOTIFICADOR iniciada com sucesso');

// 🆕 🆕 🆕 ADICIONAR ESTAS 2 LINHAS AQUI 🆕 🆕 🆕
    window.cameraVigilante = new CameraVigilante();
    window.cameraVigilante.iniciarMonitoramento();
    // 🆕 🆕 🆕 FIM DAS 2 LINHAS 🆕 🆕 🆕
            
        } else {
            // ✅ SE CÂMERA FALHOU: Apenas avisa, mas continua
            console.log('ℹ️ NOTIFICADOR operando em modo áudio/texto (sem câmera)');
            window.localStream = null;
        }

        // ✅✅✅ REMOVE LOADING INDEPENDENTE DA CÂMERA
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        console.log('🌐 Inicializando WebRTC...');
        window.rtcCore = new WebRTCCore();

        // ✅✅✅ MANTÉM TODO O CÓDIGO ORIGINAL DAQUI PARA BAIXO
        const params = new URLSearchParams(window.location.search);
        const myId = window.location.href.split('?')[1]?.split('&')[0] || '';
        const lang = params.get('lang') || 'pt-BR';

        window.targetTranslationLang = lang;

        console.log('🎯 Notificador pronto:', { myId, lang });

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida do caller:', mensagem);

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

        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            // ✅✅✅ REMOVEMOS a verificação "if (!window.localStream) return;"
            // AGORA aceita chamadas mesmo sem câmera!
            
            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu (notificador) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            // ✅✅✅ ENVIA stream local SE disponível, senão null
            const streamParaUsar = window.localStream || null;
            
            window.rtcCore.handleIncomingCall(offer, streamParaUsar, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                    
                    // ✅ FECHA UNBOXING QUANDO WEBRTC CONECTAR
                    const instructionBox = document.getElementById('instructionBox');
                    if (instructionBox) {
                        instructionBox.classList.remove('expandido');
                        instructionBox.classList.add('recolhido');
                        console.log('📦 Unboxing fechado automaticamente - WebRTC conectado');
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

        aplicarBandeiraLocal(lang);

        // ✅ CORREÇÃO: Chama o tradutor CORRETAMENTE
        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            } else {
                console.log('⚠️ initializeTranslator não encontrado, carregando notificador-trz.js...');
                // O tradutor será carregado via script tag no HTML
            }
        }, 1000);

    } catch (error) {
        // ✅✅✅ EM CASO DE ERRO: Remove loading E continua
        console.error("❌ Erro não crítico na câmera NOTIFICADOR:", error);
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        // ✅ NÃO FAZ throw error! Apenas retorna normalmente
        console.log('🟡 NOTIFICADOR continua funcionando (áudio/texto)');
    }
}

// 🚀 INICIALIZAÇÃO PRINCIPAL
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação notificador automaticamente...');
        
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        // ✅✅✅ PRIMEIRO: Aplica bandeira e GUARDA o idioma
        await aplicarBandeiraLocal(lang);

        // ✅✅✅ DEPOIS: Traduz frases com o idioma JÁ GUARDADO  
        await traduzirFrasesFixas();
        
        iniciarAudio();
        
        await carregarSomDigitacao();
        
        await solicitarTodasPermissoes();
        
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        }
        
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Notificador iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar notificador:', error);
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};

// ✅ CONFIGURAÇÃO DO DOM
document.addEventListener('DOMContentLoaded', function() {
    setupInstructionToggle();
});
