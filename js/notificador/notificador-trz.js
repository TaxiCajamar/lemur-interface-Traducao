// ===== TRADUTOR DINÂMICO + BANDEIRAS PARA NOTIFICADOR =====
function initializeTranslator() {
    console.log('🎯 Inicializando tradutor DINÂMICO para notificador...');
    
    // ✅ BUSCA INTELIGENTE DO BOTÃO DE MICROFONE
    let recordButton = document.getElementById('recordButton');
    
    // ✅ SE NÃO ENCONTRAR, USA OS MESMOS SELETORES DOS OUTROS ARQUIVOS
    if (!recordButton) {
        console.log('🔍 Procurando botão de microfone alternativo...');
        // Tenta os mesmos seletores que funcionam no caller e receiver
        recordButton = document.querySelector('.voice-button, .mic-button, [class*="record"]');
    }
    
    // ✅ ELEMENTOS PARA TRADUÇÃO DINÂMICA
    const translatedText = document.getElementById('texto-recebido'); // Mesmo elemento do WebRTC
    const speakerButton = document.getElementById('speakerButton');
    const currentLanguageFlag = document.getElementById('currentLanguageFlag');
    
    // ✅ VERIFICAÇÃO - SE NÃO ENCONTRAR BOTÃO, PARA AQUI
    if (!recordButton) {
        console.log('❌ Botão de microfone não encontrado para tradução dinâmica');
        console.log('📋 Botões disponíveis:', document.querySelectorAll('button'));
        return;
    }
    
    console.log('✅ Botão de microfone encontrado:', recordButton);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        if (translatedText) translatedText.textContent = "❌ Navegador não suportado";
        recordButton.style.display = 'none';
        return;
    }
    
    let recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // ✅ USA OS MESMOS IDIOMAS DOS OUTROS ARQUIVOS
    let currentLang = window.targetTranslationLang || 'pt-BR';
    let isRecording = false;
    let microphonePermissionGranted = false;
    
    // ===== FUNÇÃO PARA BUSCAR BANDEIRA (IGUAL AOS OUTROS) =====
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

    // ===== FUNÇÃO PARA ENVIAR TEXTO (IGUAL AOS OUTROS) =====
    function enviarParaOutroCelular(texto) {
        if (window.rtcCore && window.rtcCore.dataChannel && window.rtcCore.dataChannel.readyState === 'open') {
            window.rtcCore.dataChannel.send(texto);
            console.log('✅ Texto traduzido enviado:', texto);
        } else {
            console.log('⏳ Canal WebRTC não disponível para tradução dinâmica');
        }
    }

    // ===== TRADUÇÃO DINÂMICA (O QUE USUÁRIO FALA) =====
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
            console.error('Erro na tradução dinâmica:', error);
            return text;
        }
    }

    // ===== CONFIGURAÇÃO DE BANDEIRAS (IGUAL AOS OUTROS) =====
    async function setupBandeiras() {
        try {
            const bandeira = await getBandeiraDoJson(currentLang);
            if (currentLanguageFlag) {
                currentLanguageFlag.textContent = bandeira;
            }
            console.log('🏳️ Bandeira configurada:', bandeira, 'para idioma:', currentLang);
        } catch (error) {
            console.error('Erro ao configurar bandeira:', error);
        }
    }

    // ===== PERMISSÃO DO MICROFONE (MESMA LÓGICA DOS OUTROS) =====
    async function requestMicrophonePermission() {
        try {
            // ✅ USA A MESMA PERMISSÃO GLOBAL DOS OUTROS ARQUIVOS
            if (window.permissoesConcedidas) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                setupRecognitionEvents();
                console.log('✅ Microfone autorizado (permissão global)');
                return;
            }

            // ✅ VERIFICA DISPOSITIVOS (MESMA LÓGICA)
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMicrophonePermission = devices.some(device => 
                device.kind === 'audioinput' && device.deviceId !== ''
            );
            
            if (hasMicrophonePermission) {
                microphonePermissionGranted = true;
                recordButton.disabled = false;
                setupRecognitionEvents();
                console.log('✅ Microfone autorizado (verificação dispositivos)');
                return;
            }

            // ✅ SOLICITA PERMISSÃO (MESMO MÉTODO)
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            
            stream.getTracks().forEach(track => track.stop());
            
            microphonePermissionGranted = true;
            recordButton.disabled = false;
            setupRecognitionEvents();
            
            console.log('✅ Permissão de microfone concedida para tradução dinâmica');
            
        } catch (error) {
            console.error('❌ Erro permissão microfone para tradução dinâmica:', error);
            recordButton.disabled = true;
        }
    }

    // ===== RECONHECIMENTO DE VOZ (TRADUÇÃO DINÂMICA) =====
    function setupRecognitionEvents() {
        recognition.onstart = function() {
            console.log('🎤 Iniciando tradução DINÂMICA...');
            isRecording = true;
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log('🎯 Texto falado para tradução dinâmica:', transcript);
            
            // ✅ TRADUZ DINAMICAMENTE O QUE O USUÁRIO FALOU
            translateText(transcript).then(translation => {
                console.log('🌐 Texto traduzido dinamicamente:', translation);
                enviarParaOutroCelular(translation);
            }).catch(error => {
                console.error('❌ Erro na tradução dinâmica:', error);
            });
        };
        
        recognition.onerror = function(event) {
            console.log('❌ Erro reconhecimento de voz dinâmico:', event.error);
            isRecording = false;
        };
        
        recognition.onend = function() {
            console.log('🔴 Reconhecimento de voz dinâmico finalizado');
            isRecording = false;
        };
    }
    
    // ✅ EVENTO DO BOTÃO (MESMA LÓGICA DOS OUTROS)
    recordButton.addEventListener('click', function() {
        console.log('🎤 Botão de tradução dinâmica clicado');
        
        if (isRecording) {
            recognition.stop();
            return;
        }
        
        if (!microphonePermissionGranted) {
            requestMicrophonePermission();
            return;
        }
        
        try {
            recognition.lang = window.currentSourceLang || currentLang;
            recognition.start();
            console.log('🎤 Iniciando tradução dinâmica...');
            
        } catch (error) {
            console.error('❌ Erro ao iniciar tradução dinâmica:', error);
            isRecording = false;
        }
    });
    
    // ✅ BOTÃO SPEAKER (MESMA LÓGICA)
    if (speakerButton) {
        speakerButton.addEventListener('click', function() {
            const textoRecebido = document.getElementById("texto-recebido");
            if (textoRecebido && textoRecebido.textContent && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(textoRecebido.textContent);
                utterance.lang = window.targetTranslationLang || 'pt-BR';
                utterance.rate = 0.9;
                window.speechSynthesis.speak(utterance);
            }
        });
    }
    
    // ✅ INICIALIZAÇÃO
    console.log('🚀 Tradutor dinâmico notificador carregando...');
    
    // Configura bandeiras
    setupBandeiras();
    
    // Solicita permissão com delay
    setTimeout(() => {
        requestMicrophonePermission();
    }, 1000);
    
    console.log('✅ Tradutor DINÂMICO Notificador inicializado!');
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - inicializando tradutor dinâmico...');
    
    setTimeout(() => {
        initializeTranslator();
    }, 1500);
});
