import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let somDigitacao = null;
let audioCarregado = false;
let permissaoConcedida = false;

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

// 🎤 SOLICITAR TODAS AS PERMISSÕES DE UMA VEZ
async function solicitarTodasPermissoes() {
    try {
        console.log('🎯 Solicitando todas as permissões...');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        console.log('✅ Todas as permissões concedidas!');
        
        stream.getTracks().forEach(track => track.stop());
        
        permissaoConcedida = true;
        window.permissoesConcedidas = true;
        window.audioContext = audioContext;
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro nas permissões:', error);
        permissaoConcedida = false;
        window.permissoesConcedidas = false;
        throw error;
    }
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

// ✅ FUNÇÃO PARA LIBERAR INTERFACE (FALLBACK)
function liberarInterfaceFallback() {
    console.log('🔓 Usando fallback para liberar interface...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('✅ Tela de loading removida');
    }
    
    const elementosEscondidos = document.querySelectorAll('.hidden-until-ready');
    elementosEscondidos.forEach(elemento => {
        elemento.style.display = '';
    });
    
    console.log(`✅ ${elementosEscondidos.length} elementos liberados`);
}

// ✅ FUNÇÃO PARA INICIAR CÂMERA APÓS PERMISSÕES
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        let localStream = stream;

        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }

        window.rtcCore = new WebRTCCore();

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

        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        window.rtcCore.setDataChannelCallback((mensagem) => {
            iniciarSomDigitacao();

            console.log('📩 Mensagem recebida:', mensagem);

            const elemento = document.getElementById('texto-recebido');
            const imagemImpaciente = document.getElementById('lemurFixed');
            
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
                elemento.style.transition = 'opacity 0.5s ease';
                
                elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elemento.style.border = '2px solid #ff0000';
            }

            if (imagemImpaciente) {
                imagemImpaciente.style.display = 'block';
            }

            if (window.SpeechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(mensagem);
                utterance.lang = window.targetTranslationLang || 'pt-BR';
                utterance.rate = 0.9;
                utterance.volume = 0.8;

                utterance.onstart = () => {
                    pararSomDigitacao();
                    
                    if (elemento) {
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = '';
                        elemento.style.border = '';
                        elemento.textContent = mensagem;
                    }

                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                };

                utterance.onend = () => {
                    console.log('🔚 Voz terminada');
                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                };

                utterance.onerror = () => {
                    pararSomDigitacao();
                    
                    console.log('❌ Erro na voz');
                    if (elemento) {
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = '';
                        elemento.style.border = '';
                    }
                    if (imagemImpaciente) {
                        imagemImpaciente.style.display = 'none';
                    }
                };

                window.speechSynthesis.speak(utterance);
            }
        });

        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller fala:', idiomaDoCaller);
            console.log('🎯 Eu (notificador) entendo:', lang);

            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
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

        setTimeout(() => {
            if (typeof initializeTranslator === 'function') {
                initializeTranslator();
            }
        }, 1000);

    } catch (error) {
        console.error("Erro ao iniciar câmera:", error);
        throw error;
    }
}

window.onload = async () => {
    try {
        // ✅ BOTÃO ÚNICO PARA TODAS AS PERMISSÕES
        const permissaoButton = document.createElement('button');
        permissaoButton.innerHTML = `
            <span style="font-size: 32px;">🎤📹🎧</span><br>
            <span style="font-size: 14px;">Clique para ativar<br>Microfone, Câmera e Áudio</span>
        `;
        permissaoButton.style.position = 'fixed';
        permissaoButton.style.top = '50%';
        permissaoButton.style.left = '50%';
        permissaoButton.style.transform = 'translate(-50%, -50%)';
        permissaoButton.style.zIndex = '10000';
        permissaoButton.style.padding = '25px 35px';
        permissaoButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        permissaoButton.style.color = 'white';
        permissaoButton.style.border = 'none';
        permissaoButton.style.borderRadius = '20px';
        permissaoButton.style.cursor = 'pointer';
        permissaoButton.style.fontSize = '16px';
        permissaoButton.style.fontWeight = 'bold';
        permissaoButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        permissaoButton.style.textAlign = 'center';
        permissaoButton.style.lineHeight = '1.4';
        permissaoButton.style.transition = 'all 0.3s ease';
        
        permissaoButton.onmouseover = () => {
            permissaoButton.style.transform = 'translate(-50%, -50%) scale(1.05)';
            permissaoButton.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4)';
        };
        
        permissaoButton.onmouseout = () => {
            permissaoButton.style.transform = 'translate(-50%, -50%)';
            permissaoButton.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        };
        
        permissaoButton.onclick = async () => {
            try {
                permissaoButton.innerHTML = '<span style="font-size: 24px;">⏳</span><br><span style="font-size: 12px;">Solicitando permissões...</span>';
                permissaoButton.style.background = '#ff9800';
                permissaoButton.disabled = true;
                
                // 1. Primeiro: Inicia áudio
                iniciarAudio();
                
                // 2. Segundo: Carrega sons
                await carregarSomDigitacao();
                
                // 3. Terceiro: Solicita TODAS as permissões (câmera + microfone)
                await solicitarTodasPermissoes();
                
                // 4. Quarto: Remove botão
                permissaoButton.remove();
                
                // 5. Quinto: Libera interface (com fallback)
                if (typeof window.liberarInterface === 'function') {
                    window.liberarInterface();
                    console.log('✅ Interface liberada via função global');
                } else {
                    liberarInterfaceFallback();
                    console.log('✅ Interface liberada via fallback');
                }
                
                // 6. Sexto: Inicia câmera e WebRTC
                await iniciarCameraAposPermissoes();
                
                console.log('✅ Fluxo completo concluído com sucesso!');
                
            } catch (error) {
                console.error('❌ Erro no fluxo:', error);
                
                if (typeof window.mostrarErroCarregamento === 'function') {
                    window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
                } else {
                    console.error('❌ Erro no carregamento:', error);
                }
                
                permissaoButton.innerHTML = `
                    <span style="font-size: 32px;">❌</span><br>
                    <span style="font-size: 12px;">Erro nas permissões<br>Clique para tentar novamente</span>
                `;
                permissaoButton.style.background = '#f44336';
                permissaoButton.disabled = false;
                
                alert('Por favor, permita o acesso à câmera e microfone para usar o aplicativo.');
            }
        };
        
        document.body.appendChild(permissaoButton);

    } catch (error) {
        console.error("Erro ao inicializar:", error);
        alert("Erro ao inicializar a aplicação.");
        return;
    }
};
