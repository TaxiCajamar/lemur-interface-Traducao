// ===== TRADUTOR SIMPLIFICADO - MANTÉM A ESSÊNCIA =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor simplificado...');

    // 🎯 IDIOMAS JÁ DEFINIDOS (das bandeiras)
    const IDIOMA_ORIGEM = window.sourceTranslationLang || navigator.language || 'pt-BR';
    const IDIOMA_DESTINO = window.targetTranslationLang || 'en';
    
    console.log('🔤 Idiomas configurados:', { origem: IDIOMA_ORIGEM, destino: IDIOMA_DESTINO });

    // 🎤 ELEMENTOS PRINCIPAIS
    const recordButton = document.getElementById('recordButton');
    const textoRecebido = document.getElementById('texto-recebido');
    
    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos...');
        setTimeout(initializeTranslator, 500);
        return;
    }

    // 🎙️ CONFIGURAÇÃO SIMPLES DE VOZ
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        recordButton.style.display = 'none';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = IDIOMA_ORIGEM;
    recognition.continuous = false;
    recognition.interimResults = false;

    // 🎯 FUNÇÃO SIMPLES DE TRADUÇÃO
    async function traduzirEFalar(texto) {
        try {
            console.log('🔄 Traduzindo:', texto.substring(0, 50));
            
            // 1. TRADUZ TEXTO
            const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: texto,
                    sourceLang: IDIOMA_ORIGEM,
                    targetLang: IDIOMA_DESTINO
                })
            });

            const result = await response.json();
            const textoTraduzido = result.translatedText || texto;

            // 2. ENVIA PARA OUTRO USUÁRIO
            if (window.rtcDataChannel && window.rtcDataChannel.readyState === 'open') {
                window.rtcDataChannel.send(textoTraduzido);
                console.log('✅ Texto enviado:', textoTraduzido);
            } else {
                console.log('⏳ Canal não pronto, tentando novamente...');
                setTimeout(() => traduzirEFalar(texto), 500);
            }

        } catch (error) {
            console.error('❌ Erro na tradução:', error);
        }
    }

    // 🎙️ CONTROLE SIMPLES DE GRAVAÇÃO
    let gravando = false;

    function iniciarGravacao() {
        if (gravando) return;
        
        try {
            recognition.start();
            gravando = true;
            recordButton.classList.add('recording');
            console.log('🎙️ Gravando...');
        } catch (error) {
            console.log('❌ Erro ao gravar:', error);
        }
    }

    function pararGravacao() {
        if (!gravando) return;
        
        gravando = false;
        recordButton.classList.remove('recording');
        console.log('⏹️ Parando gravação');
    }

    // 🎯 EVENTOS SIMPLIFICADOS
    recognition.onresult = function(event) {
        const texto = event.results[0][0].transcript;
        console.log('📝 Texto reconhecido:', texto);
        
        traduzirEFalar(texto);
        pararGravacao();
    };

    recognition.onend = function() {
        pararGravacao();
    };

    recognition.onerror = function(event) {
        console.log('❌ Erro reconhecimento:', event.error);
        pararGravacao();
    };

    // 🎮 CONTROLES DO BOTÃO
    recordButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (!gravando) iniciarGravacao();
    });

    recordButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        if (gravando) pararGravacao();
    });

    recordButton.addEventListener('click', function(e) {
        e.preventDefault();
        gravando ? pararGravacao() : iniciarGravacao();
    });

    // ✅ MICROFONE JÁ AUTORIZADO (pelas permissões principais)
    recordButton.disabled = false;
    console.log('✅ Tradutor simplificado pronto!');
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando tradutor notificador...');
    // Dá tempo para o WebRTC configurar
    setTimeout(initializeTranslator, 2000);
});
