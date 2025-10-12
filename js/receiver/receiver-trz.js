// ===== TRADUTOR OTIMIZADO E SINCRONIZADO - RECEIVER =====

// 🌐 DETECÇÃO DE NAVEGADOR MOBILE (para uso no tradutor)
function isMobileSafari() {
    return /iP(hone|od|ad).+Safari/i.test(navigator.userAgent);
}

// ===== FUNÇÃO DE TRADUÇÃO ATUALIZADA =====
async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                targetLang: window.meuIdiomaRemoto || 'en' // ✅ USA IDIOMA GUARDADO
            })
        });

        const result = await response.json();
        const translatedText = result.translatedText || text;
        return translatedText;
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        return text;
    }
}

// ✅ FUNÇÃO PARA PROCESSAR TEXTO (Safari + Chrome)
async function processarTextoParaTraducao(texto) {
    if (!texto.trim()) return;
    
    console.log('🎤 Processando texto para tradução:', texto);
    
    // Mostra feedback visual
    const textoRecebido = document.getElementById('texto-recebido');
    if (textoRecebido) {
        textoRecebido.textContent = "Traduzindo...";
        textoRecebido.style.opacity = '1';
    }
    
    try {
        // Traduz o texto
        const translation = await translateText(texto);
        
        if (translation && translation.trim() !== "") {
            console.log(`🌐 Traduzido: "${texto}" → "${translation}"`);
            
            // Envia via WebRTC
            enviarParaOutroCelular(translation);
            
            // Mostra no elemento de texto recebido (feedback local)
            if (textoRecebido) {
                textoRecebido.textContent = translation;
            }
        } else {
            console.log('❌ Tradução vazia ou falhou');
            if (textoRecebido) {
                textoRecebido.textContent = "Erro na tradução";
            }
        }
    } catch (error) {
        console.error('Erro na tradução:', error);
        if (textoRecebido) {
            textoRecebido.textContent = "Erro na tradução";
        }
    }
}

// ===== INICIALIZAÇÃO DO TRADUTOR SINCRONIZADA =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor receiver...');

    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS =====
    console.log('🔍 Verificando dependências do receiver-ui.js...');
    
    // ✅ VERIFICA SE RECEIVER-UI.JS JÁ CONFIGUROU TUDO
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        console.log('⏳ Aguardando receiver-ui.js configurar idiomas...', {
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

    // 🎯 CONFIGURAÇÃO DE IDIOMAS SINCRONIZADA
    const IDIOMA_ORIGEM = window.meuIdiomaLocal || 'pt-BR';
    const IDIOMA_DESTINO = window.meuIdiomaRemoto || 'en';
    const IDIOMA_FALA = window.meuIdiomaRemoto || 'en-US';
    
    console.log('🔤 Idiomas sincronizados:', { 
        origem: IDIOMA_ORIGEM, 
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA 
    });

    // 🎤 ELEMENTOS VISUAIS
    const recordButton = document.getElementById('recordButton');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');

    // ✅ SAFARI: ABRE TECLADO NATIVO QUANDO CLICA NO MICROFONE
    if (isMobileSafari()) {
        console.log('📱 Safari iOS - configurando teclado nativo');
        
        // 1. ENCONTRA o campo de input do tradutor que JÁ EXISTE
        const campoEntrada = document.querySelector('input[type="text"]') || 
                            document.getElementById('texto-entrada') ||
                            document.querySelector('.text-input') ||
                            document.querySelector('input');
        
        if (campoEntrada) {
            console.log('✅ Safari: Campo de entrada encontrado');
            
            // 2. QUANDO CLICA NO BOTÃO MICROFONE → ABRE TECLADO
            recordButton.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('📱 Safari: Abrindo teclado nativo...');
                campoEntrada.focus(); // ⬅️ ISSO ABRE TECLADO DO IPHONE
            });
            
            // 3. QUANDO USUÁRIO TERMINA DE FALAR/DIGITAR → ENVIA PARA TRADUÇÃO
            campoEntrada.addEventListener('change', function() {
                const texto = this.value.trim();
                if (texto) {
                    console.log('🎤 Safari - Texto para traduzir:', texto);
                    
                    // ⬇️⬇️⬇️ SEU CÓDIGO ORIGINAL FAZ O RESTO ⬇️⬇️⬇️
                    // - Envia para API de tradução
                    // - Recebe tradução
                    // - Envia via WebRTC para outro celular
                    processarTextoParaTraducao(texto);
                    
                    this.value = ''; // Limpa campo
                }
            });
            
            // 4. TAMBÉM CAPTURA ENTER (caso usuário digite)
            campoEntrada.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const texto = this.value.trim();
                    if (texto) {
                        console.log('🎤 Safari - Texto com Enter:', texto);
                        processarTextoParaTraducao(texto);
                        this.value = '';
                    }
                }
            });
        } else {
            console.log('❌ Safari: Nenhum campo de entrada encontrado');
        }
    }

    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🎙️ CONFIGURAÇÃO DE VOZ (apenas para Chrome)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    let recognition = null;
    
    // Só configura recognition se NÃO for Safari e se a API existir
    if (!isMobileSafari() && SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = IDIOMA_ORIGEM;
        recognition.continuous = false;
        recognition.interimResults = true;
    } else if (!isMobileSafari()) {
        console.log('❌ SpeechRecognition não suportado');
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }

    // ⏱️ VARIÁVEIS DE ESTADO (COMPLETAS)
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false;
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
            console.log('⏰ Tempo máximo de gravação atingido (30s)');
            stopRecording();
        }
    }

    // 🎙️ CONTROLES DE GRAVAÇÃO (COM TODOS OS VISUAIS)
    function showRecordingModal() {
        if (recordingModal) recordingModal.classList.add('visible');
        recordingStartTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        console.log('📱 Modal de gravação visível');
    }

    function hideRecordingModal() {
        if (recordingModal) recordingModal.classList.remove('visible');
        clearInterval(timerInterval);
        console.log('📱 Modal de gravação escondido');
    }

    // ✅ FUNÇÃO DE PERMISSÃO HÍBRIDA MOBILE
    async function requestMicrophonePermissionOnClick() {
        try {
            console.log('🎤 Solicitando permissão (modo mobile híbrido)...');
            
            // ✅ PRIMEIRO: No Safari, verifica se já tem permissão do receiver-ui.js
            if (isMobileSafari() && window.microphonePermissionGranted && window.microphoneStream) {
                console.log('📱 Safari: Reutilizando stream existente do receiver-ui.js');
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                return true;
            }
            
            console.log('🎤 Solicitando permissão de microfone...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // ✅ HÍBRIDO: Comportamento diferente por navegador
            if (isMobileSafari()) {
                // ✅ SAFARI: Guarda o stream para reutilizar
                window.microphoneStream = stream;
                window.microphonePermissionGranted = true;
                console.log('✅ Safari: Stream de microfone guardado');
            } else {
                // ✅ CHROME: Comportamento original - para o stream
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                }, 100);
            }
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            
            console.log('✅ Microfone autorizado (mobile híbrido)');
            return true;
            
        } catch (error) {
            console.error('❌ Permissão de microfone negada:', error);
            recordButton.disabled = true;
            
            // Mensagem específica por navegador
            if (isMobileSafari()) {
                alert('No Safari: Toque em "Permitir" quando solicitado o microfone.');
            } else {
                alert('Para usar o tradutor de voz, permita o acesso ao microfone quando solicitado.');
            }
            return false;
        }
    }

    function startRecording() {
        // ✅ Se for Safari, não usa gravação - já tem teclado nativo
        if (isMobileSafari()) {
            console.log('📱 Safari: Use o teclado nativo');
            return;
        }
        
        if (isRecording || isTranslating) {
            console.log('⚠️ Já está gravando ou traduzindo');
            return;
        }
        
        try {
            // ✅ SOLICITA PERMISSÃO APENAS NA PRIMEIRA VEZ
            if (!microphonePermissionGranted) {
                console.log('🎤 Primeira vez - solicitando permissão...');
                requestMicrophonePermissionOnClick().then(permitted => {
                    if (permitted) {
                        // Se permissão concedida, inicia gravação
                        doStartRecording();
                    }
                });
                return;
            }
            
            doStartRecording();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            stopRecording();
        }
    }

    function doStartRecording() {
        if (!recognition) {
            console.log('❌ Recognition não disponível');
            return;
        }
        
        recognition.start();
        isRecording = true;
        
        // ✅ VISUAL: Botão fica verde
        recordButton.classList.add('recording');
        showRecordingModal();
        
        // ✅ VISUAL: Desabilita botão speaker durante gravação
        if (speakerButton) {
            speakerButton.disabled = true;
        }
        
        console.log('🎙️ Gravação iniciada');
    }

    function stopRecording() {
        if (!isRecording) {
            console.log('⚠️ Não estava gravando');
            return;
        }
        
        isRecording = false;
        if (recognition) {
            recognition.stop();
        }
        
        // ✅ VISUAL: Botão volta ao normal
        recordButton.classList.remove('recording');
        hideRecordingModal();
        
        // ✅ VISUAL: Reativa botão speaker após gravação
        if (speakerButton) {
            speakerButton.disabled = false;
        }
        
        console.log('⏹️ Parando gravação');
    }

    // 🔊 SISTEMA DE VOZ
    function speakText(text) {
        if (!SpeechSynthesis || !text) {
            console.log('❌ SpeechSynthesis não disponível ou texto vazio');
            return;
        }
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // ✅ USA O IDIOMA REMOTO CORRETO (GUARDADO)
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

    // 🎙️ EVENTOS DE RECONHECIMENTO (apenas para Chrome)
    if (recognition) {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            // ✅ PROCESSO DE TRADUÇÃO CORRETO E SINCRONIZADO
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    console.log(`🎤 Reconhecido: "${finalTranscript}"`);
                    
                    translateText(finalTranscript).then(translation => {
                        if (translation && translation.trim() !== "") {
                            console.log(`🌐 Traduzido: "${finalTranscript}" → "${translation}"`);
                            
                            // ✅ ENVIA VIA FUNÇÃO MELHORADA
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

    // 🎮 EVENTOS DE BOTÃO (COM TODOS OS VISUAIS ORIGINAIS)
    if (recordButton && !isMobileSafari()) {
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

    // ✅ CONFIGURAÇÃO FINAL SINCRONIZADA
    console.log(`🎯 Tradutor receiver completamente sincronizado: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado final:', {
        recordButton: !!recordButton,
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore,
        dataChannel: window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'não disponível',
        isMobileSafari: isMobileSafari()
    });
    
    if (!isMobileSafari()) {
        recordButton.disabled = false;
    }
}

// ✅ INICIALIZAÇÃO ROBUSTA COM VERIFICAÇÃO
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor receiver com verificação de segurança...');
    
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
startTranslatorSafely();// ===== TRADUTOR OTIMIZADO E SINCRONIZADO - RECEIVER =====

// 🌐 DETECÇÃO DE NAVEGADOR MOBILE (para uso no tradutor)
function isMobileSafari() {
    return /iP(hone|od|ad).+Safari/i.test(navigator.userAgent);
}

// ===== FUNÇÃO DE TRADUÇÃO ATUALIZADA =====
async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                targetLang: window.meuIdiomaRemoto || 'en' // ✅ USA IDIOMA GUARDADO
            })
        });

        const result = await response.json();
        const translatedText = result.translatedText || text;
        return translatedText;
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        return text;
    }
}

// ✅ FUNÇÃO PARA PROCESSAR TEXTO (Safari + Chrome)
async function processarTextoParaTraducao(texto) {
    if (!texto.trim()) return;
    
    console.log('🎤 Processando texto para tradução:', texto);
    
    // Mostra feedback visual
    const textoRecebido = document.getElementById('texto-recebido');
    if (textoRecebido) {
        textoRecebido.textContent = "Traduzindo...";
        textoRecebido.style.opacity = '1';
    }
    
    try {
        // Traduz o texto
        const translation = await translateText(texto);
        
        if (translation && translation.trim() !== "") {
            console.log(`🌐 Traduzido: "${texto}" → "${translation}"`);
            
            // Envia via WebRTC
            enviarParaOutroCelular(translation);
            
            // Mostra no elemento de texto recebido (feedback local)
            if (textoRecebido) {
                textoRecebido.textContent = translation;
            }
        } else {
            console.log('❌ Tradução vazia ou falhou');
        }
    } catch (error) {
        console.error('Erro na tradução:', error);
        if (textoRecebido) {
            textoRecebido.textContent = "Erro na tradução";
        }
    }
}

// ===== INICIALIZAÇÃO DO TRADUTOR SINCRONIZADA =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor receiver...');

    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS =====
    console.log('🔍 Verificando dependências do receiver-ui.js...');
    
    // ✅ VERIFICA SE RECEIVER-UI.JS JÁ CONFIGUROU TUDO
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        console.log('⏳ Aguardando receiver-ui.js configurar idiomas...', {
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

    // 🎯 CONFIGURAÇÃO DE IDIOMAS SINCRONIZADA
    const IDIOMA_ORIGEM = window.meuIdiomaLocal || 'pt-BR';
    const IDIOMA_DESTINO = window.meuIdiomaRemoto || 'en';
    const IDIOMA_FALA = window.meuIdiomaRemoto || 'en-US';
    
    console.log('🔤 Idiomas sincronizados:', { 
        origem: IDIOMA_ORIGEM, 
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA 
    });

    // 🎤 ELEMENTOS VISUAIS
    const recordButton = document.getElementById('recordButton');
    const recordingModal = document.getElementById('recordingModal');
    const recordingTimer = document.getElementById('recordingTimer');
    const sendButton = document.getElementById('sendButton');
    const speakerButton = document.getElementById('speakerButton');
    const textoRecebido = document.getElementById('texto-recebido');

    // ✅ SAFARI: CONFIGURAÇÃO DO INPUT NATIVO
    let safariVoiceInput = null;

    // Se for Safari, cria input de voz nativo
    if (isMobileSafari()) {
        console.log('📱 Safari iOS detectado - usando input de voz nativo');
        
        // Esconde o botão de gravação original
        if (recordButton) {
            recordButton.style.display = 'none';
        }
        
        // Cria input com suporte a ditado
        safariVoiceInput = document.createElement('input');
        safariVoiceInput.type = 'text';
        safariVoiceInput.placeholder = 'Toque aqui e diga algo...';
        safariVoiceInput.setAttribute('speech', '');
        safariVoiceInput.setAttribute('x-webkit-speech', '');
        safariVoiceInput.style.width = '80%';
        safariVoiceInput.style.padding = '15px';
        safariVoiceInput.style.margin = '10px auto';
        safariVoiceInput.style.fontSize = '16px';
        safariVoiceInput.style.border = '2px solid #007AFF';
        safariVoiceInput.style.borderRadius = '25px';
        safariVoiceInput.style.textAlign = 'center';
        safariVoiceInput.style.display = 'block';
        
        // Adiciona evento quando o usuário termina de falar/digitar
        safariVoiceInput.addEventListener('change', function() {
            const textoFalado = this.value.trim();
            if (textoFalado) {
                console.log('🎤 Safari - Texto falado:', textoFalado);
                processarTextoParaTraducao(textoFalado);
                this.value = ''; // Limpa o campo
            }
        });
        
        // Também captura Enter (caso o usuário digite)
        safariVoiceInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const textoFalado = this.value.trim();
                if (textoFalado) {
                    console.log('🎤 Safari - Texto digitado:', textoFalado);
                    processarTextoParaTraducao(textoFalado);
                    this.value = ''; // Limpa o campo
                }
            }
        });
        
        // Adiciona o input na interface (no lugar do botão de gravação)
        if (recordButton && recordButton.parentNode) {
            recordButton.parentNode.appendChild(safariVoiceInput);
        }
    }

    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🎙️ CONFIGURAÇÃO DE VOZ (apenas para Chrome)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;
    
    let recognition = null;
    
    // Só configura recognition se NÃO for Safari e se a API existir
    if (!isMobileSafari() && SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = IDIOMA_ORIGEM;
        recognition.continuous = false;
        recognition.interimResults = true;
    } else if (!isMobileSafari()) {
        console.log('❌ SpeechRecognition não suportado');
        if (recordButton) recordButton.style.display = 'none';
        return;
    }
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }

    // ⏱️ VARIÁVEIS DE ESTADO (COMPLETAS)
    let isRecording = false;
    let isTranslating = false;
    let recordingStartTime = 0;
    let timerInterval = null;
    let pressTimer;
    let tapMode = false;
    let isSpeechPlaying = false;
    let microphonePermissionGranted = false;
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
            console.log('⏰ Tempo máximo de gravação atingido (30s)');
            stopRecording();
        }
    }

    // 🎙️ CONTROLES DE GRAVAÇÃO (COM TODOS OS VISUAIS)
    function showRecordingModal() {
        if (recordingModal) recordingModal.classList.add('visible');
        recordingStartTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
        console.log('📱 Modal de gravação visível');
    }

    function hideRecordingModal() {
        if (recordingModal) recordingModal.classList.remove('visible');
        clearInterval(timerInterval);
        console.log('📱 Modal de gravação escondido');
    }

    // ✅ FUNÇÃO DE PERMISSÃO HÍBRIDA MOBILE
    async function requestMicrophonePermissionOnClick() {
        try {
            console.log('🎤 Solicitando permissão (modo mobile híbrido)...');
            
            // ✅ PRIMEIRO: No Safari, verifica se já tem permissão do receiver-ui.js
            if (isMobileSafari() && window.microphonePermissionGranted && window.microphoneStream) {
                console.log('📱 Safari: Reutilizando stream existente do receiver-ui.js');
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                return true;
            }
            
            console.log('🎤 Solicitando permissão de microfone...');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // ✅ HÍBRIDO: Comportamento diferente por navegador
            if (isMobileSafari()) {
                // ✅ SAFARI: Guarda o stream para reutilizar
                window.microphoneStream = stream;
                window.microphonePermissionGranted = true;
                console.log('✅ Safari: Stream de microfone guardado');
            } else {
                // ✅ CHROME: Comportamento original - para o stream
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                }, 100);
            }
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            
            console.log('✅ Microfone autorizado (mobile híbrido)');
            return true;
            
        } catch (error) {
            console.error('❌ Permissão de microfone negada:', error);
            recordButton.disabled = true;
            
            // Mensagem específica por navegador
            if (isMobileSafari()) {
                alert('No Safari: Toque em "Permitir" quando solicitado o microfone.');
            } else {
                alert('Para usar o tradutor de voz, permita o acesso ao microfone quando solicitado.');
            }
            return false;
        }
    }

    function startRecording() {
        // ✅ Se for Safari, não usa gravação - já tem input nativo
        if (isMobileSafari()) {
            console.log('📱 Safari: Use o campo de texto com microfone');
            if (safariVoiceInput) {
                safariVoiceInput.focus(); // Foca no input
            }
            return;
        }
        
        if (isRecording || isTranslating) {
            console.log('⚠️ Já está gravando ou traduzindo');
            return;
        }
        
        try {
            // ✅ SOLICITA PERMISSÃO APENAS NA PRIMEIRA VEZ
            if (!microphonePermissionGranted) {
                console.log('🎤 Primeira vez - solicitando permissão...');
                requestMicrophonePermissionOnClick().then(permitted => {
                    if (permitted) {
                        // Se permissão concedida, inicia gravação
                        doStartRecording();
                    }
                });
                return;
            }
            
            doStartRecording();
            
        } catch (error) {
            console.error('❌ Erro ao iniciar gravação:', error);
            stopRecording();
        }
    }

    function doStartRecording() {
        if (!recognition) {
            console.log('❌ Recognition não disponível');
            return;
        }
        
        recognition.start();
        isRecording = true;
        
        // ✅ VISUAL: Botão fica verde
        recordButton.classList.add('recording');
        showRecordingModal();
        
        // ✅ VISUAL: Desabilita botão speaker durante gravação
        if (speakerButton) {
            speakerButton.disabled = true;
        }
        
        console.log('🎙️ Gravação iniciada');
    }

    function stopRecording() {
        if (!isRecording) {
            console.log('⚠️ Não estava gravando');
            return;
        }
        
        isRecording = false;
        if (recognition) {
            recognition.stop();
        }
        
        // ✅ VISUAL: Botão volta ao normal
        recordButton.classList.remove('recording');
        hideRecordingModal();
        
        // ✅ VISUAL: Reativa botão speaker após gravação
        if (speakerButton) {
            speakerButton.disabled = false;
        }
        
        console.log('⏹️ Parando gravação');
    }

    // 🔊 SISTEMA DE VOZ
    function speakText(text) {
        if (!SpeechSynthesis || !text) {
            console.log('❌ SpeechSynthesis não disponível ou texto vazio');
            return;
        }
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        // ✅ USA O IDIOMA REMOTO CORRETO (GUARDADO)
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

    // 🎙️ EVENTOS DE RECONHECIMENTO (apenas para Chrome)
    if (recognition) {
        recognition.onresult = function(event) {
            let finalTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            // ✅ PROCESSO DE TRADUÇÃO CORRETO E SINCRONIZADO
            if (finalTranscript && !isTranslating) {
                const now = Date.now();
                if (now - lastTranslationTime > 1000) {
                    lastTranslationTime = now;
                    isTranslating = true;
                    
                    console.log(`🎤 Reconhecido: "${finalTranscript}"`);
                    
                    translateText(finalTranscript).then(translation => {
                        if (translation && translation.trim() !== "") {
                            console.log(`🌐 Traduzido: "${finalTranscript}" → "${translation}"`);
                            
                            // ✅ ENVIA VIA FUNÇÃO MELHORADA
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

    // 🎮 EVENTOS DE BOTÃO (COM TODOS OS VISUAIS ORIGINAIS)
    if (recordButton && !isMobileSafari()) {
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

    // ✅ CONFIGURAÇÃO FINAL SINCRONIZADA
    console.log(`🎯 Tradutor receiver completamente sincronizado: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado final:', {
        recordButton: !!recordButton,
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore,
        dataChannel: window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'não disponível',
        isMobileSafari: isMobileSafari()
    });
    
    if (!isMobileSafari()) {
        recordButton.disabled = false;
    }
}

// ✅ INICIALIZAÇÃO ROBUSTA COM VERIFICAÇÃO
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor receiver com verificação de segurança...');
    
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
