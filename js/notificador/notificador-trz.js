// js/notificador/notificador-trz.js - TRADUTOR SIMPLIFICADO

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
    if (window.rtcCore && window.rtcCore.dataChannel && window.rtcCore.dataChannel.readyState === 'open') {
        window.rtcCore.dataChannel.send(texto);
        console.log('✅ Texto enviado:', texto);
        return true;
    } else {
        console.log('⏳ Canal não disponível. Tentando novamente...');
        return false;
    }
}

async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type: 'application/json' },
            body: JSON.stringify({ 
                text: text,
                sourceLang: window.sourceTranslationLang || 'auto',
                targetLang: window.targetTranslationLang || 'en'
            })
        });

        const result = await response.json();
        const translatedText = result.translatedText || text;
        return translatedText;
        
    } catch (error) {
        console.error('Erro na tradução:', error);
        return text;
    }
}

// ===== INICIALIZAÇÃO DO BOTÃO MUNDO =====
function initializeWorldButton() {
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    const worldButton = document.getElementById('worldButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    if (!worldButton || !languageDropdown || !currentLanguageFlag) {
        console.log('⏳ Aguardando elementos do botão mundo...');
        setTimeout(initializeWorldButton, 300);
        return;
    }
    
    console.log('🎯 Inicializando botão mundo (notificação)...');
    
    let IDIOMA_ORIGEM = window.callerLang || navigator.language || 'pt-BR';
    
    async function getBandeiraDoJson(langCode) {
        try {
            const response = await fetch('assets/bandeiras/language-flags.json');
            const flags = await response.json();
            return flags[langCode] || flags[langCode.split('-')[0]] || '🎌';
        } catch (error) {
            console.error('Erro ao carregar bandeiras:', error);
            return '🎌';
        }
    }
    
    // Configurar bandeira inicial
    getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
        currentLanguageFlag.textContent = bandeira;
    });

    // Evento do botão mundo
    worldButton.addEventListener('click', function(e) {
        console.log('🎯 Botão Mundo clicado!');
        e.preventDefault();
        e.stopPropagation();
        languageDropdown.classList.toggle('show');
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!languageDropdown.contains(e.target) && e.target !== worldButton) {
            languageDropdown.classList.remove('show');
        }
    });

    // Eventos das opções de idioma
    languageOptions.forEach(option => {
        option.addEventListener('click', async function() {
            const novoIdioma = this.getAttribute('data-lang');
            IDIOMA_ORIGEM = novoIdioma;
            
            const bandeira = await getBandeiraDoJson(novoIdioma);
            currentLanguageFlag.textContent = bandeira;
            
            languageDropdown.classList.remove('show');
            
            // Atualizar idioma no contexto global para o tradutor
            window.currentSourceLang = novoIdioma;
            
            // Feedback visual
            const translatedText = document.getElementById('translatedText');
            if (translatedText) {
                translatedText.textContent = "✅";
                setTimeout(() => {
                    if (translatedText) translatedText.textContent = "🎤";
                }, 1000);
            }
            
            console.log('🌎 Idioma alterado para:', novoIdioma);
        });
    });
    
    console.log('✅ Botão mundo inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO DO TRADUTOR =====
function initializeTranslator() {
    console.log('🎯 Inicializando tradutor notificação...');
    
    let IDIOMA_ORIGEM = window.currentSourceLang || window.callerLang || navigator.language || 'pt-BR';
    
    function obterIdiomaDestino() {
        return window.targetTranslationLang || 
               new URLSearchParams(window.location.search).get('lang') || 
               'en';
    }

    function obterIdiomaFala() {
        const lang = obterIdiomaDestino();
        if (lang.includes('-')) return lang;
        
        const fallbackMap = {
            'en': 'en-US', 'pt': 'pt-BR', 'es': 'es-ES', 
            'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT'
        };
        
        return fallbackMap[lang] || 'en-US';
    }
    
    const IDIOMA_DESTINO = obterIdiomaDestino();
    const IDIOMA_FALA = obterIdiomaFala();
    
    console.log('🎯 Configuração de tradução (notificação):', {
        origem: IDIOMA_ORIGEM,
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA
    });

    const recordButton = document.getElementById('recordButton');
    const translatedText = document.getElementById('translatedText');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    
    if (!recordButton || !translatedText) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    translatedText.textContent = "🎤";
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        console.log('❌ SpeechRecognition não suportado');
        translatedText.textContent = "❌";
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        speakerButton.style.display = 'none';
    }
    
    let recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;
    
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    
    // ✅✅✅ USA A PERMISSÃO JÁ CONCEDIDA PELO notificador-ui.js
    let microphonePermissionGranted = window.microphonePermissionGranted || false;
    let lastTranslationTime = 0;
    
    function setupRecognitionEvents() {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            
            // ✅ MOSTRA APENAS O ÍCONE
            if (translatedText) {
                translatedText.textContent = "🎤";
            }
            
            // ✅ PROCESSO SILENCIOSO
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    translateText(finalTranscript).then(translation => {
                        // ✅ TENTA ENVIAR ATÉ CONSEGUIR
                        let enviado = enviarParaOutroCelular(translation);
                        let tentativas = 0;
                        
                        while (!enviado && tentativas < 5) {
                            setTimeout(() => {
                                enviado = enviarParaOutroCelular(translation);
                            }, 500);
                            tentativas++;
                        }
                        
                        if (translatedText) {
                            translatedText.textContent = "✅";
                            setTimeout(() => {
                                if (translatedText) translatedText.textContent = "🎤";
                            }, 500);
                        }
                        isTranslating = false;
                    }).catch(error => {
                        console.error('Erro na tradução:', error);
                        if (translatedText) translatedText.textContent = "🎤";
                        isTranslating = false;
                    });
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.log('Erro recognition:', event.error);
            if (event.error !== 'no-speech' && translatedText) {
                translatedText.textContent = "❌";
            }
            stopRecording();
        };
        
        recognition.onend = function() {
            if (isRecording) {
                stopRecording();
            }
        };
    }
    
    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_FALA;
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        
        utterance.onerror = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    function toggleSpeech() {
        if (!SpeechSynthesis) return;
        
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
        } else {
            const textoRecebido = document.getElementById("texto-recebido");
            if (textoRecebido && textoRecebido.textContent) {
                const textToSpeak = textoRecebido.textContent;
                if (textToSpeak && textToSpeak.trim() !== "") {
                    speakText(textToSpeak);
                }
            }
        }
    }
    
    function startRecording() {
        if (isRecording || isTranslating) return;
        
        try {
            const currentLang = window.currentSourceLang || IDIOMA_ORIGEM;
            recognition.lang = currentLang;
            
            recognition.start();
            isRecording = true;
            
            if (recordButton) recordButton.classList.add('recording');
            recordingStartTime = Date.now();
            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
            
            if (translatedText) translatedText.textContent = "🎙️";
            if (speakerButton) {
                speakerButton.disabled = true;
                speakerButton.textContent = '🔇';
            }
            
        } catch (error) {
            console.error('Erro ao iniciar gravação:', error);
            if (translatedText) translatedText.textContent = "❌";
            stopRecording();
        }
    }
    
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        if (recordButton) recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
        
        if (translatedText && !isTranslating) {
            translatedText.textContent = "🎤";
        }
        
        if (speakerButton) {
            speakerButton.disabled = false;
            speakerButton.textContent = '🔊';
        }
    }
    
    function showRecordingModal() {
        if (recordingModal) recordingModal.classList.add('visible');
    }
    
    function hideRecordingModal() {
        if (recordingModal) recordingModal.classList.remove('visible');
    }
    
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        if (recordingTimer) {
            recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (elapsedSeconds >= 30) {
            stopRecording();
        }
    }
    
    // ✅✅✅ SE MICROFONE JÁ FOI CONCEDIDO, ATIVA O BOTÃO
    if (microphonePermissionGranted) {
        console.log('✅ Microfone já concedido - ativando botão');
        recordButton.disabled = false;
        setupRecognitionEvents();
    } else {
        console.log('❌ Microfone não concedido - botão desativado');
        recordButton.disabled = true;
        translatedText.textContent = "🚫";
    }
    
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    tapMode = false;
                    startRecording();
                    showRecordingModal();
                }, 300);
            }
        });
        
        recordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
            
            if (isRecording) {
                stopRecording();
            } else {
                if (microphonePermissionGranted && !isTranslating) {
                    tapMode = true;
                    startRecording();
                    showRecordingModal();
                }
            }
        });
        
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (recordButton.disabled || !microphonePermissionGranted || isTranslating) return;
            
            if (isRecording) {
                stopRecording();
            } else {
                startRecording();
                showRecordingModal();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', stopRecording);
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', toggleSpeech);
        speakerButton.disabled = false;
    }
    
    console.log('✅ Tradutor (notificação) inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando tradutor notificação...');
    initializeWorldButton();
    setTimeout(initializeTranslator, 1000);
});
