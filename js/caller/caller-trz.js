// ===== TRADUTOR SIMPLIFICADO PARA CALLER =====
function initializeTranslator() {
    const recordButton = document.getElementById('recordButton');
    const translatedText = document.getElementById('translatedText');
    const speakerButton = document.getElementById('speakerButton');
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    const worldButton = document.getElementById('worldButton');
    const languageDropdown = document.getElementById('languageDropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    
    if (!recordButton || !translatedText) {
        setTimeout(initializeTranslator, 300);
        return;
    }
    
    translatedText.textContent = "🎤";
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        translatedText.textContent = "❌ Navegador não suportado";
        recordButton.style.display = 'none';
        return;
    }
    
    let recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    let currentLang = 'pt-BR';
    let isRecording = false;
    let microphonePermissionGranted = false;
    
    // ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
    function enviarParaOutroCelular(texto) {
        if (window.rtcDataChannel && window.rtcDataChannel.readyState === 'open') {
            window.rtcDataChannel.send(texto);
            console.log('✅ Texto enviado:', texto);
        } else {
            console.log('⏳ Canal não disponível');
        }
    }

    async function translateText(text) {
        try {
            const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: text,
                    targetLang: window.targetTranslationLang || 'en'
                })
            });

            const result = await response.json();
            return result.translatedText || text;
            
        } catch (error) {
            return text;
        }
    }

    // ===== BOTÃO MUNDO SIMPLIFICADO =====
    async function getBandeira(langCode) {
        try {
            const response = await fetch('./assets/bandeiras/language-flags.json');
            const flags = await response.json();
            return flags[langCode] || flags[langCode.split('-')[0]] || '🎌';
        } catch (error) {
            return '🎌';
        }
    }
    
    // Configuração inicial
    getBandeira(currentLang).then(bandeira => {
        if (currentLanguageFlag) currentLanguageFlag.textContent = bandeira;
    });

    // Eventos do botão mundo
    if (worldButton && languageDropdown) {
        worldButton.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });

        document.addEventListener('click', function() {
            languageDropdown.classList.remove('show');
        });

        languageOptions.forEach(option => {
            option.addEventListener('click', async function() {
                currentLang = this.getAttribute('data-lang');
                
                const bandeira = await getBandeira(currentLang);
                if (currentLanguageFlag) currentLanguageFlag.textContent = bandeira;
                
                languageDropdown.classList.remove('show');
                window.currentSourceLang = currentLang;
                
                console.log('🌎 Idioma alterado para:', currentLang);
            });
        });
    }

    // ===== PERMISSÃO DO MICROFONE =====
    async function requestMicrophonePermission() {
        try {
            // Verifica se já tem permissão
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophonePermission = devices.some(device => 
                device.kind === 'audioinput' && device.deviceId !== ''
            );
            
            if (hasMicrophonePermission) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                translatedText.textContent = "🎤";
                setupRecognitionEvents();
                console.log('✅ Microfone já autorizado');
                return;
            }

            // Solicita permissão
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            // Para a stream imediatamente (só precisamos da permissão)
            stream.getTracks().forEach(track => track.stop());
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            translatedText.textContent = "🎤";
            setupRecognitionEvents();
            
            console.log('✅ Permissão de microfone concedida');
            
        } catch (error) {
            console.error('❌ Erro permissão microfone:', error);
            translatedText.textContent = "🚫";
            recordButton.disabled = true;
        }
    }

    // ===== RECONHECIMENTO DE VOZ =====
    function setupRecognitionEvents() {
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            
            console.log('🎤 Texto reconhecido:', transcript);
            
            if (translatedText) {
                translatedText.textContent = "🔄";
            }
            
            translateText(transcript).then(translation => {
                enviarParaOutroCelular(translation);
                
                if (translatedText) {
                    translatedText.textContent = "✅";
                    setTimeout(() => {
                        if (translatedText) translatedText.textContent = "🎤";
                    }, 1000);
                }
            }).catch(error => {
                console.error('Erro:', error);
                if (translatedText) translatedText.textContent = "🎤";
            });
        };
        
        recognition.onerror = function(event) {
            console.log('Erro reconhecimento:', event.error);
            if (translatedText) translatedText.textContent = "❌";
            setTimeout(() => {
                if (translatedText) translatedText.textContent = "🎤";
            }, 1000);
            isRecording = false;
            updateRecordButton(false);
        };
        
        recognition.onend = function() {
            console.log('⏹️ Gravação finalizada');
            isRecording = false;
            updateRecordButton(false);
            
            if (translatedText && translatedText.textContent === "🎙️") {
                translatedText.textContent = "🎤";
            }
        };
    }
    
    // ===== FEEDBACK VISUAL =====
    function updateRecordButton(recording) {
        if (recording) {
            recordButton.style.background = "#2ed573"; // Verde quando gravando
            recordButton.style.transform = "scale(1.1)";
            recordButton.style.boxShadow = "0 0 20px rgba(46, 213, 115, 0.5)";
        } else {
            recordButton.style.background = "#ff4757"; // Vermelho quando parado
            recordButton.style.transform = "scale(1)";
            recordButton.style.boxShadow = "none";
        }
    }
    
    // Evento do botão de gravar
    recordButton.addEventListener('click', function() {
        if (isRecording || !microphonePermissionGranted) {
            // Se já está gravando, para a gravação
            if (isRecording) {
                recognition.stop();
                isRecording = false;
                updateRecordButton(false);
                if (translatedText) translatedText.textContent = "🎤";
            }
            return;
        }
        
        try {
            recognition.lang = window.currentSourceLang || currentLang;
            recognition.start();
            isRecording = true;
            
            // ✅ FEEDBACK VISUAL PARA O USUÁRIO
            updateRecordButton(true);
            if (translatedText) translatedText.textContent = "🎙️";
            
            console.log('🔴 Iniciando gravação...');
            
        } catch (error) {
            console.error('Erro ao gravar:', error);
            if (translatedText) translatedText.textContent = "❌";
            setTimeout(() => {
                if (translatedText) translatedText.textContent = "🎤";
            }, 1000);
            isRecording = false;
            updateRecordButton(false);
        }
    });
    
    // Botão speaker simples
    if (speakerButton) {
        speakerButton.addEventListener('click', function() {
            const textoRecebido = document.getElementById("texto-recebido");
            if (textoRecebido && textoRecebido.textContent && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(textoRecebido.textContent);
                utterance.lang = window.targetTranslationLang || 'pt-BR';
                window.speechSynthesis.speak(utterance);
            }
        });
    }
    
    // ✅ SOLICITA PERMISSÃO DO MICROFONE
    requestMicrophonePermission();
    
    console.log('✅ Tradutor Caller inicializado');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeTranslator, 800);
});
