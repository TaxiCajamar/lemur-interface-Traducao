import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 📷 VARIÁVEIS PARA TROCAR CÂMERA
let cameraTraseira = false;
let streamAtual = null;

// 📷 FUNÇÃO PARA TROCAR CÂMERA
async function trocarCamera() {
    try {
        if (streamAtual) {
            streamAtual.getTracks().forEach(track => track.stop());
        }

        cameraTraseira = !cameraTraseira;
        
        const constraints = {
            video: { 
                facingMode: cameraTraseira ? "environment" : "user" 
            },
            audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamAtual = stream;
        
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = stream;

    } catch (error) {
        console.error('Erro ao trocar câmera:', error);
    }
}

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

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
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
        streamAtual = stream;

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
            
            const mobileLoading = document.getElementById('mobileLoading');
            if (mobileLoading) {
                mobileLoading.style.display = 'none';
            }

            setTimeout(() => {
                const elementoClick = document.getElementById('click');
                if (elementoClick) {
                    elementoClick.style.display = 'block';
                    elementoClick.classList.add('piscar-suave');
                }
            }, 500);
        }

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

        window.qrCodeData = {
            myId: myId,
            token: token,
            lang: lang
        };

        document.getElementById('logo-traduz').addEventListener('click', function() {
           
            const elementoClick = document.getElementById('click');
            if (elementoClick) {
                elementoClick.style.display = 'none';
            }
            
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo && remoteVideo.srcObject) {
                console.log('❌ WebRTC conectado - Botão bloqueado');
                return;
            }
            
            console.log('🗝️ Gerando QR Code...');
            
            const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
            
            QRCodeGenerator.generate("qrcode", callerUrl);
            
            const overlay = document.querySelector('.info-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
            }
            
            console.log('✅ QR Code gerado!');
        });

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

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
                
                audio.onended = () => {
                    console.log('🔚 Áudio Google TTS terminado');
                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                };
                
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
        
        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        
        await traduzirFrasesFixas(lang);
        
        iniciarAudio();
        
        await carregarSomDigitacao();
        
        await solicitarTodasPermissoes();
        
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
        await iniciarCameraAposPermissoes();
        
        document.getElementById('girar-camera').addEventListener('click', trocarCamera);
        
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
