// ===== TRADUTOR SAFARI COMPATIBLE - SEM RECONHECIMENTO DE VOZ =====

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

// ===== INICIALIZAÇÃO DO TRADUTOR SAFARI =====
function initializeTranslator() {
    console.log('🎯 Iniciando tradutor receiver (Safari Mode)...');

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

    // 🎤 ELEMENTOS VISUAIS - SAFARI MODE
    const recordButton = document.getElementById('recordButton');
    const textoRecebido = document.getElementById('texto-recebido');
    const speakerButton = document.getElementById('speakerButton');
    
    if (!recordButton || !textoRecebido) {
        console.log('⏳ Aguardando elementos do tradutor...');
        setTimeout(initializeTranslator, 300);
        return;
    }

    // 🆕 🆕 🆕 SAFARI: REMOVE RECONHECIMENTO DE VOZ, MANTÉM APENAS TTS
    console.log('📱 Safari Mode: Desativando reconhecimento de voz');

    // 🎙️ CONFIGURAÇÃO DE VOZ - APENAS TTS (FUNCIONA NO SAFARI)
    const SpeechSynthesis = window.speechSynthesis;
    
    if (!SpeechSynthesis && speakerButton) {
        console.log('❌ SpeechSynthesis não suportado');
        speakerButton.style.display = 'none';
    }

    // ⏱️ VARIÁVEIS DE ESTADO (SIMPLIFICADAS)
    let isSpeechPlaying = false;
    let lastTranslationTime = 0;

    // 🆕 🆕 🆕 SAFARI: SISTEMA DE ENVIO VIA TEXTO
    function setupSafariTextInput() {
        console.log('⌨️ Configurando sistema de texto Safari...');
        
        // 🆕 Cria elementos de input se não existirem
        let inputContainer = document.getElementById('safariInputContainer');
        if (!inputContainer) {
            inputContainer = document.createElement('div');
            inputContainer.id = 'safariInputContainer';
            inputContainer.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 10px;
                right: 10px;
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                padding: 10px;
                display: flex;
                gap: 10px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
            `;
            
            const inputTexto = document.createElement('input');
            inputTexto.id = 'safariTextInput';
            inputTexto.type = 'text';
            inputTexto.placeholder = 'Digite sua mensagem...';
            inputTexto.style.cssText = `
                flex: 1;
                border: none;
                background: transparent;
                padding: 8px 12px;
                font-size: 16px;
                outline: none;
            `;
            
            const btnEnviar = document.createElement('button');
            btnEnviar.id = 'safariSendButton';
            btnEnviar.textContent = '📤';
            btnEnviar.style.cssText = `
                background: #007AFF;
                border: none;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                color: white;
                font-size: 18px;
                cursor: pointer;
            `;
            
            inputContainer.appendChild(inputTexto);
            inputContainer.appendChild(btnEnviar);
            document.body.appendChild(inputContainer);
            
            console.log('✅ Elementos de texto Safari criados');
            
            // 🆕 Configura eventos
            inputTexto.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    enviarMensagemSafari();
                }
            });
            
            btnEnviar.addEventListener('click', enviarMensagemSafari);
        }
        
        // 🆕 Esconde botão de gravação (não funciona no Safari)
        if (recordButton) {
            recordButton.style.display = 'none';
        }
    }

    // 🆕 🆕 🆕 FUNÇÃO PARA ENVIAR MENSAGEM VIA TEXTO (SAFARI)
    function enviarMensagemSafari() {
        const inputTexto = document.getElementById('safariTextInput');
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
                    alert('Conexão não estabelecida. Aguarde o parceiro conectar.');
                }
            } else {
                console.log('❌ Tradução falhou');
            }
        }).catch(error => {
            console.error('❌ Erro na tradução Safari:', error);
        });
    }

    // 🔊 SISTEMA DE VOZ - TTS (FUNCIONA NO SAFARI)
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

    // 🎮 EVENTOS DE BOTÃO (SAFARI MODE)
    if (speakerButton) {
        speakerButton.addEventListener('click', function() {
            console.log('🔊 Botão speaker - alternando fala (Safari)');
            toggleSpeech();
        });
    }

    // 🆕 🆕 🆕 INICIALIZA SISTEMA DE TEXTO SAFARI
    setupSafariTextInput();

    // ✅ CONFIGURAÇÃO FINAL SAFARI
    console.log(`🎯 Tradutor receiver Safari completamente configurado: ${window.meuIdiomaLocal} → ${window.meuIdiomaRemoto}`);
    console.log('🔍 Estado final Safari:', {
        recordButton: 'DESATIVADO (Safari)',
        speakerButton: !!speakerButton,
        textoRecebido: !!textoRecebido,
        rtcCore: !!window.rtcCore,
        dataChannel: window.rtcCore ? window.rtcCore.dataChannel?.readyState : 'não disponível',
        safariInput: '✅ ATIVO'
    });
}

// ✅ INICIALIZAÇÃO ROBUSTA COM VERIFICAÇÃO
function startTranslatorSafely() {
    console.log('🚀 Iniciando tradutor receiver Safari com verificação de segurança...');
    
    // Verifica se o DOM está pronto
    if (document.readyState === 'loading') {
        console.log('⏳ DOM ainda carregando...');
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initializeTranslator, 1000);
        });
    } else {
        console.log('✅ DOM já carregado, iniciando tradutor Safari...');
        setTimeout(initializeTranslator, 1000);
    }
}

// Inicia o tradutor de forma segura
startTranslatorSafely();

// 🆕 🆕 🆕 FUNÇÃO GLOBAL PARA RECEBER MENSAGENS (COMPATIBILIDADE)
window.receberMensagemTraduzida = function(mensagem) {
    console.log('📩 Mensagem recebida no tradutor Safari:', mensagem);
    
    const textoRecebido = document.getElementById('texto-recebido');
    if (textoRecebido) {
        textoRecebido.textContent = mensagem;
        textoRecebido.style.opacity = '1';
        
        // Efeito visual de nova mensagem
        textoRecebido.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
        textoRecebido.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        textoRecebido.style.border = '2px solid #ff0000';
        
        setTimeout(() => {
            textoRecebido.style.animation = 'none';
            textoRecebido.style.backgroundColor = '';
            textoRecebido.style.border = '';
        }, 3000);
    }
};

console.log('✅ receiver-trz.js Safari carregado - Modo Texto Ativado');
