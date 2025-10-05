import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;

// 🎵 CARREGAR SOM DE DIGITAÇÃO
function carregarSomDigitacao() {
    return new Promise((resolve) => {
        try {
            somDigitacao = new Audio('assets/audio/keyboard.mp3');
            somDigitacao.volume = 0.3;
            somDigitacao.preload = 'auto';
            
            somDigitacao.addEventListener('canplaythrough', () => {
                console.log('🎵 Áudio de digitação carregado');
                audioCarregado = true;
                resolve(true);
            });
            
            somDigitacao.addEventListener('error', () => {
                console.log('❌ Erro ao carregar áudio');
                resolve(false);
            });
            
            somDigitacao.load();
            
        } catch (error) {
            console.log('❌ Erro no áudio:', error);
            resolve(false);
        }
    });
}

// 🎵 INICIAR LOOP DE DIGITAÇÃO
function iniciarSomDigitacao() {
    if (!audioCarregado || !somDigitacao) return;
    
    pararSomDigitacao();
    
    try {
        somDigitacao.loop = true;
        somDigitacao.currentTime = 0;
        somDigitacao.play().catch(error => {
            console.log('🔇 Navegador bloqueou áudio automático');
        });
        
        console.log('🎵 Som de digitação iniciado');
    } catch (error) {
        console.log('❌ Erro ao tocar áudio:', error);
    }
}

// 🎵 PARAR SOM DE DIGITAÇÃO
function pararSomDigitacao() {
    if (somDigitacao) {
        try {
            somDigitacao.pause();
            somDigitacao.currentTime = 0;
            somDigitacao.loop = false;
            console.log('🎵 Som de digitação parado');
        } catch (error) {
            console.log('❌ Erro ao parar áudio:', error);
        }
    }
}

// 🎵 INICIAR ÁUDIO APÓS INTERAÇÃO DO USUÁRIO
function iniciarAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.value = 0.001;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
    
    console.log('🎵 Áudio desbloqueado!');
}

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;

  try {
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
    return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
  } catch (error) {
    console.error('Erro ao carregar JSON de bandeiras:', error);
    const fallback = {
      'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
      'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
      'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
    };
    return fallback[lang] || 'en-US';
  }
}

// 🌐 Tradução apenas para texto
async function translateText(text, targetLang) {
  try {
    const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });

    const result = await response.json();
    return result.translatedText || text;
  } catch (error) {
    console.error('Erro na tradução:', error);
    return text;
  }
}

// 🏳️ Aplica bandeira do idioma local
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        const localLangElement = document.querySelector('.local-mic-Lang');
        if (localLangElement) localLangElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

    } catch (error) {
        console.error('Erro ao carregar bandeira local:', error);
    }
}

// 🏳️ Aplica bandeira do idioma remoto
async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        console.error('Erro ao carregar bandeira remota:', error);
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (CORRIGIDA)
function liberarInterfaceFallback() {
    console.log('🔓 Removendo tela de loading...');
    
    const loadingSelectors = [
        '#loadingScreen',
        '.loading',
        '.loader',
        '#loader',
        '.spinner',
        '#spinner',
        '.loading-screen',
        '#mobileLoading'
    ];
    
    loadingSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            element.style.display = 'none';
            console.log(`✅ Loading removido: ${selector}`);
        }
    });
    
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
}

// 🎤 FUNÇÃO GOOGLE TTS SEPARADA
async function falarComGoogleTTS(mensagem, elemento) {
    try {
        console.log('🎤 Iniciando Google TTS para:', mensagem.substring(0, 50) + '...');
        
        const resposta = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: window.targetTranslationLang || 'pt-BR',
                gender: 'FEMALE'
            })
        });

        if (!resposta.ok) {
            throw new Error('Erro na API de voz');
        }

        const blob = await resposta.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        
        // EVENTO: ÁUDIO COMEÇOU
        audio.onplay = () => {
            pararSomDigitacao();
            
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
                elemento.textContent = mensagem;
            }
            
            console.log('🔊 Áudio Google TTS iniciado');
        };
        
        // EVENTO: ÁUDIO TERMINOU
        audio.onended = () => {
            console.log('🔚 Áudio Google TTS terminado');
        };
        
        // EVENTO: ERRO NO ÁUDIO
        audio.onerror = () => {
            pararSomDigitacao();
            console.log('❌ Erro no áudio Google TTS');
            if (elemento) {
                elemento.style.animation = 'none';
                elemento.style.backgroundColor = '';
                elemento.style.border = '';
            }
        };

        await audio.play();
        
    } catch (error) {
        console.error('❌ Erro no Google TTS:', error);
    }
}

// ✅✅✅ CONEXÃO WEBRTC ROBUSTA (APENAS VÍDEO - SEM ÁUDIO)
async function iniciarConexaoWebRTCAntiga(localStream) {
    try {
        console.log('🌐 INICIANDO CONEXÃO WEBRTC (APENAS VÍDEO)...');
        
        // ✅ INICIALIZA WEBRTC
        window.rtcCore = new WebRTCCore();

        // ✅ EXTRAI PARÂMETROS DA URL
        const url = window.location.href;
        const urlParts = url.split('?');
        const queryParams = urlParts[1] ? urlParts[1].split('&') : [];
        
        const myId = queryParams[0] && !queryParams[0].includes('=') 
            ? queryParams[0] 
            : crypto.randomUUID().substr(0, 8);

        let lang = 'pt-BR';
        const langParam = queryParams.find(param => param.startsWith('lang='));
        if (langParam) {
            lang = langParam.split('=')[1];
        }

        window.targetTranslationLang = lang;

        // ✅✅✅ CONFIGURAÇÃO DO DATACHANNEL (APENAS TEXTO)
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            console.log('📩 Mensagem de texto recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
                elemento.style.transition = 'opacity 0.5s ease';
                
                elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elemento.style.border = '2px solid #ff0000';
            }

            // 🎤 USA GOOGLE TTS (SÍNTESE DE VOZ - NÃO É A VOZ DO USUÁRIO)
            await falarComGoogleTTS(mensagem, elemento);
        });

        // ✅✅✅ CONFIGURAÇÃO DO INCOMING CALL
        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu (notificador) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                // ✅ WEBRTC APENAS VÍDEO - DESABILITA ÁUDIO REMOTO
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);

                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) {
                    remoteVideo.srcObject = remoteStream;
                }

                window.targetTranslationLang = idiomaDoCaller || lang;
                console.log('🎯 Idioma definido para tradução:', window.targetTranslationLang);

                if (idiomaDoCaller) {
                    aplicarBandeiraRemota(idiomaDoCaller);
                } else {
                    const remoteLangElement = document.querySelector('.remoter-Lang');
                    if (remoteLangElement) remoteLangElement.textContent = '🔴';
                }
            });
        };

        // ✅✅✅ INICIALIZAÇÃO
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        console.log('✅ WebRTC inicializado com ID:', myId);

        // ✅ VERIFICA SE É RECEIVER E INICIA CONEXÃO AUTOMÁTICA
        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const receiverToken = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        if (receiverId) {
            console.log('🎯 Modo Receiver - Iniciando conexão com:', receiverId);
            
            // ✅ CONEXÃO DIRETA (APENAS VÍDEO)
            setTimeout(() => {
                if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
                    window.rtcCore.startCall(receiverId, localStream, lang);
                    console.log('📞 Chamada iniciada para:', receiverId);
                }
            }, 1000);
        }

        console.log('✅✅✅ CONEXÃO WEBRTC (APENAS VÍDEO) INICIALIZADA!');

    } catch (error) {
        console.error("❌ Erro na conexão WebRTC:", error);
        throw error;
    }
}

// ✅ SOLICITA PERMISSÕES (CORRIGIDA - SEM DESTRUIR STREAM)
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 Solicitando permissões de câmera...');
        
        // ✅ SOLICITA APENAS CÂMERA (NÃO PRECISA DE MICROFONE)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false  // ✅ APENAS VÍDEO - NÃO PRECISA DE MICROFONE
        });
        
        console.log('✅ Permissões de câmera concedidas!');
        
        // ✅✅✅ CORREÇÃO: NÃO DESTRÓI O STREAM
        // NÃO FAZ: stream.getTracks().forEach(track => track.stop());
        
        return stream; // ✅ RETORNA STREAM PARA REUTILIZAR
        
    } catch (error) {
        console.error('❌ Erro nas permissões:', error);
        throw error;
    }
}

// ✅ FUNÇÃO PARA INICIAR CÂMERA (APENAS VÍDEO)
async function iniciarCameraComStream(stream) {
    try {
        console.log('📹 Iniciando câmera (apenas vídeo)...');

        // ✅ REUTILIZA o stream de vídeo
        window.localStream = stream;

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        // ✅ INICIA CONEXÃO WEBRTC (APENAS VÍDEO)
        await iniciarConexaoWebRTCAntiga(stream);

        // ✅ CONFIGURA TRADUÇÕES
        const url = window.location.href;
        const urlParts = url.split('?');
        const queryParams = urlParts[1] ? urlParts[1].split('&') : [];
        
        let lang = 'pt-BR';
        const langParam = queryParams.find(param => param.startsWith('lang='));
        if (langParam) {
            lang = langParam.split('=')[1];
        }

        const frasesParaTraduzir = {
            "translator-label": "Real-time translation."
        };

        (async () => {
            for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
                const el = document.getElementById(id);
                if (el) {
                    const traduzido = await translateText(texto, lang);
                    el.textContent = traduzido;
                }
            }
        })();

        aplicarBandeiraLocal(lang);

        console.log('✅ Câmera e WebRTC (apenas vídeo) iniciados!');

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        throw error;
    }
}

// 🛡️ TRATAMENTO DE ERRO
function mostrarErroPermissoes() {
    console.log('❌ Mostrando erro de permissões...');
    
    liberarInterfaceFallback();
    
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        text-align: center;
        padding: 20px;
    `;
    
    errorDiv.innerHTML = `
        <div style="background: #f44336; padding: 30px; border-radius: 15px; max-width: 400px;">
            <h3 style="margin: 0 0 15px 0;">Permissão de Câmera Necessária</h3>
            <p style="margin: 0 0 20px 0;">Por favor, permita acesso à câmera para usar o aplicativo.</p>
            <button onclick="location.reload()" style="
                background: white;
                color: #f44336;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
            ">Tentar Novamente</button>
        </div>
    `;
    
    document.body.appendChild(errorDiv);
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA CORRIGIDA
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação (apenas vídeo)...');
        
        // 1. Pré-carrega recursos
        await carregarSomDigitacao();
        iniciarAudio(); // Desbloqueia áudio do navegador
        
        // 2. ✅ SOLICITA APENAS CÂMERA (NÃO PRECISA DE MICROFONE)
        const stream = await solicitarTodasPermissoes();
        
        console.log('✅ Permissões concedidas!');
        
        // 3. ✅ Remove loading
        liberarInterfaceFallback();
        
        // 4. ✅ Inicia câmera COM O MESMO STREAM
        await iniciarCameraComStream(stream);
        
        console.log('✅ Aplicação iniciada (WebRTC apenas vídeo)!');
        
    } catch (error) {
        console.error('❌ Erro ao solicitar permissões:', error);
        
        liberarInterfaceFallback();
        mostrarErroPermissoes();
    }
};
