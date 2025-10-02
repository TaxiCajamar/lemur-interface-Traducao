import { WebRTCCore } from '../../core/webrtc-core.js';
import { QRCodeGenerator } from '../qrcode/qr-code-utils.js';

// 🎵 VARIÁVEIS DE ÁUDIO (mantidas do seu código original)
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

// ==== TRADUTOR SIMPLES INTEGRADO ====
let recognition = null;
let isRecording = false;
let isTranslating = false;

// 🎤 INICIALIZAR TRADUTOR DE VOZ
function initializeVoiceTranslator() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.log('❌ Reconhecimento de voz não suportado');
        document.getElementById('recordButton').style.display = 'none';
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'pt-BR';

    // 🎯 CONFIGURAR EVENTOS DE VOZ
    recognition.onresult = async (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }

        if (finalTranscript && !isTranslating) {
            isTranslating = true;
            console.log('🎤 Texto capturado:', finalTranscript);
            
            try {
                // 🔄 TRADUZIR TEXTO
                const translatedText = await translateText(finalTranscript, window.targetTranslationLang || 'en');
                console.log('🌐 Texto traduzido:', translatedText);
                
                // 📤 ENVIAR PARA OUTRO CELULAR
                enviarParaOutroCelular(translatedText);
                
            } catch (error) {
                console.error('❌ Erro na tradução:', error);
            } finally {
                isTranslating = false;
            }
        }
    };

    recognition.onerror = (event) => {
        console.log('❌ Erro no reconhecimento:', event.error);
        stopRecording();
    };

    recognition.onend = () => {
        if (isRecording) {
            stopRecording();
        }
    };

    console.log('✅ Tradutor de voz inicializado');
}

// 🎤 INICIAR GRAVAÇÃO
function startRecording() {
    if (isRecording || isTranslating || !recognition) return;
    
    try {
        recognition.start();
        isRecording = true;
        
        const recordButton = document.getElementById('recordButton');
        if (recordButton) recordButton.classList.add('recording');
        
        const recordingModal = document.getElementById('recordingModal');
        if (recordingModal) recordingModal.classList.add('visible');
        
        console.log('🎤 Gravação iniciada');
        
    } catch (error) {
        console.error('❌ Erro ao iniciar gravação:', error);
        stopRecording();
    }
}

// ⏹️ PARAR GRAVAÇÃO
function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    
    const recordButton = document.getElementById('recordButton');
    if (recordButton) recordButton.classList.remove('recording');
    
    const recordingModal = document.getElementById('recordingModal');
    if (recordingModal) recordingModal.classList.remove('visible');
    
    console.log('⏹️ Gravação parada');
}

// 🔊 FALAR TEXTO RECEBIDO
function speakText(text) {
    if (!window.speechSynthesis || !text) return;
    
    // Parar qualquer fala anterior
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = window.targetTranslationLang || 'en-US';
    utterance.rate = 0.9;
    utterance.volume = 0.8;
    
    utterance.onstart = () => {
        console.log('🔊 Iniciando fala:', text);
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '⏹';
    };
    
    utterance.onend = () => {
        console.log('🔊 Fala concluída');
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '🔊';
    };
    
    utterance.onerror = () => {
        console.log('❌ Erro na fala');
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '🔊';
    };
    
    window.speechSynthesis.speak(utterance);
}

// 🔄 ALTERNAR FALA (botão 🔊)
function toggleSpeech() {
    if (!window.speechSynthesis) return;
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        const speakerButton = document.getElementById('speakerButton');
        if (speakerButton) speakerButton.textContent = '🔊';
    } else {
        const textoRecebido = document.getElementById('texto-recebido');
        if (textoRecebido && textoRecebido.textContent) {
            speakText(textoRecebido.textContent);
        }
    }
}

// 🌐 FUNÇÃO DE TRADUÇÃO
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

// 📤 FUNÇÃO DE ENVIO
function enviarParaOutroCelular(texto) {
    if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
        window.rtcDataChannel.send(texto);
        console.log('✅ Texto enviado:', texto);
    } else {
        console.log('⏳ Canal não disponível. Tentando novamente...');
        setTimeout(() => enviarParaOutroCelular(texto), 1000);
    }
}

// 🎵 CARREGAR SOM DE DIGITAÇÃO (seu código original)
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

// 🎵 INICIAR LOOP DE DIGITAÇÃO (seu código original)
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

// 🎵 PARAR SOM DE DIGITAÇÃO (seu código original)
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

// 🎵 INICIAR ÁUDIO APÓS INTERAÇÃO DO USUÁRIO (seu código original)
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

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ (seu código original)
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

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO (seu código original)
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

// 🏳️ Aplica bandeira do idioma local (seu código original)
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

// 🏳️ Aplica bandeira do idioma remota (seu código original)
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

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK) (seu código original)
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

// 🎤 FUNÇÃO GOOGLE TTS SEPARADA (seu código original)
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

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
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

        // ✅ CONFIGURA IDIOMA DE TRADUÇÃO
        window.targetTranslationLang = lang;

        const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
        QRCodeGenerator.generate("qrcode", callerUrl);

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ==== CONFIGURAÇÃO DO TRADUTOR INTEGRADO ====
        // Configura callbacks ANTES de inicializar
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            const imagemImpaciente = document.getElementById('lemurFixed');
            
            if (elemento) {
                elemento.textContent = mensagem;
                elemento.style.opacity = '1';
                elemento.style.transition = 'opacity 0.5s ease';
            }

            // 🎤 FALAR AUTOMATICAMENTE AO RECEBER
            speakText(mensagem);

            // 🎵 GOOGLE TTS (opcional - mantém seu código original)
            await falarComGoogleTTS(mensagem, elemento, imagemImpaciente);
        });

        // 🎯 CONFIGURA CHAMADA ENTRANTE
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

        // ✅ INICIALIZA TRADUTOR DE VOZ
        initializeVoiceTranslator();

        // ✅ CONFIGURA BOTÕES
        const recordButton = document.getElementById('recordButton');
        const sendButton = document.getElementById('sendButton');
        const speakerButton = document.getElementById('speakerButton');

        if (recordButton) {
            recordButton.disabled = false;
            recordButton.addEventListener('click', () => {
                if (isRecording) {
                    stopRecording();
                } else {
                    startRecording();
                }
            });
        }

        if (sendButton) {
            sendButton.addEventListener('click', stopRecording);
        }

        if (speakerButton) {
            speakerButton.disabled = false;
            speakerButton.addEventListener('click', toggleSpeech);
        }

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

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        throw error;
    }
}

window.onload = async () => {
    try {
        // ✅ BOTÃO ÚNICO PARA TODAS AS PERMISSÕES
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
                
                // 1. Primeiro: Inicia áudio
                iniciarAudio();
                
                // 2. Segundo: Carrega sons
                await carregarSomDigitacao();
                
                // 3. Terceiro: Solicita TODAS as permissões (câmera + microfone)
                await solicitarTodasPermissoes();
                
                // 4. Quarto: Remove botão
                permissaoButton.remove();
                
                // 5. Quinto: Libera interface (com fallback)
                if (typeof window.liberarInterface === 'function') {
                    window.liberarInterface();
                    console.log('✅ Interface liberada via função global');
                } else {
                    liberarInterfaceFallback();
                    console.log('✅ Interface liberada via fallback');
                }
                
                // 6. Sexto: Inicia câmera e WebRTC
                await iniciarCameraAposPermissoes();
                
                console.log('✅ Fluxo completo concluído com sucesso!');
                
            } catch (error) {
                console.error('❌ Erro no fluxo:', error);
                
                if (typeof window.mostrarErroCarregamento === 'function') {
                    window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
                } else {
                    console.error('❌ Erro no carregamento:', error);
                }
                
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
        console.error("Erro ao inicializar aplicação:", error);
        alert("Erro ao inicializar a aplicação.");
    }
};
