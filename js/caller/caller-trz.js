// ✅ SOLUÇÃO SIMPLIFICADA - MICROFONE APENAS NO CLIQUE
function initializeTranslator() {
    // ===== CONFIGURAÇÃO =====
    let IDIOMA_ORIGEM = navigator.language || 'pt-BR';
    const urlParams = new URLSearchParams(window.location.search);
    const IDIOMA_DESTINO = urlParams.get('lang') || 'en';
    const IDIOMA_FALA = urlParams.get('lang') || 'en-US';
    
    // ===== ELEMENTOS DOM =====
    const recordButton = document.getElementById('recordButton');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    const textoRecebido = document.getElementById('texto-recebido');
    
    // ⭐ VERIFICA SE ELEMENTOS CRÍTICOS EXISTEM
    if (!currentLanguageFlag || !recordButton || !textoRecebido) {
        console.log('Aguardando elementos do DOM...');
        setTimeout(initializeTranslator, 300);
        return;
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

    // ===== FUNÇÃO PARA BUSCAR BANDEIRA DO JSON =====
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

    // ===== CONFIGURAÇÃO INICIAL =====
    getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
        currentLanguageFlag.textContent = bandeira;
    });
    
    // ===== VERIFICAÇÃO DE SUPORTE =====
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
    
    // ===== VARIÁVEIS DE ESTADO =====
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false; // ✅ INICIA SEM PERMISSÃO
    let lastTranslationTime = 0;
    
    // ===== FUNÇÕES PRINCIPAIS =====
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
            stopRecording();
        };
        
        recognition.onend = function() {
            if (isRecording) {
                stopRecording();
            }
        };
    }

    // ✅ FUNÇÃO DE PERMISSÃO DO MICROFONE APENAS NO CLIQUE
    async function requestMicrophonePermissionOnClick() {
        try {
            console.log('🎤 Solicitando permissão de microfone...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // ✅ PARA O STREAM IMEDIATAMENTE (só precisamos da permissão)
            setTimeout(() => {
                stream.getTracks().forEach(track => track.stop());
            }, 100);
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            setupRecognitionEvents();
            
            console.log('✅ Microfone autorizado via clique');
            return true;
            
        } catch (error) {
            console.error('❌ Permissão de microfone negada:', error);
            recordButton.disabled = true;
            
            // Mostra alerta para usuário
            alert('Para usar o tradutor de voz, permita o acesso ao microfone quando solicitado.');
            return false;
        }
    }
    
    async function translateText(text) {
        try {
            const trimmedText = text.trim().slice(0, 500);
            if (!trimmedText) return "";
            
            const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Request-Source': 'web-translator'
                },
                body: JSON.stringify({ 
                    text: trimmedText, 
                    targetLang: IDIOMA_DESTINO,
                    source: 'integrated-translator',
                    sessionId: window.myId || 'default-session'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            if (speakerButton) speakerButton.disabled = false;
            
            return result.translatedText || "";
            
        } catch (error) {
            console.error('Erro na tradução:', error);
            return "";
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
    
    async function startRecording() {
        if (isRecording || isTranslating) return;
        
        try {
            // ✅ SOLICITA PERMISSÃO APENAS NA PRIMEIRA VEZ
            if (!microphonePermissionGranted) {
                const permitted = await requestMicrophonePermissionOnClick();
                if (!permitted) return; // Se usuário negou, para aqui
            }
            
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

    // ===== EVENTOS =====
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
    
    // ✅ CONFIGURAÇÃO INICIAL (SEM SOLICITAR MICROFONE AUTOMATICAMENTE)
    console.log('Tradutor Caller inicializado - Microfone será solicitado no primeiro clique');
    
    // ✅ HABILITA O BOTÃO (a permissão será solicitada no clique)
    recordButton.disabled = false;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando tradutor caller...');
    setTimeout(initializeTranslator, 800);
});
