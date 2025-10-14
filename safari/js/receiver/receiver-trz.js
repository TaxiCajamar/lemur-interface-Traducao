// ===== TRADUTOR SAFARI COMPATIBLE - INTEGRADO COM RECEIVER-UI.JS =====

// ===== FUNÇÃO DE TRADUÇÃO ATUALIZADA =====
async function translateText(text) {
    try {
        const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                text: text,
                targetLang: window.meuIdiomaRemoto || 'en'
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

// ===== INICIALIZAÇÃO DO TRADUTOR SAFARI =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor receiver (Safari Mode)...');

    // ===== VERIFICAÇÃO DE DEPENDÊNCIAS CRÍTICAS =====
    if (!window.meuIdiomaLocal || !window.meuIdiomaRemoto) {
        console.log('⏳ Aguardando receiver-ui.js configurar idiomas...');
        setTimeout(initializeTranslator, 500);
        return;
    }
    
    if (!window.rtcCore) {
        console.log('⏳ Aguardando WebRTC inicializar...');
        setTimeout(initializeTranslator, 500);
        return;
    }

    // 🎯 CONFIGURAÇÃO DE IDIOMAS
    const IDIOMA_DESTINO = window.meuIdiomaRemoto || 'en';
    const IDIOMA_FALA = window.meuIdiomaRemoto || 'en-US';
    
    console.log('🔤 Idiomas Safari:', { 
        destino: IDIOMA_DESTINO,
        fala: IDIOMA_FALA 
    });

    // 🎤 ELEMENTOS VISUAIS - SAFARI MODE
    const recordButton = document.getElementById('recordButton');
    const textoRecebido = document.getElementById('texto-recebido');
    const speakerButton = document.getElementById('speakerButton');
    
    if (!textoRecebido) {
        console.log('⏳ Aguardando elemento texto-recebido...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🎙️ CONFIGURAÇÃO DE VOZ - APENAS TTS (FUNCIONA NO SAFARI)
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }

    // ⏱️ VARIÁVEIS DE ESTADO
    let isSpeechPlaying = false;

    // 🆕 SAFARI: USA A INTERFACE JÁ CRIADA PELO RECEIVER-UI.JS
    function integrarComSafariUI() {
        console.log('🔗 Integrando com interface Safari existente...');
        
        // 🆕 VERIFICA SE O CHAT JÁ FOI CRIADO PELO RECEIVER-UI.JS
        const safariChat = document.getElementById('safariChatContainer');
        const inputTexto = document.getElementById('inputTextoSafari');
        const btnEnviar = document.getElementById('btnEnviarSafari');
        const btnDitado = document.getElementById('btnDitadoSafari');
        
        if (!safariChat || !inputTexto || !btnEnviar) {
            console.log('⏳ Aguardando interface Safari ser criada...');
            setTimeout(integrarComSafariUI, 500);
            return;
        }
        
        console.log('✅ Interface Safari encontrada, configurando eventos...');
        
        // 🆕 CONFIGURA ENVIO DE MENSAGENS
        function enviarMensagemSafari() {
            const inputTexto = document.getElementById('inputTextoSafari');
            const mensagem = inputTexto.value.trim();
            
            if (!mensagem) return;
            
            console.log('📤 Enviando mensagem via texto Safari:', mensagem);
            
            // ✅ TRADUZ PRIMEIRO
            translateText(mensagem).then(translatedText => {
                if (translatedText && translatedText.trim() !== "") {
                    console.log(`🌐 Traduzido Safari: "${mensagem}" → "${translatedText}"`);
                    
                    // ✅ ENVIA VIA WEBRTC
                    if (window.rtcCore && window.rtcCore.dataChannel && 
                        window.rtcCore.dataChannel.readyState === 'open') {
                        window.rtcCore.dataChannel.send(translatedText);
                        console.log('✅ Texto traduzido enviado via WebRTC');
                        
                        // ✅ FEEDBACK VISUAL
                        inputTexto.value = '';
                        inputTexto.placeholder = '✓ Mensagem enviada!';
                        setTimeout(() => {
                            inputTexto.placeholder = 'Digite sua mensagem...';
                        }, 2000);
                        
                    } else {
                        console.log('❌ Canal WebRTC não disponível');
                        inputTexto.placeholder = '❌ Sem conexão...';
                        setTimeout(() => {
                            inputTexto.placeholder = 'Digite sua mensagem...';
                        }, 2000);
                    }
                } else {
                    console.log('❌ Tradução falhou');
                    inputTexto.placeholder = '❌ Erro tradução...';
                    setTimeout(() => {
                        inputTexto.placeholder = 'Digite sua mensagem...';
                    }, 2000);
                }
            }).catch(error => {
                console.error('❌ Erro na tradução Safari:', error);
                inputTexto.placeholder = '❌ Erro...';
                setTimeout(() => {
                    inputTexto.placeholder = 'Digite sua mensagem...';
                }, 2000);
            });
        }
        
        // 🆕 CONFIGURA EVENTOS NA INTERFACE EXISTENTE
        btnEnviar.addEventListener('click', enviarMensagemSafari);
        
        inputTexto.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                enviarMensagemSafari();
            }
        });
        
        // 🆕 BOTÃO DE DITADO - FOCA NO INPUT
        if (btnDitado) {
            btnDitado.addEventListener('click', function() {
                inputTexto.focus();
                inputTexto.select();
                console.log('⌨️ Ativando teclado Safari');
            });
        }
        
        console.log('✅ Eventos Safari configurados com sucesso');
    }

    // 🔊 SISTEMA DE VOZ - TTS (FUNCIONA NO SAFARI)
    function speakText(text) {
        if (!SpeechSynthesis || !text) {
            console.log('❌ SpeechSynthesis não disponível ou texto vazio');
            return;
        }
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.lang = window.meuIdiomaRemoto || 'en-US';
        utterance.rate = 0.9;
        utterance.volume = 0.8;
        
        utterance.onstart = function() {
            isSpeechPlaying = true;
            if (speakerButton) speakerButton.textContent = '⏹';
            console.log('🔊 Iniciando fala do texto (Safari)');
        };
        
        utterance.onend = function() {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.log('🔊 Fala terminada (Safari)');
        };
        
        utterance.onerror = function(event) {
            isSpeechPlaying = false;
            if (speakerButton) speakerButton.textContent = '🔊';
            console.error('❌ Erro na fala (Safari):', event.error);
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
            console.log('⏹ Fala cancelada (Safari)');
        } else {
            if (textoRecebido && textoRecebido.textContent) {
                const textToSpeak = textoRecebido.textContent.trim();
                if (textToSpeak !== "") {
                    console.log(`🔊 Falando texto (Safari): "${textToSpeak.substring(0, 50)}..."`);
                    speakText(textToSpeak);
                } else {
                    console.log('⚠️ Nenhum texto para falar');
                }
            } else {
                console.log('⚠️ Elemento texto-recebido não encontrado');
            }
        }
    }

    // 🎮 EVENTOS DE BOTÃO (SAFARI MODE)
    if (speakerButton) {
        speakerButton.addEventListener('click', function() {
            console.log('🔊 Botão speaker - alternando fala (Safari)');
            toggleSpeech();
        });
    }

    // 🆕 ESCONDE BOTÃO DE GRAVAÇÃO (NÃO FUNCIONA NO SAFARI)
    if (recordButton) {
        recordButton.style.display = 'none';
        console.log('🎤 Botão de gravação desativado (Safari)');
    }

    // 🆕 INTEGRA COM A INTERFACE JÁ CRIADA
    setTimeout(integrarComSafariUI, 1000);

    // ✅ CONFIGURAÇÃO FINAL SAFARI
    console.log(`🎯 Tradutor receiver Safari configurado: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado Safari:', {
        recordButton: 'DESATIVADO',
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore,
        dataChannel: window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'não disponível'
    });
}

// ✅ INICIALIZAÇÃO ROBUSTA
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor receiver Safari...');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeTranslator, 1500);
        });
    } else {
        setTimeout(initializeTranslator, 1500);
    }
}

// 🆕 DETECÇÃO AUTOMÁTICA DE SAFARI
function isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || 
           /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// 🆕 INICIALIZAÇÃO CONDICIONAL
if (isSafari()) {
    console.log('📱 Safari detectado - inicializando modo compatível');
    startTranslatorSafely();
} else {
    console.log('🤖 Navegador não-Safari detectado - tradutor normal será carregado');
    // Não faz nada - o tradutor normal do Android/Chrome será usado
}

console.log('✅ receiver-trz.js Safari carregado - Modo Integrado');
