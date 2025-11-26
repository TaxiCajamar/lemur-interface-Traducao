// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../../core/webrtc-core.js';
import { CameraVigilante } from '../../core/camera-vigilante.js';
import { ttsHibrido } from '../../core/tts-hibrido.js';

// 🎵 VARIÁVEIS DE ÁUDIO
let audioContext = null;
let permissaoConcedida = false;

// 🎯 CONTROLE DO TOGGLE DAS INSTRUÇÕES
function setupInstructionToggle() {
    const instructionBox = document.getElementById('instructionBox');
    const toggleButton = document.getElementById('instructionToggle');
    
    if (!instructionBox || !toggleButton) return;
    
    let isExpanded = true;
    
    toggleButton.addEventListener('click', function(e) {
        e.stopPropagation();
        
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            instructionBox.classList.remove('recolhido');
            instructionBox.classList.add('expandido');
            console.log('📖 Instruções expandidas');
        } else {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            console.log('📖 Instruções recolhidas');
        }
    });
    
    document.addEventListener('click', function(e) {
        if (!instructionBox.contains(e.target) && isExpanded) {
            instructionBox.classList.remove('expandido');
            instructionBox.classList.add('recolhido');
            isExpanded = false;
            console.log('📖 Instruções fechadas (clique fora)');
        }
    });
}

// 🌐 TRADUÇÃO DAS FRASES FIXAS
async function traduzirFrasesFixas() {
  try {
    const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
    
    console.log(`🌐 Traduzindo frases fixas para: ${idiomaExato}`);

    const frasesParaTraduzir = {
        "translator-label": "Real-time translation.",
        "translator-label-2": "Real-time translation.",
        "welcome-text": "Welcome! Let's begin.",
        "wait-connection": "Waiting for connection.",
        "both-connected": "Both online.",
        "drop-voice": "Speak clearly.",
        "check-replies": "Read the message.",
        "flip-cam": "Flip the camera. Share!"
    };

    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, idiomaExato);
        el.textContent = traduzido;
        console.log(`✅ Traduzido: ${texto} → ${traduzido}`);
      }
    }

    console.log('✅ Frases fixas traduzidas com sucesso');

  } catch (error) {
    console.error("❌ Erro ao traduzir frases fixas:", error);
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
    const response = await fetch('https://chat-tradutor-7umw.onrender.com/translate', {
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
    
    const response = await fetch('https://serve-app-xq9p.onrender.com/send-notification', {
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

// 📞 FUNÇÃO: Criar tela de chamada visual COM IMAGEM DO LEMUR
function criarTelaChamando() {
  // Primeiro, mostra a imagem do lemur
  const lemurWaiting = document.getElementById('lemurWaiting');
  if (lemurWaiting) {
    lemurWaiting.style.display = 'block';
  }

  const telaChamada = document.createElement('div');
  telaChamada.id = 'tela-chamando';
  telaChamada.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(102, 126, 234, 0.3);
    z-index: 9997;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;

  telaChamada.innerHTML = `
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
      z-index: 9999;
    ">
      ✕
    </div>
  `;

  document.body.appendChild(telaChamada);

  document.getElementById('botao-cancelar').addEventListener('click', function() {
    if (lemurWaiting) {
      lemurWaiting.style.display = 'none';
    }
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
    await aguardarWebRTCPronto();

    console.log('🔇 Fase 1: Tentativas silenciosas (6s)');
    
    let tentativasFase1 = 3;
    const tentarConexaoSilenciosa = async () => {
      if (conexaoEstabelecida || window.conexaoCancelada) return;
      
      if (tentativasFase1 > 0) {
        console.log(`🔄 Tentativa silenciosa ${4 - tentativasFase1}`);
        
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
          
          if (window.rtcCore && typeof window.rtcCore.startCall === 'function') {
            window.rtcCore.startCall(receiverId, localStream, meuIdioma);
          }
          
          setTimeout(tentarConexaoContinuamente, 3000);
        };
        
        tentarConexaoContinuamente();
      }
    };
    
    setTimeout(() => {
      tentarConexaoSilenciosa();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro no fluxo de conexão:', error);
  }
  
  window.rtcCore.setRemoteStreamCallback(stream => {
    conexaoEstabelecida = true;
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const lemurWaiting = document.getElementById('lemurWaiting');
    if (lemurWaiting) {
        lemurWaiting.style.display = 'none';
    }
    
    const instructionBox = document.getElementById('instructionBox');
    if (instructionBox) {
        instructionBox.classList.remove('expandido');
        instructionBox.classList.add('recolhido');
        console.log('📖 Instruções fechadas (WebRTC conectado)');
    }
    
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
    
    const mobileLoading = document.getElementById('mobileLoading');
    if (mobileLoading) {
        mobileLoading.style.display = 'none';
        console.log('✅ Loader mobileLoading removido');
    }
    
    console.log('✅ Interface liberada via fallback');
}

// 🏳️ Aplica bandeira do idioma local
async function aplicarBandeiraLocal(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        window.meuIdiomaLocal = langCode;
        console.log('💾 Idioma local guardado:', window.meuIdiomaLocal);

        const languageFlagElement = document.querySelector('.language-flag');
        if (languageFlagElement) languageFlagElement.textContent = bandeira;

        const localLangDisplay = document.querySelector('.local-Lang');
        if (localLangDisplay) localLangDisplay.textContent = bandeira;

        console.log('🏳️ Bandeira local aplicada no CALLER:', bandeira, 'em duas posições');

    } catch (error) {
        console.error('Erro ao carregar bandeira local no caller:', error);
    }
}

// 🏳️ Aplica bandeira do idioma remota
async function aplicarBandeiraRemota(langCode) {
    try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

        window.meuIdiomaRemoto = langCode;
        console.log('💾 Idioma REMOTO guardado:', window.meuIdiomaRemoto);

        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = bandeira;

    } catch (error) {
        console.error('Erro ao carregar bandeira remota:', error);
        const remoteLangElement = document.querySelector('.remoter-Lang');
        if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
}

// 🎯 FUNÇÃO PARA PROCESSAR DADOS RECEBIDOS DO RECEIVER
function processarDadosReceiver(dados) {
    console.log('📦 Processando dados recebidos do Receiver:', dados);
    
    if (dados.tipo === 'dadosReceiver') {
        // ✅ Armazena o token recebido para uso nas traduções
        window.tokenRecebido = dados.token;
        window.receiverLangRecebida = dados.lang;
        
        console.log('🔐 Token recebido via WebRTC:', dados.token);
        console.log('🏳️ Idioma do Receiver recebido:', dados.lang);
        
        // ✅ Aplica a bandeira do receiver
        aplicarBandeiraRemota(dados.lang);
        
        // ✅ Atualiza as informações do receiver
        if (window.receiverInfo) {
            window.receiverInfo.token = dados.token;
            window.receiverInfo.lang = dados.lang;
        }
        
        return true;
    }
    return false;
}

// ✅ FUNÇÃO PARA INICIAR CÂMERA APÓS PERMISSÕES (USANDO CAMERA-VIGILANTE)
async function iniciarCameraAposPermissoes() {
    try {
        console.log('🎥 Iniciando sistema de câmera CALLER...');
        
        // 🎥🎥🎥 USA O SISTEMA UNIFICADO DE CÂMERA 🎥🎥🎥
        window.cameraVigilante = new CameraVigilante();
        await window.cameraVigilante.inicializarSistema();
        
        console.log('🌐 Inicializando WebRTC CALLER...');
        window.rtcCore = new WebRTCCore();

        // ✅✅✅ CONFIGURA CALLBACKS ANTES DE INICIALIZAR (MODIFICADO)
        window.rtcCore.setDataChannelCallback(async (mensagem) => {
            // 🎯 MODIFICAÇÃO 1: VERIFICA SE É DADOS DO RECEIVER
            try {
                const dados = JSON.parse(mensagem);
                if (processarDadosReceiver(dados)) {
                    console.log('✅ Dados do receiver processados com sucesso');
                    return; // Não processa como mensagem normal
                }
            } catch (e) {
                // Não é JSON, processa como mensagem normal
            }

            // ✅ MANTÉM TODO O CÓDIGO EXISTENTE DE TTS E TRADUÇÃO
            ttsHibrido.iniciarSomDigitacao();

            console.log('📩 Mensagem de texto recebida no CALLER:', mensagem);

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

            const idiomaExato = window.meuIdiomaLocal || 'pt-BR';
            
            console.log(`🎯 TTS Caller: Idioma guardado = ${idiomaExato}`);
            
            await ttsHibrido.falarTextoSistemaHibrido(mensagem, elemento, imagemImpaciente, idiomaExato);
        });

        const myId = crypto.randomUUID().substr(0, 8);
        document.getElementById('myId').textContent = myId;

        console.log('🔌 Inicializando socket handlers CALLER...');
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();

        // ✅ MARCA QUE O WEBRTC ESTÁ INICIALIZADO
        window.rtcCore.isInitialized = true;
        console.log('✅ WebRTC CALLER inicializado com ID:', myId);

        // 🎯 MODIFICAÇÃO 2: OBTÉM APENAS O ID DO RECEIVER (TOKEN E LANG VIRÃO VIA WEBRTC)
        const urlParams = new URLSearchParams(window.location.search);
        const receiverId = urlParams.get('targetId') || '';
        
        // ✅ Inicializa receiverInfo apenas com ID (token e lang serão preenchidos via WebRTC)
        window.receiverInfo = {
          id: receiverId,
          token: null, // Será preenchido via WebRTC
          lang: null   // Será preenchido via WebRTC
        };

        console.log('🎯 Receiver ID obtido do QR Code:', receiverId);
        console.log('⏳ Token e idioma do receiver serão recebidos via WebRTC...');

        // ✅✅✅ INICIA CONEXÃO MESMO SEM CÂMERA
        if (receiverId) {
          document.getElementById('callActionBtn').style.display = 'none';
          
          const meuIdioma = window.meuIdiomaLocal || 'pt-BR';
          
          setTimeout(() => {
            // ✅✅✅ ENVIA null se câmera falhou - WebRTC deve aceitar!
            const streamParaEnviar = window.localStream || null;
            iniciarConexaoVisual(receiverId, null, myId, streamParaEnviar, meuIdioma); // Token será null inicialmente
          }, 1000);
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
        
        // ✅ Bandeira remota será aplicada quando receber dados via WebRTC
        console.log('⏳ Aguardando dados do receiver para aplicar bandeira remota...');

    } catch (error) {
        console.error("❌ Erro não crítico na câmera CALLER:", error);
        
        const mobileLoading = document.getElementById('mobileLoading');
        if (mobileLoading) {
            mobileLoading.style.display = 'none';
        }
        
        console.log('🟡 CALLER continua funcionando (áudio/texto)');
    }
}

// 🚀 INICIALIZAÇÃO AUTOMÁTICA
window.onload = async () => {
    try {
        console.log('🚀 Iniciando aplicação caller automaticamente...');
        
        // 1. Obtém o idioma para tradução
        const lang = navigator.language || 'pt-BR';
        
        // ✅✅✅ PRIMEIRO: Aplica bandeira e GUARDA o idioma
        await aplicarBandeiraLocal(lang);

        // ✅✅✅ DEPOIS: Traduz frases com o idioma JÁ GUARDADO  
        await traduzirFrasesFixas();
        
        // 3. Inicia áudio
        iniciarAudio();
        
        // 4. Carrega sons da máquina de escrever (AGORA NO TTS HÍBRIDO)
        await ttsHibrido.carregarSomDigitacao();
        
        // 5. Solicita TODAS as permissões (câmera + microfone)
        await solicitarTodasPermissoes();
        
        // 6. Configura o toggle das instruções
        setupInstructionToggle();
        
        // 7. Libera interface (remove loading)
        if (typeof window.liberarInterface === 'function') {
            window.liberarInterface();
            console.log('✅ Interface liberada via função global');
        } else {
            liberarInterfaceFallback();
            console.log('✅ Interface liberada via fallback');
        }
        
        // 🎥🎥🎥 8. INICIA SISTEMA DE CÂMERA UNIFICADO 🎥🎥🎥
        await iniciarCameraAposPermissoes();
        
        console.log('✅ Caller iniciado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar caller:', error);
        
        if (typeof window.mostrarErroCarregamento === 'function') {
            window.mostrarErroCarregamento('Erro ao solicitar permissões de câmera e microfone');
        } else {
            console.error('❌ Erro no carregamento:', error);
            alert('Erro ao inicializar: ' + error.message);
        }
    }
};
