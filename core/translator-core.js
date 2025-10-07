// ===== TRADUTOR UNIVERSAL - USANDO BANDEIRAS COMO REFERÊNCIA =====

// 🌐 FUNÇÃO PARA CONVERTER BANDEIRA EMOJI EM CÓDIGO DE IDIOMA
async function bandeiraParaCodigoIdioma(bandeiraEmoji) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        
        // Encontra o código do idioma pela bandeira (emoji)
        for (const [codigo, emoji] of Object.entries(flags)) {
            if (emoji === bandeiraEmoji) {
                console.log(`✅ Bandeira ${bandeiraEmoji} → Código: ${codigo}`);
                return codigo; // Ex: 'pt-BR', 'en-US', 'es-ES'
            }
        }
        
        console.log(`❌ Bandeira não encontrada: ${bandeiraEmoji}, usando fallback`);
        return 'en-US'; // Fallback seguro
        
    } catch (error) {
        console.error('❌ Erro ao carregar JSON de bandeiras:', error);
        return 'en-US';
    }
}

// 🌐 FUNÇÃO PARA DETECTAR IDIOMAS DAS BANDEIRAS VISUAIS
async function detectarIdiomasDasBandeiras() {
    try {
        const elementoLocal = document.querySelector('.local-Lang');
        const elementoRemoto = document.querySelector('.remoter-Lang');
        
        if (!elementoLocal || !elementoRemoto) {
            console.log('❌ Elementos de bandeira não encontrados');
            return {
                idiomaLocal: 'pt-BR',
                idiomaRemoto: 'en-US'
            };
        }

        const bandeiraLocal = elementoLocal.textContent.trim();
        const bandeiraRemota = elementoRemoto.textContent.trim();

        console.log('🎯 Bandeiras detectadas:', {
            local: bandeiraLocal,
            remota: bandeiraRemota
        });

        const [idiomaLocal, idiomaRemoto] = await Promise.all([
            bandeiraParaCodigoIdioma(bandeiraLocal),
            bandeiraParaCodigoIdioma(bandeiraRemota)
        ]);

        console.log('🎯 Idiomas configurados:', {
            de: idiomaLocal,
            para: idiomaRemoto
        });

        return {
            idiomaLocal,
            idiomaRemoto
        };

    } catch (error) {
        console.error('❌ Erro ao detectar idiomas:', error);
        return {
            idiomaLocal: 'pt-BR',
            idiomaRemoto: 'en-US'
        };
    }
}

// 🌐 FUNÇÃO DE TRADUÇÃO CENTRALIZADA (USANDO BANDEIRAS)
window.translateText = async function(texto) {
    try {
        // ✅ USA AS BANDEIRAS VISUAIS COMO REFERÊNCIA
        const { idiomaLocal, idiomaRemoto } = await detectarIdiomasDasBandeiras();

        console.log('🔄 Traduzindo texto:', {
            de: idiomaLocal,
            para: idiomaRemoto,
            texto: texto.substring(0, 50) + '...'
        });

        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: texto,
                sourceLang: idiomaLocal,    // ← DA BANDEIRA .local-Lang
                targetLang: idiomaRemoto    // ← DA BANDEIRA .remoter-Lang
            })
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const result = await response.json();
        const textoTraduzido = result.translatedText || texto;

        console.log('✅ Tradução concluída:', {
            original: texto.substring(0, 30),
            traduzido: textoTraduzido.substring(0, 30)
        });

        return textoTraduzido;
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        return texto; // Fallback: retorna texto original
    }
};

// 🎙️ INICIALIZADOR DO TRADUTOR UNIVERSAL
window.initializeUniversalTranslator = function(customConfig = {}) {
    console.log('🎯 Iniciando tradutor universal com detecção por bandeiras...');

    // 🎯 CONFIGURAÇÃO PADRÃO
    const config = {
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

    // ✅ ATUALIZA IDIOMA DO RECOGNITION BASEADO NA BANDEIRA DO MICROFONE
    async function atualizarIdiomaReconhecimento() {
        try {
            const elementoBandeiraMicrofone = document.querySelector('.language-flag');
            if (elementoBandeiraMicrofone) {
                const bandeiraMicrofone = elementoBandeiraMicrofone.textContent.trim();
                const codigoIdioma = await bandeiraParaCodigoIdioma(bandeiraMicrofone);
                recognition.lang = codigoIdioma;
                console.log(`🎤 Idioma do reconhecimento configurado: ${codigoIdioma}`);
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar idioma do reconhecimento:', error);
            recognition.lang = navigator.language || 'pt-BR';
        }
    }

    function startRecording() {
        if (isRecording || isTranslating) return;
        
        try {
            // ✅ ATUALIZA IDIOMA ANTES DE INICIAR
            atualizarIdiomaReconhecimento().then(() => {
                recognition.start();
                isRecording = true;
                
                recordButton.classList.add('recording');
                showRecordingModal();
                
                if (speakerButton) {
                    speakerButton.disabled = true;
                }
                
                console.log('🎙️ Iniciando gravação...');
            });
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

    // 🔊 SISTEMA DE VOZ (USA BANDEIRA REMOTA PARA TTS)
    async function speakText(text) {
        if (!SpeechSynthesis || !text) return;
        
        try {
            const { idiomaRemoto } = await detectarIdiomasDasBandeiras();
            
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = idiomaRemoto; // ← USA IDIOMA DA BANDEIRA REMOTA
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
            console.log(`🔊 TTS em ${idiomaRemoto}: ${text.substring(0, 30)}...`);
            
        } catch (error) {
            console.error('❌ Erro no TTS:', error);
        }
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
                
                console.log('📝 Texto reconhecido para tradução:', finalTranscript);
                
                // ✅ USA A FUNÇÃO translateText QUE USA AS BANDEIRAS!
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
    console.log('✅ Tradutor universal inicializado com detecção por bandeiras!');
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Tradutor universal carregado - Sistema de bandeiras ativo');
});
