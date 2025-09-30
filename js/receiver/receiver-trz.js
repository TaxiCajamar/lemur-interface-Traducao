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

async function translateText(text) {
  try {
    const response = await fetch('https://chat-tradutor-bvvx.onrender.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        sourceLang: window.sourceTranslationLang || 'auto',
        targetLang: window.targetTranslationLang || 'en'
      })
    });
    const result = await response.json();
    const translatedText = result.translatedText || text;
    return translatedText;
  } catch (error) {
    return text;
  }
}

// ===== FUNÇÃO PARA PRÉ-AQUECER O NARRADOR =====
function turboNarrador(lang) {
  if (window.SpeechSynthesis && lang) {
    const ghost = new SpeechSynthesisUtterance('...');
    ghost.lang = lang;
    ghost.volume = 0;
    ghost.rate = 1;
    window.speechSynthesis.speak(ghost);
  }
}

// ===== INICIALIZAÇÃO DO BOTÃO MUNDO (INDEPENDENTE) =====
function initializeWorldButton() {
  const currentLanguageFlag = document.getElementById('currentLanguageFlag');
  const worldButton = document.getElementById('worldButton');
  const languageDropdown = document.getElementById('languageDropdown');
  const languageOptions = document.querySelectorAll('.language-option');

  if (!worldButton || !languageDropdown || !currentLanguageFlag) {
    console.log('⏳ Aguardando elementos do botão mundo...');
    setTimeout(initializeWorldButton, 300);
    return;
  }

  console.log('🎯 Inicializando botão mundo...');
  let IDIOMA_ORIGEM = window.callerLang || navigator.language || 'pt-BR';

  async function getBandeiraDoJson(langCode) {
    try {
      const response = await fetch('./assets/bandeiras/language-flags.json');
      const flags = await response.json();
      return flags[langCode] || flags[langCode.split('-')[0]] || '🎌';
    } catch (error) {
      console.error('Erro ao carregar bandeiras:', error);
      return '🎌';
    }
  }

  getBandeiraDoJson(IDIOMA_ORIGEM).then(bandeira => {
    currentLanguageFlag.textContent = bandeira;
  });

  worldButton.addEventListener('click', function(e) {
    console.log('🎯 Botão Mundo clicado!');
    e.preventDefault();
    e.stopPropagation();
    languageDropdown.classList.toggle('show');
  });

  document.addEventListener('click', function(e) {
    if (!languageDropdown.contains(e.target) && e.target !== worldButton) {
      languageDropdown.classList.remove('show');
    }
  });

  languageOptions.forEach(option => {
    option.addEventListener('click', async function() {
      const novoIdioma = this.getAttribute('data-lang');
      IDIOMA_ORIGEM = novoIdioma;
      const bandeira = await getBandeiraDoJson(novoIdioma);
      currentLanguageFlag.textContent = bandeira;
      languageDropdown.classList.remove('show');
      window.currentSourceLang = novoIdioma;
      const translatedText = document.getElementById('translatedText');
      if (translatedText) {
        translatedText.textContent = "✅";
        setTimeout(() => {
          if (translatedText) translatedText.textContent = "🎤";
        }, 1000);
      }
      console.log('🌎 Idioma alterado para:', novoIdioma);
    });
  });

  console.log('✅ Botão mundo inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO DO TRADUTOR =====
function initializeTranslator() {
  let IDIOMA_ORIGEM = window.currentSourceLang || window.callerLang || navigator.language || 'pt-BR';

  function obterIdiomaDestino() {
    return window.targetTranslationLang || new URLSearchParams(window.location.search).get('lang') || 'en';
  }

  function obterIdiomaFala() {
    const lang = obterIdiomaDestino();
    if (lang.includes('-')) return lang;
    const fallbackMap = {
      'en': 'en-US',
      'pt': 'pt-BR',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT'
    };
    return fallbackMap[lang] || 'en-US';
  }

  const IDIOMA_DESTINO = obterIdiomaDestino();
  const IDIOMA_FALA = obterIdiomaFala();

  console.log('🎯 Configuração de tradução:', {
    origem: IDIOMA_ORIGEM,
    destino: IDIOMA_DESTINO,
    fala: IDIOMA_FALA
  });

  const recordButton = document.getElementById('recordButton');
  const translatedText = document.getElementById('translatedText');
  const recordingModal = document.getElementById('recordingModal');
  const recordingTimer = document.getElementById('recordingTimer');
  const sendButton = document.getElementById('sendButton');
  const speakerButton = document.getElementById('speakerButton');

  if (!recordButton || !translatedText) {
    console.log('⏳ Aguardando elementos do tradutor...');
    setTimeout(initializeTranslator, 300);
    return;
  }

  translatedText.textContent = "🎤";

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const SpeechSynthesis = window.speechSynthesis;

  if (!SpeechRecognition) {
    translatedText.textContent = "❌";
    if (recordButton) recordButton.style.display = 'none';
    return;
  }

  if (!SpeechSynthesis && speakerButton) {
    speakerButton.style.display = 'none';
  }

  let recognition = new SpeechRecognition();
  recognition.lang = IDIOMA_ORIGEM;
  recognition.continuous = false;
  recognition.interimResults = true;

  let isRecording = false;
  let isTranslating = false;
  let recordingStartTime = 0;
  let timerInterval = null;
  let pressTimer;
  let tapMode = false;
  let isSpeechPlaying = false;
  let microphonePermissionGranted = false;
  let lastTranslationTime = 0;

  function setupRecognitionEvents() {
    recognition.onresult = function(event) {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (translatedText) {
        translatedText.textContent = "🎤";
      }

      if (finalTranscript && !isTranslating) {
        const now = Date.now();
        if (now - lastTranslationTime > 1000) {
          lastTranslationTime = now;
          isTranslating = true;
          translateText(finalTranscript).then(translation => {
            enviarParaOutroCelular(translation);
            if (translatedText) {
              translatedText.textContent = "✅";
              setTimeout(() => {
                if (translatedText) translatedText.textContent = "🎤";
              }, 500);
            }
            isTranslating = false;
          }).catch(error => {
            console.error('Erro na tradução:', error);
            if (translatedText) translatedText.textContent = "🎤";
            isTranslating = false;
          });
        }
      }
    };

    recognition.onerror = function(event) {
      console.log('Erro recognition:', event.error);
      if (event.error !== 'no-speech' && translatedText) {
        translatedText.textContent = "❌";
      }
      stopRecording();
    };

    recognition.onend = function() {
      if (isRecording) {
        stopRecording();
      }
    };
  }

  async function requestMicrophonePermission() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMicrophonePermission = devices.some(device =>
        device.kind === 'audioinput' && device.deviceId !== ''
      );

      if (hasMicrophonePermission) {
        microphonePermissionGranted = true;
        recordButton.disabled = false;
        translatedText.textContent = "🎤";
        setupRecognitionEvents();
        turboNarrador(IDIOMA_FALA); // ✅ Turbo do narrador ativado aqui
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

           setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 1000);

      microphonePermissionGranted = true;
      recordButton.disabled = false;
      translatedText.textContent = "🎤";
      setupRecognitionEvents();
      turboNarrador(IDIOMA_FALA); // ✅ Turbo do narrador ativado aqui
    } catch (error) {
      console.error('Erro ao solicitar permissão do microfone:', error);
      translatedText.textContent = "❌";
    }
  }

  function startRecording() {
    if (!microphonePermissionGranted) {
      requestMicrophonePermission();
      return;
    }

    if (isRecording) return;

    isRecording = true;
    translatedText.textContent = "⏺️";
    recordingModal.style.display = 'block';
    recordingStartTime = Date.now();
    recognition.start();

    timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      recordingTimer.textContent = `${elapsed}s`;
    }, 1000);
  }

  function stopRecording() {
    if (!isRecording) return;

    isRecording = false;
    translatedText.textContent = "⏹️";
    recordingModal.style.display = 'none';
    recordingTimer.textContent = '';
    clearInterval(timerInterval);
    recognition.stop();
  }

  recordButton.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
      tapMode = true;
      startRecording();
    }, 300);
  });

  recordButton.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
    if (!tapMode) {
      startRecording();
      setTimeout(stopRecording, 3000);
    }
  });

  sendButton.addEventListener('click', () => {
    const text = translatedText.textContent;
    if (text && text !== "🎤" && text !== "✅" && text !== "❌") {
      enviarParaOutroCelular(text);
    }
  });

  speakerButton.addEventListener('click', () => {
    const text = translatedText.textContent;
    if (text && window.SpeechSynthesis && !isSpeechPlaying) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = IDIOMA_FALA;
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      isSpeechPlaying = true;
      utterance.onend = () => {
        isSpeechPlaying = false;
      };
      window.speechSynthesis.speak(utterance);
    }
  });

  console.log('✅ Tradutor inicializado com sucesso!');
}

// ===== INICIALIZAÇÃO GERAL =====
document.addEventListener('DOMContentLoaded', () => {
  initializeWorldButton();
  initializeTranslator();
});
