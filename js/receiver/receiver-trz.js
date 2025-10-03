// ===== VERIFICAÇÃO DE PERMISSÕES =====
function verificarPermissoesMicrofone() {
    if (window.permissoesConcedidas) {
        console.log('✅ Microfone já autorizado anteriormente');
        return Promise.resolve(true);
    } else {
        console.log('⏳ Microfone não autorizado ainda, aguardando...');
        return Promise.reject(new Error('Aguardando permissões do botão principal'));
    }
}

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
    if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
        window.rtcDataChannel.send(texto);
        console.log('✅ Texto enviado:', texto);
    } else {
        console.log('⏳ Canal não disponível ainda. Tentando novamente...');
        setTimeout(() => enviarParaOutroCelular(texto), 1000);
    }
}

async function translateText(text) {
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
        const translatedText = result.translatedText || text;
        return translatedText;
        
    } catch (error) {
        return text;
    }
}

// 🎵 VARIÁVEL PARA CONTROLE DE PERMISSÃO DE ÁUDIO
let audioPermissionGranted = false;

// 🎵 FUNÇÃO PARA SOLICITAR PERMISSÃO DE ÁUDIO
function solicitarPermissaoAudio() {
    return new Promise((resolve) => {
        try {
            if (audioPermissionGranted && window.audioContext) {
                resolve(true);
                return;
            }
            
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = window.audioContext.createOscillator();
            const gainNode = window.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);
            
            gainNode.gain.value = 0.001;
            oscillator.start();
            oscillator.stop(window.audioContext.currentTime + 0.1);
            
            audioPermissionGranted = true;
            window.audioPermissionGranted = true;
            
            console.log('✅ Permissão de áudio concedida!');
            resolve(true);
            
        } catch (error) {
            console.error('❌ Erro ao solicitar permissão de áudio:', error);
            resolve(false);
        }
    });
}

// ===== INICIALIZAÇÃO DO TRADUTOR =====
function initializeTranslator() {
    
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
    
    console.log('🎯 Configuração de tradução:', {
        origem: IDIOMA_ORIGEM,
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA
    });

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
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
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
    let microphonePermissionGranted = false;
    let lastTranslationTime = 0;
    let permissionCheckAttempts = 0;
    const MAX_PERMISSION_CHECKS = 10;
    
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
            
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    translateText(finalTranscript).then(translation => {
                        enviarParaOutroCelular(translation);
                        isTranslating = false;
                    }).catch(error => {
                        console.error('Erro na tradução:', error);
                        isTranslating = false;
                    });
                }
            }
        };
        
        recognition.onerror = function(event) {
            console.log('Erro recognition:', event.error);
            stopRecording();
        };
        
        recognition.onend = function() {
            if (isRecording) {
                stopRecording();
            }
        };
    }
    
    async function requestMicrophonePermission() {
        try {
            if (permissionCheckAttempts >= MAX_PERMISSION_CHECKS) {
                console.log('❌ Tempo esgotado aguardando permissões');
                recordButton.disabled = true;
                return;
            }
            
            permissionCheckAttempts++;
            
            // ✅ TENTATIVA ÚNICA: Solicita microfone E áudio juntos
            try {
                console.log('🎤🎵 Solicitando microfone e áudio juntos...');
                
                // Solicita microfone
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log('✅ Permissão do microfone concedida!');
                
                // Para as tracks imediatamente
                stream.getTracks().forEach(track => track.stop());
                
                // ✅ LIBERA ÁUDIO/MP3 também
                if (!audioPermissionGranted) {
                    await solicitarPermissaoAudio();
                }
                
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                setupRecognitionEvents();
                
                console.log('✅ Microfone + Áudio liberados! Tradutor pronto.');
                return;
                
            } catch (error) {
                console.log('⏳ Aguardando permissões do microfone...', error);
            }
            
            // Fallback: verifica se já tem permissão
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophonePermission = devices.some(device => 
                device.kind === 'audioinput' && device.deviceId !== ''
            );
            
            if (hasMicrophonePermission) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                setupRecognitionEvents();
                
                // ✅ LIBERA ÁUDIO/MP3 também
                if (!audioPermissionGranted) {
                    await solicitarPermissaoAudio();
                }
                
                console.log('✅ Microfone já autorizado + Áudio liberado!');
                return;
            }
            
            console.log(`⏳ Tentando permissões... (${permissionCheckAttempts}/${MAX_PERMISSION_CHECKS})`);
            
            setTimeout(() => {
                requestMicrophonePermission();
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            
            if (permissionCheckAttempts < MAX_PERMISSION_CHECKS) {
                setTimeout(() => {
                    requestMicrophonePermission();
                }, 1000);
            } else {
                recordButton.disabled = true;
            }
        }
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
            
            if (speakerButton) {
                speakerButton.disabled = true;
                speakerButton.textContent = '🔇';
            }
            
        } catch (error) {
            console.error('Erro ao iniciar gravação:', error);
            stopRecording();
        }
    }
    
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        if (recordButton) recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
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
    
    if (recordButton) {
        recordButton.addEventListener('click', async function(e) {
            e.preventDefault();
            
            console.log('🎤 Clique no microfone detectado');
            
            // Se já tem permissões, inicia gravação normalmente
            if (microphonePermissionGranted && audioPermissionGranted) {
                if (isRecording) {
                    stopRecording();
                } else {
                    startRecording();
                    showRecordingModal();
                }
                return;
            }
            
            // ✅ SE NÃO TEM PERMISSÕES: Solicita microfone + áudio
            console.log('🎤🎵 Primeiro clique: solicitando microfone + áudio...');
            
            try {
                // Tenta obter permissão do microfone
                await requestMicrophonePermission();
                
                // Se conseguiu, inicia gravação automaticamente
                if (microphonePermissionGranted && !recordButton.disabled) {
                    console.log('✅ Permissões concedidas! Iniciando gravação...');
                    startRecording();
                    showRecordingModal();
                }
                
            } catch (error) {
                console.error('❌ Erro ao solicitar permissões:', error);
            }
        });
        
        // Mantém os eventos touch para mobile
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || isTranslating) return;
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    if (!isRecording) {
                        startRecording();
                        showRecordingModal();
                    }
                }, 300);
            }
        });
        
        recordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
            
            if (isRecording) {
                stopRecording();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', stopRecording);
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', toggleSpeech);
    }
    
    // Inicia a verificação de permissões
    requestMicrophonePermission();
    
    console.log('✅ Tradutor inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    setTimeout(initializeTranslator, 2000);
});
