// tradutor-simples.js - SUPER SIMPLES
let isRecording = false;
let recognition = null;

async function traduzirVoz() {
    if (isRecording) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Reconhecimento de voz não suportado neste navegador');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isRecording = true;
        console.log('🎤 Gravando...');
    };

    recognition.onresult = async (event) => {
        const texto = event.results[0][0].transcript;
        console.log('📝 Texto capturado:', texto);
        
        try {
            // 🌐 TRADUZIR
            const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: texto, 
                    targetLang: window.targetTranslationLang || 'en' 
                })
            });
            
            const resultado = await response.json();
            const textoTraduzido = resultado.translatedText || texto;
            console.log('🌐 Texto traduzido:', textoTraduzido);
            
            // 📤 ENVIAR
            if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
                window.rtcDataChannel.send(textoTraduzido);
                console.log('✅ Enviado:', textoTraduzido);
            } else {
                console.log('❌ Canal não disponível');
            }
            
        } catch (error) {
            console.error('❌ Erro na tradução:', error);
        }
    };

    recognition.onend = () => {
        isRecording = false;
        console.log('⏹️ Gravação terminada');
    };

    recognition.onerror = (event) => {
        isRecording = false;
        console.error('❌ Erro no reconhecimento:', event.error);
    };

    recognition.start();
}

// 🔊 FALAR TEXTO (quando recebe)
function falarTexto(texto) {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = window.targetTranslationLang || 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

// 🎧 CONFIGURAR RECEBIMENTO (chamar esta função nos UI)
function configurarReceptorTraducao() {
    if (window.rtcCore) {
        window.rtcCore.setDataChannelCallback((mensagem) => {
            console.log('📩 Mensagem recebida:', mensagem);
            
            // Mostrar no elemento de texto
            const elementoTexto = document.getElementById('texto-recebido');
            if (elementoTexto) {
                elementoTexto.textContent = mensagem;
            }
            
            // Falar automaticamente
            falarTexto(mensagem);
        });
    }
}
