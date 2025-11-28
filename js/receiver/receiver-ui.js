
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

import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';
import { CameraVigilante } from '../../core/camera-vigilante.js';
import { ttsHibrido } from '../../core/tts-hibrido.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let permissaoConcedida = false;

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
        const response = await fetch('https://chat-tradutor-7umw.onrender.com/translate', {
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

        // ✅✅✅ SOLUÇÃO INTELIGENTE: Guardar o idioma original
        window.meuIdiomaLocal = langCode;
        console.log('💾 Idioma local guardado:', window.meuIdiomaLocal);

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

// 🌐 TRADUÇÃO DAS FRASES FIXAS (AGORA SEPARADA)
async function traduzirFrasesFixas() {
  try {
    // ✅✅✅ AGORA USA O IDIOMA GUARDADO!
    const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
    
    console.log(`🌐 Traduzindo frases fixas para: ${idiomaExato}`);

    const frasesParaTraduzir = {
        "qr-modal-title": "This is your online key",
      "qr-modal-description": "You can ask to scan, share or print on your business card.",
      "translator-label": "Real-time translation.",      // ⬅️ PRIMEIRO ELEMENTO
  "translator-label-2": "Real-time translation.",   // ⬅️ SEGUNDO ELEMENTO (NOVO)
       "welcome-text": "Welcome! Let's begin.",
    "tap-qr": "Tap the QR code to start.",
  "quick-scan": "Ask to scan the QR.",
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

// 🎥 FUNÇÃO PARA INICIAR CÂMERA E WEBRTC (AGORA COM CameraVigilante)
async function iniciarCameraAposPermissoes() {
    try {
        console.log('🎥 Iniciando sistema de câmera com CameraVigilante...');
        
        // ✅ 1. INICIA CameraVigilante (SUBSTITUI TODO O CÓDIGO DE CÂMERA ANTIGO)
        window.cameraVigilante = new CameraVigilante();
        await window.cameraVigilante.inicializarSistema();
        
        // ✅ 2. REMOVE LOADING (MESMO CÓDIGO DO ORIGINAL)
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }

        // ✅ 3. MOSTRA BOTÃO CLICK (MESMO CÓDIGO DO ORIGINAL)
        setTimeout(() => {
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.style.display = 'block';
                elementoClick.classList.add('piscar-suave');
                console.log('🟡 Botão click ativado (com/sem câmera)');
            }
        }, 500);

        // ✅ 4. CONFIGURAÇÃO WEBRTC (MESMO CÓDIGO DO ORIGINAL)
        window.rtcCore = new WebRTCCore();

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const targetIdFromUrl = params.get('targetId') || '';
        const myId = targetIdFromUrl || crypto.randomUUID().substr(0, 8);
        const lang = params.get('lang') || navigator.language || 'pt-BR';

        window.targetTranslationLang = lang;

        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        // ✅ 5. CONFIGURA BOTÃO QR CODE (MESMO CÓDIGO DO ORIGINAL)
        document.getElementById('logo-traduz').addEventListener('click', function() {
            const overlay = document.querySelector('.info-overlay');
            const qrcodeContainer = document.getElementById('qrcode');
            
            if (overlay && !overlay.classList.contains('hidden')) {
                overlay.classList.add('hidden');
                console.log('📱 QR Code fechado pelo usuário');
                return;
            }
            
            const remoteVideo = document.getElementById('remoteVideo');
            const isConnected = remoteVideo && remoteVideo.srcObject;
            
            if (isConnected) {
                console.log('❌ WebRTC já conectado - QR Code não pode ser reaberto');
                return;
            }
            
            console.log('🗝️ Gerando/Reabrindo QR Code e Link...');
            
            if (qrcodeContainer) {
                qrcodeContainer.innerHTML = '';
            }
            
            const callerUrl = `${window.location.origin}/caller-selector.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
            
            QRCodeGenerator.generate("qrcode", callerUrl);
            
            const btnCopiar = document.getElementById('copiarLink');
            if (btnCopiar) {
                btnCopiar.onclick = function() {
                    navigator.clipboard.writeText(callerUrl).then(() => {
                        btnCopiar.textContent = '✅';
                        btnCopiar.classList.add('copiado');
                        console.log('🔗 Link copiado para área de transferência');
                        
                        setTimeout(() => {
                            btnCopiar.textContent = '🔗';
                            btnCopiar.classList.remove('copiado');
                        }, 2000);
                    }).catch(err => {
                        console.log('❌ Erro ao copiar link:', err);
                        const textArea = document.createElement('textarea');
                        textArea.value = callerUrl;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        
                        btnCopiar.textContent = '✅';
                        setTimeout(() => {
                            btnCopiar.textContent = '🔗';
                        }, 2000);
                    });
                };
            }
            
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            
            console.log('✅ QR Code e Link gerados/reativados!');
        });

        // Fechar QR Code ao clicar fora (MESMO CÓDIGO DO ORIGINAL)
        document.querySelector('.info-overlay').addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.add('hidden');
                console.log('📱 QR Code fechado (clique fora)');
            }
        });

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ 6. CONFIGURA CALLBACK PARA MENSAGENS (AGORA COM TTS HÍBRIDO)
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            ttsHibrido.iniciarSomDigitacao();

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

            const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
            
            console.log(`🎯 TTS Receiver: Idioma guardado = ${idiomaExato}`);
            
            await ttsHibrido.falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idiomaExato);
        });

        // ✅ 7. CONFIGURA HANDLER DE CHAMADAS (MESMO CÓDIGO DO ORIGINAL)
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            console.log('📞 Chamada recebida - Com/Sem câmera');

            console.log('🎯 Caller fala:', idiomaDoCaller);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            window.rtcCore.handleIncomingCall(offer, window.localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                    
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

        // ✅ 8. INICIA OBSERVADOR (MESMO CÓDIGO DO ORIGINAL)
        esconderClickQuandoConectar();

        console.log('✅ Sistema de câmera e WebRTC inicializado com sucesso!');

    } catch (error) {
        console.error("❌ Erro não crítico na inicialização:", error);
        
        // ✅ MESMO TRATAMENTO DE ERRO DO ORIGINAL
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        console.log('🟡 Sistema continua funcionando (áudio/texto)');
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA (MESMO CÓDIGO DO ORIGINAL)
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação receiver automaticamente...');
        
        // 1. Obtém o idioma para tradução
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        // ✅✅✅ PRIMEIRO: Aplica bandeira e GUARDA o idioma
        await aplicarBandeiraLocal(lang);

        // ✅✅✅ DEPOIS: Traduz frases com o idioma JÁ GUARDADO  
        await traduzirFrasesFixas();
        
        // 3. Inicia áudio
        iniciarAudio();
        
        // 4. Carrega sons da máquina de escrever (AGORA NO TTS HÍBRIDO)
        await ttsHibrido.carregarSomDigitacao();
        
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
        
        // 7. Inicia câmera e WebRTC (AGORA COM CameraVigilante)
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
