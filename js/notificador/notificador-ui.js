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

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        console.error('Erro ao carregar bandeira remota:', error);
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

// ✅ FUNÇÃO PARA LIBERAR INTERFACE
function liberarInterfaceFallback() {
    console.log('🔓 Liberando interface...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log('✅ Interface liberada');
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS
async function traduzirFrasesFixas(lang) {
  try {
    const frasesParaTraduzir = {
      "translator-label": "Real-time translation.",
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

    aplicarBandeiraLocal(lang);
  } catch (error) {
    console.error("❌ Erro ao traduzir frases fixas:", error);
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

            // Atualiza o vídeo local
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

// ✅ CONFIGURAÇÃO SEGURA DO CLIQUE NO LOGO
function setupLogoTradutor() {
    const logoTradutor = document.getElementById('logo-traduz');
    if (!logoTradutor) {
        console.log('❌ Elemento logo-traduz não encontrado');
        return;
    }

    logoTradutor.addEventListener('click', function() {
        console.log('🎯 Logo clicado - Sessão ativa');
        
        const remoteVideo = document.getElementById('remoteVideo');
        const isConnected = remoteVideo && remoteVideo.srcObject;
        
        if (isConnected) {
            alert('✅ Chamada ativa!\nVocê já está conectado com outra pessoa.');
            return;
        }
        
        // Pega as informações atualizadas da sessão
        const myId = window.currentSessionId || 'Não disponível';
        const lang = window.targetTranslationLang || 'pt-BR';
        
        alert(`Sessão Ativa!\nID: ${myId}\nIdioma: ${lang}\n\nOutra pessoa pode se conectar com você usando este ID.`);
    });

    console.log('✅ Clique no logo configurado com sucesso');
}

// ✅ FUNÇÃO PARA ESCONDER O BOTÃO CLICK QUANDO WEBRTC CONECTAR
function esconderClickQuandoConectar() {
    const elementoClick = document.getElementById('click');
    const remoteVideo = document.getElementById('remoteVideo');
    
    if (!elementoClick || !remoteVideo) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'srcObject') {
                if (remoteVideo.srcObject) {
                    elementoClick.style.display = 'none';
                    elementoClick.classList.remove('piscar-suave');
                    console.log('🔗 WebRTC conectado - botão Click removido');
                    observer.disconnect();
                }
            }
        });
    });
    
    observer.observe(remoteVideo, {
        attributes: true,
        attributeFilter: ['srcObject']
    });
}

// 🎤 FUNÇÃO GOOGLE TTS
async function falarComGoogleTTS(mensagem, elemento, imagemImpaciente) {
    try {
        console.log('🎤 Iniciando Google TTS...');
        
        const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: window.targetTranslationLang || 'pt-BR',
                gender: 'FEMALE'
            })
        });

        if (!resposta.ok) throw new Error('Erro na API de voz');

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
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
        };
        
        audio.onended = () => {
            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'none';
            }
        };
        
        audio.onerror = () => {
            pararSomDigitacao();
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
    }
}

// ✅ FUNÇÃO PRINCIPAL PARA INICIAR CÂMERA E WEBRTC
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        console.log('📹 Iniciando câmera para notificador...');
        
        // 1. Inicia a câmera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        window.localStream = stream;

        // 2. Configura o vídeo local
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
            
            // Remove loading
            const mobileLoading = document.getElementById('mobileLoading');
            if (mobileLoading) {
                mobileLoading.style.display = 'none';
            }

            // Mostra botão click após delay
            setTimeout(() => {
                const elementoClick = document.getElementById('click');
                if (elementoClick) {
                    elementoClick.style.display = 'block';
                    elementoClick.classList.add('piscar-suave');
                }
            }, 500);
        }

        // 3. Configura toggle da câmera
        setupCameraToggle();

        // 4. Configura WebRTC
        console.log('🌐 Inicializando WebRTC...');
        window.rtcCore = new WebRTCCore();

        // Obtém ID da sessão
        const url = window.location.href;
        const urlParts = url.split('?');
        const queryParams = urlParts[1] ? urlParts[1].split('&') : [];

        const myId = queryParams[0] && !queryParams[0].includes('=') 
            ? queryParams[0] 
            : crypto.randomUUID().substr(0, 8);

        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        // Armazena informações globalmente
        window.currentSessionId = myId;
        window.targetTranslationLang = lang;

        console.log('🚀 Sessão Notificador Iniciada:', { id: myId, lang: lang });

        // 5. ✅ CONFIGURA O CLIQUE NO LOGO APÓS TUDO ESTAR PRONTO
        setupLogoTradutor();

        // 6. Inicializa WebRTC
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // 7. Configura callbacks do WebRTC
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            console.log('📩 Mensagem recebida via WebRTC:', mensagem);
            iniciarSomDigitacao();

            const elemento = document.getElementById('texto-recebido');
            const imagemImpaciente = document.getElementById('lemurFixed');
            
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
                elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elemento.style.border = '2px solid #ff0000';
            }

            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'block';
            }

            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente);
        });

        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!window.localStream) return;

            console.log('📞 Chamada recebida de:', idiomaDoCaller);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                // Desabilita áudio remoto
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                // Remove overlay se existir
                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                // Configura vídeo remoto
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                    
                    // Esconde botão click
                    const elementoClick = document.getElementById('click');
                    if (elementoClick) {
                        elementoClick.style.display = 'none';
                        elementoClick.classList.remove('piscar-suave');
                    }
                }

                window.targetTranslationLang = idiomaDoCaller || lang;

                // Atualiza bandeira remota
                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                }
            });
        };

        // 8. Configura observador para esconder click quando conectar
        esconderClickQuandoConectar();

        console.log('✅ Notificador completamente inicializado');

    } catch (error) {
        console.error("❌ Erro ao iniciar câmera no notificador:", error);
        
        // Remove loading mesmo em caso de erro
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        throw error;
    }
}

// 🚀 INICIALIZAÇÃO PRINCIPAL - ORDEM CORRIGIDA
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação notificador...');
        
        // ✅ FASE 1: CONFIGURAÇÃO BÁSICA DO DOM
        setupInstructionToggle();
        
        // ✅ FASE 2: TRADUÇÕES E IDIOMA
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        await traduzirFrasesFixas(lang);
        
        // ✅ FASE 3: ÁUDIO (APENAS PREPARAÇÃO)
        iniciarAudio();
        await carregarSomDigitacao();
        
        // ✅ FASE 4: PERMISSÕES
        await solicitarTodasPermissoes();
        
        // ✅ FASE 5: INTERFACE VISUAL
        liberarInterfaceFallback();
        
        // ✅ FASE 6: CÂMERA E WEBRTC (TUDO JÁ ESTÁ PRONTO)
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Notificador iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro crítico ao inicializar notificador:', error);
        
        // Fallback: pelo menos libera a interface
        liberarInterfaceFallback();
        
        alert('Erro ao inicializar: ' + error.message);
    }
};

// ✅ GARANTIA EXTRA: Configura toggle quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - configurando elementos...');
    setupInstructionToggle();
});
