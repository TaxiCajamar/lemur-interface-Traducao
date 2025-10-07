// ===== TRADUTOR OTIMIZADO - VISUAL COMPLETO + NÚCLEO SIMPLES =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor notificador...');

    // 🎯 IDIOMAS JÁ DEFINIDOS (das bandeiras)
    const IDIOMA_ORIGEM = window.sourceTranslationLang || navigator.language || 'pt-BR';
    const IDIOMA_DESTINO = window.targetTranslationLang || 'en';
    
    console.log('🔤 Idiomas configurados:', { origem: IDIOMA_ORIGEM, destino: IDIOMA_DESTINO });

    // 🎤 ELEMENTOS VISUAIS (MANTIDOS)
    const recordButton = document.getElementById('recordButton');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');
    
    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🎙️ CONFIGURAÇÃO DE VOZ
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
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = true;

    // ⏱️ SISTEMA DE TIMER (MANTIDO)
    let recordingStartTime = 0;
    let timerInterval = null;
    
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

    // 🎙️ CONTROLES DE GRAVAÇÃO (MANTIDOS)
    let isRecording = false;
    let isTranslating = false;
    let pressTimer;

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
        console.log('⏹️ Parando gravação');
    }

    // 🎯 NÚCLEO SIMPLIFICADO DE TRADUÇÃO
    async function traduzirEFalar(texto) {
        if (isTranslating) return;
        
        isTranslating = true;
        console.log('🔄 Traduzindo texto:', texto.substring(0, 50));

        try {
            // 1. TRADUZ TEXTO (SIMPLIFICADO)
            const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: texto,
                    sourceLang: IDIOMA_ORIGEM,
                    targetLang: IDIOMA_DESTINO
                })
            });

            const result = await response.json();
            const textoTraduzido = result.translatedText || texto;

            // 2. ENVIA PARA OUTRO USUÁRIO (SIMPLIFICADO)
            if (window.rtcDataChannel && window.rtcDataChannel.readyState === 'open') {
                window.rtcDataChannel.send(textoTraduzido);
                console.log('✅ Texto traduzido e enviado:', textoTraduzido);
            } else {
                console.log('⏳ Canal não disponível, tentando novamente...');
                // Tenta enviar novamente em 1 segundo
                setTimeout(() => {
                    if (window.rtcDataChannel && window.rtcDataChannel.readyState === 'open') {
                        window.rtcDataChannel.send(textoTraduzido);
                    }
                }, 1000);
            }

        } catch (error) {
            console.error('❌ Erro na tradução:', error);
        } finally {
            isTranslating = false;
        }
    }

    // 🔊 SISTEMA DE Voz (MANTIDO)
    let isSpeechPlaying = false;

    function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_DESTINO;
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

    // 🎙️ EVENTOS DE RECONHECIMENTO (MANTIDOS)
    recognition.onresult = function(event) {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            console.log('📝 Texto reconhecido:', finalTranscript);
            traduzirEFalar(finalTranscript);
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

    // 🎮 EVENTOS DE BOTÃO (MANTIDOS - VISUAL COMPLETO)
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || isTranslating) return;
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    startRecording();
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
                    startRecording();
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
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', stopRecording);
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', toggleSpeech);
    }

    // ✅ MICROFONE JÁ AUTORIZADO (pelas permissões principais)
    recordButton.disabled = false;
    console.log('✅ Tradutor notificador pronto!');
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando tradutor notificador...');
    setTimeout(initializeTranslator, 2000);
});
