// ===== TRADUTOR UNIVERSAL - USADO POR CALLER, RECEIVER E NOTIFICADOR =====

// 🌐 FUNÇÃO DE TRADUÇÃO CENTRALIZADA
window.translateText = async function(text) {
    try {
        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                sourceLang: window.sourceTranslationLang || 'auto',
                targetLang: window.targetTranslationLang || 'en'
            })
        });

        const result = await response.json();
        return result.translatedText || text;
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        return text;
    }
};

// 🎙️ INICIALIZADOR DO TRADUTOR UNIVERSAL
window.initializeUniversalTranslator = function(customConfig = {}) {
    console.log('🎯 Iniciando tradutor universal...');

    // 🎯 CONFIGURAÇÃO PADRÃO
    const config = {
        IDIOMA_ORIGEM: navigator.language || 'pt-BR',
        IDIOMA_FALA: window.targetTranslationLang || 'en-US',
        recordButtonId: 'recordButton',
        recordingModalId: 'recordingModal', 
        recordingTimerId: 'recordingTimer',
        sendButtonId: 'sendButton',
        speakerButtonId: 'speakerButton',
        textoRecebidoId: 'texto-recebido',
        ...customConfig
    };

    console.log('🔤 Configuração do tradutor:', config);

    // 🎤 ELEMENTOS VISUAIS
    const recordButton = document.getElementById(config.recordButtonId);
    const recordingModal = document.getElementById(config.recordingModalId);
    const recordingTimer = document.getElementById(config.recordingTimerId);
    const sendButton = document.getElementById(config.sendButtonId);
    const speakerButton = document.getElementById(config.speakerButtonId);
    const textoRecebido = document.getElementById(config.textoRecebidoId);
    
    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(() => window.initializeUniversalTranslator(customConfig), 300);
        return;
    }

    // 🎙️ VERIFICAÇÃO DE SUPORTE
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        speakerButton.style.display = 'none';
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = config.IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;

    // ⏱️ VARIÁVEIS DE ESTADO
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let lastTranslationTime = 0;

    // ⏱️ SISTEMA DE TIMER
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

    // 🎙️ CONTROLES DE GRAVAÇÃO
    function showRecordingModal() {
        if (recordingModal) recordingModal.classList.add('visible');
        recordingStartTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function hideRecordingModal() {
        if (recordingModal) recordingModal.classList.remove('visible');
        clearInterval(timerInterval);
    }

    function startRecording() {
        if (isRecording || isTranslating) return;
        
        try {
            recognition.start();
            isRecording = true;
            
            recordButton.classList.add('recording');
            showRecordingModal();
            
            if (speakerButton) {
                speakerButton.disabled = true;
            }
            
            console.log('🎙️ Iniciando gravação...');
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            stopRecording();
        }
    }

    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        recognition.stop();
        
        recordButton.classList.remove('recording');
        hideRecordingModal();
        
        if (speakerButton) {
            speakerButton.disabled = false;
        }
        
        console.log('⏹️ Parando gravação');
    }

    // 🔊 SISTEMA DE VOZ
    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = config.IDIOMA_FALA;
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
            if (textoRecebido && textoRecebido.textContent) {
                const textToSpeak = textoRecebido.textContent;
                if (textToSpeak && textToSpeak.trim() !== "") {
                    speakText(textToSpeak);
                }
            }
        }
    }

    // 🎙️ EVENTOS DE RECONHECIMENTO
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
        
        if (finalTranscript && !isTranslating) {
            const now = Date.now();
            if (now - lastTranslationTime > 1000) {
                lastTranslationTime = now;
                isTranslating = true;
                
                window.translateText(finalTranscript).then(translation => {
                    if (window.enviarMensagemTraduzida) {
                        window.enviarMensagemTraduzida(translation);
                    } else if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
                        window.rtcDataChannel.send(translation);
                    }
                    isTranslating = false;
                }).catch(error => {
                    console.error('Erro na tradução:', error);
                    isTranslating = false;
                });
            }
        }
    };
    
    recognition.onerror = function(event) {
        console.log('❌ Erro recognition:', event.error);
        stopRecording();
    };
    
    recognition.onend = function() {
        if (isRecording) {
            stopRecording();
        }
    };

    // 🎮 EVENTOS DE BOTÃO
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || isTranslating) return;
            
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
                if (!isTranslating) {
                    tapMode = true;
                    startRecording();
                    showRecordingModal();
                }
            }
        });
        
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (recordButton.disabled || isTranslating) return;
            
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
    }

    recordButton.disabled = false;
    console.log('✅ Tradutor universal inicializado!');
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Tradutor universal carregado');
});
