// ✅ SOLUÇÃO OTIMIZADA E SINCRONIZADA - USANDO IDIOMAS GUARDADOS
function initializeTranslator() {
    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS =====
    console.log('🔍 Verificando dependências do caller-ui.js...');
    
    // ✅ VERIFICA SE CALLER-UI.JS JÁ CONFIGUROU TUDO
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        console.log('⏳ Aguardando caller-ui.js configurar idiomas...', {
            meuIdiomaLocal: window.meuIdiomaLocal,
            meuIdiomaRemoto: window.meuIdiomaRemoto
        });
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    // ✅ VERIFICA SE WEBRTC ESTÁ PRONTO
    if (!window.rtcCore) {
        console.log('⏳ Aguardando WebRTC inicializar...');
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    // ===== CONFIGURAÇÃO SIMPLIFICADA =====
    let IDIOMA_ORIGEM = window.meuIdiomaLocal || 'pt-BR';
    let IDIOMA_DESTINO = window.meuIdiomaRemoto || 'en';
    let IDIOMA_FALA = window.meuIdiomaRemoto || 'en-US';
    
    console.log(`🎯 Tradutor sincronizado: ${IDIOMA_ORIGEM} → ${IDIOMA_DESTINO}`);
    console.log('✅ Todas as dependências carregadas!');
    
    // ===== ELEMENTOS DOM =====
    const recordButton = document.getElementById('recordButton');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');
    
    // ⭐ VERIFICA SE ELEMENTOS CRÍTICOS EXISTEM
    if (!recordButton || !textoRecebido) {
        console.log('Aguardando elementos do DOM...');
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    // ===== FUNÇÃO MELHORADA PARA ENVIAR TEXTO =====
    function enviarParaOutroCelular(texto) {
        // ✅ USA O CANAL DO WEBRTCCORE CORRETAMENTE
        if (window.rtcCore && window.rtcCore.dataChannel && 
            window.rtcCore.dataChannel.readyState === 'open') {
            window.rtcCore.dataChannel.send(texto);
            console.log('✅ Texto enviado via WebRTC Core:', texto);
            return true;
        } else {
            console.log('⏳ Canal WebRTC não disponível. Estado:', 
                window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'rtcCore não existe');
            setTimeout(() => enviarParaOutroCelular(texto), 1000);
            return false;
        }
    }

    // ===== VERIFICAÇÃO DE SUPORTE =====
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechRecognition) {
        console.log('❌ SpeechRecognition não suportado');
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }
    
    let recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM; // ✅ Idioma local correto
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
    let microphonePermissionGranted = false;
    let lastTranslationTime = 0;
    
    // ===== FUNÇÕES PRINCIPAIS =====
    function setupRecognitionEvents() {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    console.log(`🎤 Reconhecido: "${finalTranscript}"`);
                    
                    // ✅ Traduz PARA O IDIOMA REMOTO (guardado)
                    translateText(finalTranscript).then(translation => {
                        if (translation && translation.trim() !== "") {
                            console.log(`🌐 Traduzido: "${finalTranscript}" → "${translation}"`);
                            enviarParaOutroCelular(translation);
                        } else {
                            console.log('❌ Tradução vazia ou falhou');
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
                console.log('🔚 Reconhecimento terminado automaticamente');
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

    // ✅ FUNÇÃO DE TRADUÇÃO SIMPLIFICADA
    async function translateText(text) {
        try {
            const trimmedText = text.trim().slice(0, 500);
            if (!trimmedText) {
                console.log('⚠️ Texto vazio para traduzir');
                return "";
            }
            
            console.log(`🌐 Enviando para tradução: "${trimmedText.substring(0, 50)}..."`);
            
            const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: trimmedText, 
                    targetLang: window.meuIdiomaRemoto // ✅ USA O GUARDADO
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (speakerButton) {
                speakerButton.disabled = false;
            }
            
            console.log(`✅ Tradução recebida: ${result.translatedText || "VAZIO"}`);
            return result.translatedText || "";
            
        } catch (error) {
            console.error('❌ Erro na tradução:', error);
            return "";
        }
    }
    
    function speakText(text) {
        if (!SpeechSynthesis || !text) {
            console.log('❌ SpeechSynthesis não disponível ou texto vazio');
            return;
        }
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // ✅ SEMPRE USA O IDIOMA REMOTO CORRETO
        utterance.lang = window.meuIdiomaRemoto || 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
            console.log('🔊 Iniciando fala do texto');
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.log('🔊 Fala terminada');
        };
        
        utterance.onerror = function(event) {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.error('❌ Erro na fala:', event.error);
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    function toggleSpeech() {
        if (!SpeechSynthesis) {
            console.log('❌ SpeechSynthesis não suportado');
            return;
        }
        
        if (isSpeechPlaying) {
            window.speechSynthesis.cancel();
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.log('⏹ Fala cancelada');
        } else {
            // ✅ CORREÇÃO: Lê apenas o texto recebido
            if (textoRecebido && textoRecebido.textContent) {
                const textToSpeak = textoRecebido.textContent.trim();
                if (textToSpeak !== "") {
                    console.log(`🔊 Falando texto: "${textToSpeak.substring(0, 50)}..."`);
                    speakText(textToSpeak);
                } else {
                    console.log('⚠️ Nenhum texto para falar');
                }
            } else {
                console.log('⚠️ Elemento texto-recebido não encontrado');
            }
        }
    }
    
    async function startRecording() {
        if (isRecording || isTranslating) {
            console.log('⚠️ Já está gravando ou traduzindo');
            return;
        }
        
        try {
            // ✅ SOLICITA PERMISSÃO APENAS NA PRIMEIRA VEZ
            if (!microphonePermissionGranted) {
                console.log('🎤 Primeira vez - solicitando permissão...');
                const permitted = await requestMicrophonePermissionOnClick();
                if (!permitted) {
                    console.log('❌ Permissão negada - parando gravação');
                    return;
                }
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
            
            console.log('🎤 Gravação iniciada');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            stopRecording();
        }
    }
    
    function stopRecording() {
        if (!isRecording) {
            console.log('⚠️ Não estava gravando');
            return;
        }
        
        isRecording = false;
        if (recordButton) recordButton.classList.remove('recording');
        clearInterval(timerInterval);
        hideRecordingModal();
        
        console.log('⏹️ Gravação parada');
    }
    
    function showRecordingModal() {
        if (recordingModal) {
            recordingModal.classList.add('visible');
            console.log('📱 Modal de gravação visível');
        }
    }
    
    function hideRecordingModal() {
        if (recordingModal) {
            recordingModal.classList.remove('visible');
            console.log('📱 Modal de gravação escondido');
        }
    }
    
    function updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        
        if (recordingTimer) {
            recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        if (elapsedSeconds >= 30) {
            console.log('⏰ Tempo máximo de gravação atingido (30s)');
            stopRecording();
        }
    }

    // ===== EVENTOS =====
    if (recordButton) {
        recordButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (recordButton.disabled || isTranslating) {
                console.log('⚠️ Botão desabilitado ou traduzindo');
                return;
            }
            
            if (!isRecording) {
                pressTimer = setTimeout(() => {
                    tapMode = false;
                    console.log('👆 Touch longo - iniciando gravação');
                    startRecording();
                    showRecordingModal();
                }, 300);
            }
        });
        
        recordButton.addEventListener('touchend', function(e) {
            e.preventDefault();
            clearTimeout(pressTimer);
            
            if (isRecording) {
                console.log('👆 Touch solto - parando gravação');
                stopRecording();
            } else {
                if (!isTranslating) {
                    tapMode = true;
                    console.log('👆 Touch rápido - iniciando gravação');
                    startRecording();
                    showRecordingModal();
                }
            }
        });

        recordButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (recordButton.disabled || isTranslating) {
                console.log('⚠️ Botão desabilitado ou traduzindo');
                return;
            }
            
            if (isRecording) {
                console.log('🖱️ Clique - parando gravação');
                stopRecording();
            } else {
                console.log('🖱️ Clique - iniciando gravação');
                startRecording();
                showRecordingModal();
            }
        });
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', function() {
            console.log('📤 Botão enviar - parando gravação');
            stopRecording();
        });
    }
    
    if (speakerButton) {
        speakerButton.addEventListener('click', function() {
            console.log('🔊 Botão speaker - alternando fala');
            toggleSpeech();
        });
    }
    
    // ✅ CONFIGURAÇÃO INICIAL SIMPLIFICADA
    console.log(`🎯 Tradutor completamente inicializado: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado final:', {
        recordButton: !!recordButton,
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore,
        dataChannel: window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'não disponível'
    });
    
    recordButton.disabled = false;
}

// ✅ INICIALIZAÇÃO ROBUSTA COM VERIFICAÇÃO
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor com verificação de segurança...');
    
    // Verifica se o DOM está pronto
    if (document.readyState === 'loading') {
        console.log('⏳ DOM ainda carregando...');
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeTranslator, 1000);
        });
    } else {
        console.log('✅ DOM já carregado, iniciando tradutor...');
        setTimeout(initializeTranslator, 1000);
    }
}

// Inicia o tradutor de forma segura
startTranslatorSafely();
