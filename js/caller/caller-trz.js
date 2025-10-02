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

    // ===== RECONHECIMENTO DE VOZ =====
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        
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
        if (translatedText) translatedText.textContent = "🎤";
        isRecording = false;
    };
    
    recognition.onend = function() {
        isRecording = false;
    };
    
    // Evento simples do botão de gravar
    recordButton.addEventListener('click', function() {
        if (isRecording) return;
        
        try {
            recognition.lang = window.currentSourceLang || currentLang;
            recognition.start();
            isRecording = true;
            
            if (translatedText) translatedText.textContent = "🎙️";
            
        } catch (error) {
            console.error('Erro ao gravar:', error);
            if (translatedText) translatedText.textContent = "🎤";
            isRecording = false;
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
    
    console.log('✅ Tradutor Caller inicializado');
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeTranslator, 800);
});
