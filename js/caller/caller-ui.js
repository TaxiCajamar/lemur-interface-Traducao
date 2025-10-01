// 📦 Importa o núcleo WebRTC
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

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
  if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
    window.rtcDataChannel.send(texto);
    console.log('✅ Texto enviado:', texto);
  } else {
    console.log('⏳ Canal não disponível ainda. Tentando novamente...');
    setTimeout(() => enviarParaOutroCelular(texto), 1000);
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

// 🔔 FUNÇÃO: Notificação SIMPLES para acordar receiver
async function enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma) {
  try {
    console.log('🔔 Enviando notificação para acordar receiver...');
    
    const response = await fetch('https://serve-app-e9ia.onrender.com/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: receiverToken,
        title: '📞 Nova Chamada',
        body: `Toque para atender a chamada`,
        data: {
          type: 'wake_up',
          callerId: meuId,
          callerLang: meuIdioma
        }
      })
    });

    const result = await response.json();
    console.log('✅ Notificação enviada:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação:', error);
    return false;
  }
}

// 📞 FUNÇÃO: Criar tela de chamada visual (sem textos)
function criarTelaChamando() {
  const telaChamada = document.createElement('div');
  telaChamada.id = 'tela-chamando';
  telaChamada.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: white;
  `;

  telaChamada.innerHTML = `
    <div style="text-align: center; animation: pulse 2s infinite;">
      <div style="font-size: 80px; margin-bottom: 20px;">📞</div>
      <div style="font-size: 24px; margin-bottom: 40px; opacity: 0.9;">•••</div>
    </div>
    
    <div id="botao-cancelar" style="
      position: absolute;
      bottom: 60px;
      background: #ff4444;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    ">
      ✕
    </div>

    <style>
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    </style>
  `;

  document.body.appendChild(telaChamada);

  document.getElementById('botao-cancelar').addEventListener('click', function() {
    telaChamada.remove();
    window.conexaoCancelada = true;
    console.log('❌ Chamada cancelada pelo usuário');
  });

  return telaChamada;
}

// 🔄 FUNÇÃO UNIFICADA: Tentar conexão visual (COM ESPERA INTELIGENTE)
async function iniciarConexaoVisual(receiverId, receiverToken, meuId, localStream, meuIdioma) {
  console.log('🚀 Iniciando fluxo visual de conexão...');
  
  let conexaoEstabelecida = false;
  let notificacaoEnviada = false;
  window.conexaoCancelada = false;
  
  // ✅ AGUARDA O WEBRTC ESTAR COMPLETAMENTE INICIALIZADO
  console.log('⏳ Aguardando inicialização completa do WebRTC...');
  
  // Função para verificar se o WebRTC está pronto
  const aguardarWebRTCPronto = () => {
    return new Promise((resolve) => {
      const verificar = () => {
        if (window.rtcCore && window.rtcCore.isInitialized && typeof window.rtcCore.startCall === 'function') {
          console.log('✅ WebRTC completamente inicializado');
          resolve(true);
        } else {
          console.log('⏳ Aguardando WebRTC...');
          setTimeout(verificar, 500);
        }
      };
      verificar();
    });
  };

  try {
    // Aguarda o WebRTC estar pronto antes de qualquer tentativa
    await aguardarWebRTCPronto();

    console.log('🔇 Fase 1: Tentativas silenciosas (6s)');
    
    let tentativasFase1 = 3;
    const tentarConexaoSilenciosa = async () => {
      if (conexaoEstabelecida || window.conexaoCancelada) return;
      
      if (tentativasFase1 > 0) {
        console.log(`🔄 Tentativa silenciosa ${4 - tentativasFase1}`);
        
        // ✅ VERIFICAÇÃO EXTRA ANTES DE CHAMAR
        if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
          window.rtcCore.startCall(receiverId, localStream, meuIdioma);
        } else {
          console.log('⚠️ WebRTC não está pronto, aguardando...');
        }
        
        tentativasFase1--;
        setTimeout(tentarConexaoSilenciosa, 2000);
      } else {
        console.log('📞 Fase 2: Mostrando tela de chamada');
        const telaChamada = criarTelaChamando();
        
        if (!notificacaoEnviada) {
          console.log('📨 Enviando notificação wake-up...');
          notificacaoEnviada = await enviarNotificacaoWakeUp(receiverToken, receiverId, meuId, meuIdioma);
        }
        
        const tentarConexaoContinuamente = async () => {
          if (conexaoEstabelecida || window.conexaoCancelada) return;
          
          console.log('🔄 Tentando conexão...');
          
          // ✅ VERIFICAÇÃO SEMPRE ANTES DE TENTAR
          if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
            window.rtcCore.startCall(receiverId, localStream, meuIdioma);
          }
          
          setTimeout(tentarConexaoContinuamente, 3000);
        };
        
        tentarConexaoContinuamente();
      }
    };
    
    // ✅ PEQUENO ATRASO PARA GARANTIR ESTABILIDADE
    setTimeout(() => {
      tentarConexaoSilenciosa();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro no fluxo de conexão:', error);
  }
  
  window.rtcCore.setRemoteStreamCallback(stream => {
    conexaoEstabelecida = true;
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const telaChamada = document.getElementById('tela-chamando');
    if (telaChamada) telaChamada.remove();
    
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    if (remoteVideo) remoteVideo.srcObject = stream;
  });
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

// ✅ FUNÇÃO PARA INICIAR CÂMERA APÓS PERMISSÕES (COM ESPERA MELHORADA)
async function iniciarCameraAposPermissoes() {
    try {
        if (!permissaoConcedida) {
            throw new Error('Permissões não concedidas');
        }

        console.log('📹 Iniciando câmera...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        
        let localStream = stream;
        document.getElementById('localVideo').srcObject = localStream;
        console.log('✅ Câmera iniciada com sucesso');

        // ✅ PEQUENA PAUSA PARA ESTABILIZAR
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log('🌐 Inicializando WebRTC...');
        window.rtcCore = new WebRTCCore();

        // Configura callbacks ANTES de inicializar
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

        const myId = crypto.randomUUID().substr(0, 8);
        document.getElementById('myId').textContent = myId;

        console.log('🔌 Inicializando socket handlers...');
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ MARCA QUE O WEBRTC ESTÁ INICIALIZADO
        window.rtcCore.isInitialized = true;
        console.log('✅ WebRTC inicializado com ID:', myId);

        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        const receiverToken = urlParams.get('token') || '';
        const receiverLang = urlParams.get('lang') || 'pt-BR';

        window.receiverInfo = {
          id: receiverId,
          token: receiverToken,
          lang: receiverLang
        };

        // ✅ SÓ INICIA CONEXÃO SE TIVER receiverId E APÓS TUDO ESTAR PRONTO
        if (receiverId) {
          document.getElementById('callActionBtn').style.display = 'none';
          
          if (localStream) {
            const meuIdioma = await obterIdiomaCompleto(navigator.language);
            
            // ✅ PEQUENO ATRASO PARA GARANTIR QUE TUDO ESTÁ ESTÁVEL
            setTimeout(() => {
              iniciarConexaoVisual(receiverId, receiverToken, myId, localStream, meuIdioma);
            }, 1000);
          }
        }

        const navegadorLang = await obterIdiomaCompleto(navigator.language);

        const frasesParaTraduzir = {
          "translator-label": "Real-time translation."
        };

        (async () => {
          for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
            const el = document.getElementById(id);
            if (el) {
              const traduzido = await translateText(texto, navegadorLang);
              el.textContent = traduzido;
            }
          }
        })();

        aplicarBandeiraLocal(navegadorLang);
        aplicarBandeiraRemota(receiverLang);

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
    console.error("Erro ao inicializar aplicação:", error);
    alert("Erro ao inicializar a aplicação.");
  }
};
