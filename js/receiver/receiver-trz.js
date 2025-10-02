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
        console.log('❌ Navegador não suporta reconhecimento de voz');
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ Navegador não suporta síntese de voz');
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
            
            // ✅ CORREÇÃO: Processo totalmente silencioso
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    // ✅ Traduz e envia SEM MOSTRAR o processo
                    translateText(finalTranscript).then(translation => {
                        enviarParaOutroCelular(translation); // Envia silenciosamente
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
            if (event.error === 'not-allowed') {
                alert('Permissão do microfone negada. Por favor, permita o acesso ao microfone para usar esta função.');
            }
            stopRecording();
        };
        
        recognition.onend = function() {
            if (isRecording) {
                stopRecording();
            }
        };
    }
    
    // ✅ FUNÇÃO DE PERMISSÃO DO MICROFONE (SÓ NO PRIMEIRO CLIQUE)
    async function solicitarPermissaoMicrofonePrimeiraVez() {
        try {
            console.log('🎤 Solicitando permissão do microfone pela primeira vez...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            console.log('✅ Permissão do microfone concedida!');
            microphonePermissionGranted = true;
            
            // Para o stream imediatamente - só precisávamos da permissão
            stream.getTracks().forEach(track => track.stop());
            
            // Agora configura os eventos de reconhecimento
            setupRecognitionEvents();
            
            return true;
            
        } catch (error) {
            console.error('❌ Erro na permissão do microfone:', error);
            microphonePermissionGranted = false;
            
            // Mostra alerta amigável para o usuário
            if (error.name === 'NotAllowedError') {
                alert('Para usar o tradutor de voz, por favor permita o acesso ao microfone quando solicitado.');
            }
            
            throw error;
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
            // ✅ CORREÇÃO: Lê apenas o texto recebido
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
            // Atualizar idioma dinamicamente
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
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (isTranslating) return;
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    tapMode = false;
                    
                    // ✅ SOLICITA PERMISSÃO SÓ NO PRIMEIRO CLIQUE
                    if (!microphonePermissionGranted) {
                        solicitarPermissaoMicrofonePrimeiraVez()
                            .then(() => {
                                startRecording();
                                showRecordingModal();
                            })
                            .catch(error => {
                                console.error('Não foi possível acessar o microfone:', error);
                            });
                    } else {
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
            } else {
                if (!isTranslating) {
                    tapMode = true;
                    
                    // ✅ SOLICITA PERMISSÃO SÓ NO PRIMEIRO CLIQUE
                    if (!microphonePermissionGranted) {
                        solicitarPermissaoMicrofonePrimeiraVez()
                            .then(() => {
                                startRecording();
                                showRecordingModal();
                            })
                            .catch(error => {
                                console.error('Não foi possível acessar o microfone:', error);
                            });
                    } else {
                        startRecording();
                        showRecordingModal();
                    }
                }
            }
        });
        
        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (isTranslating) return;
            
            if (isRecording) {
                stopRecording();
            } else {
                // ✅ SOLICITA PERMISSÃO SÓ NO PRIMEIRO CLIQUE
                if (!microphonePermissionGranted) {
                    solicitarPermissaoMicrofonePrimeiraVez()
                        .then(() => {
                            startRecording();
                            showRecordingModal();
                        })
                        .catch(error => {
                            console.error('Não foi possível acessar o microfone:', error);
                        });
                } else {
                    startRecording();
                    showRecordingModal();
                }
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', stopRecording);
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', toggleSpeech);
    }
    
    console.log('✅ Tradutor Receiver configurado (aguardando primeiro clique no microfone)');
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando aplicação...');
    
    // ⏳ ATRASO para o tradutor - aguarda o WebRTC inicializar
    setTimeout(initializeTranslator, 2000);
});
