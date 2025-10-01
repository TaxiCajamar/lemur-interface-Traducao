import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;

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
    
    // Para qualquer som anterior
    pararSomDigitacao();
    
    try {
        // Configura o loop
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

// 🎵 TENTAR INICIAR ÁUDIO QUANDO O USUÁRIO CLICA NA AUTORIZAÇÃO DA CÂMERA
function tentarIniciarAudioComCamera() {
    // Espera um pouco para o navegador mostrar o popup de câmera
    setTimeout(() => {
        try {
            // Tenta iniciar o áudio silenciosamente
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            gainNode.gain.value = 0.001; // Quase silencioso
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            
            console.log('🎵 Tentativa de áudio durante autorização de câmera');
            
            // Tenta carregar o som também
            carregarSomDigitacao();
            
        } catch (error) {
            console.log('❌ Não foi possível iniciar áudio com a câmera');
        }
    }, 1000); // Espera 1 segundo após o clique
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

window.onload = async () => {
    try {
        // ✅ TENTA DETECTAR QUANDO O USUÁRIO CLICA NA AUTORIZAÇÃO DA CÂMERA
        let usuarioClicouNaCamera = false;
        
        // Monitora cliques na página ANTES da câmera
        document.addEventListener('click', function() {
            if (!usuarioClicouNaCamera) {
                console.log('🎯 Usuário clicou - tentando iniciar áudio...');
                usuarioClicouNaCamera = true;
                tentarIniciarAudioComCamera();
            }
        });

        // ✅ BOTÃO DE FALLBACK (aparece só se a tentativa acima falhar)
        function mostrarBotaoAudio() {
            const audioButton = document.createElement('button');
            audioButton.textContent = '🎵 ATIVAR SONS DA TRADUÇÃO';
            audioButton.style.position = 'fixed';
            audioButton.style.top = '50%';
            audioButton.style.left = '50%';
            audioButton.style.transform = 'translate(-50%, -50%)';
            audioButton.style.zIndex = '10000';
            audioButton.style.padding = '20px 30px';
            audioButton.style.background = '#007bff';
            audioButton.style.color = 'white';
            audioButton.style.border = 'none';
            audioButton.style.borderRadius = '15px';
            audioButton.style.cursor = 'pointer';
            audioButton.style.fontSize = '18px';
            audioButton.style.fontWeight = 'bold';
            audioButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            
            audioButton.onclick = async () => {
                // Inicia o áudio
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                await carregarSomDigitacao();
                audioButton.remove();
                console.log('🎵 Áudio ativado via botão');
            };
            
            document.body.appendChild(audioButton);
            return audioButton;
        }

        // ✅ INICIA A CÂMERA DIRETO (tentativa automática primeiro)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        // ✅ AGORA MOSTRA BOTÃO SE PRECISAR (após 2 segundos)
        let botãoAudio = null;
        setTimeout(() => {
            if (!audioCarregado) {
                console.log('🔇 Mostrando botão de áudio (tentativa automática falhou)');
                botãoAudio = mostrarBotaoAudio();
            }
        }, 2000);

        // ✅ FUNÇÃO PARA INICIAR CÂMERA
        function iniciarCamera(stream) {
            // ✅ Captura da câmera local
            let localStream = stream;

            // ✅ Exibe vídeo local no PiP azul
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = localStream;
            }

            // ✅ Inicializa WebRTC
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

            const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
            QRCodeGenerator.generate("qrcode", callerUrl);

            window.rtcCore.initialize(myId);
            window.rtcCore.setupSocketHandlers();

            // ✅ CALLBACK COM CONTROLE DE SOM
            window.rtcCore.setDataChannelCallback((mensagem) => {
                // 🎵 INICIA SOM DE DIGITAÇÃO (LOOP) - se áudio estiver carregado
                if (audioCarregado) {
                    iniciarSomDigitacao();
                }

                console.log('📩 Mensagem recebida:', mensagem);

                const elemento = document.getElementById('texto-recebido');
                const imagemImpaciente = document.getElementById('lemurFixed');
                
                if (elemento) {
                    elemento.textContent = "";
                    elemento.style.opacity = '1';
                    elemento.style.transition = 'opacity 0.5s ease';
                    
                    elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                    elemento.style.backgroundColor = 'rgb(255, 255, 255)';
                    elemento.style.border = '2px solid #ff0000';
                }

                if (imagemImpaciente) {
                    imagemImpaciente.style.display = 'block';
                }

                if (window.SpeechSynthesis) {
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(mensagem);
                    utterance.lang = window.targetTranslationLang || 'pt-BR';
                    utterance.rate = 0.9;
                    utterance.volume = 0.8;

                    utterance.onstart = () => {
                        // 🎵 PARA SOM DE DIGITAÇÃO QUANDO A VOZ COMEÇA
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

                    utterance.onend = () => {
                        console.log('🔚 Voz terminada');
                        if (imagemImpaciente) {
                            imagemImpaciente.style.display = 'none';
                        }
                    };

                    utterance.onerror = () => {
                        // 🎵 PARA SOM EM CASO DE ERRO TAMBÉM
                        pararSomDigitacao();
                        
                        console.log('❌ Erro na voz');
                        if (elemento) {
                            elemento.style.animation = 'none';
                            elemento.style.backgroundColor = '';
                            elemento.style.border = '';
                        }
                        if (imagemImpaciente) {
                            imagemImpaciente.style.display = 'none';
                        }
                    };

                    window.speechSynthesis.speak(utterance);
                }
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

            // ✅ Tradução dos títulos da interface
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
        }

        // INICIA A CÂMERA
        iniciarCamera(stream);

    } catch (error) {
        console.error("Erro ao inicializar:", error);
        alert("Erro ao acessar a câmera. Verifique as permissões.");
        return;
    }
};
