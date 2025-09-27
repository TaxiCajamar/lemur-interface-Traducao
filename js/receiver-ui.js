import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO (SIMPLIFICADA)
async function obterIdiomaCompleto(lang) {
    if (!lang) return 'pt-BR';
    if (lang.includes('-')) return lang;
    
    const fallback = {
        'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
        'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
        'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
    };
    return fallback[lang] || `${lang}-${lang.toUpperCase()}`;
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
        return text;
    }
}

// 🔄 NOVA FUNÇÃO: Iniciar chamada reversa
async function iniciarChamadaReversa(callerId, localStream, meuIdioma) {
    console.log('📞 Iniciando chamada reversa para caller:', callerId);
    
    if (window.rtcCore && localStream) {
        setTimeout(() => {
            window.rtcCore.startCall(callerId, localStream, meuIdioma);
            mostrarEstadoConectando();
        }, 500);
    }
}

// ⏳ Mostrar estado "Conectando..."
function mostrarEstadoConectando() {
    const estadoAnterior = document.getElementById('estado-conexao');
    if (estadoAnterior) estadoAnterior.remove();
    
    const statusElement = document.createElement('div');
    statusElement.id = 'estado-conexao';
    statusElement.innerHTML = `
        <div style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
                    background: rgba(0,100,0,0.8); color: white; padding: 10px 20px; 
                    border-radius: 20px; text-align: center; z-index: 1000; font-size: 14px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>🔗</span>
                <span>Conectando...</span>
            </div>
        </div>
    `;
    document.body.appendChild(statusElement);
    
    setTimeout(() => {
        if (statusElement.parentNode) statusElement.remove();
    }, 5000);
}

window.onload = async () => {
    try {
        console.log('🚀 Iniciando receiver-ui.js...');

        // ✅ 1. Primeiro: Acessa a câmera IMEDIATAMENTE
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });

        console.log('📷 Câmera acessada com sucesso');

        let localStream = stream;
        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;

        // ✅ 2. Gera QR Code RÁPIDO (sem esperar traduções)
        const url = window.location.href;
        const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);

        function fakeRandomUUID(fixedValue) {
            return { substr: (start, length) => fixedValue.substr(start, length) };
        }

        const myId = fakeRandomUUID(fixedId).substr(0, 8);
        console.log('🆔 Meu ID:', myId);

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token') || '';
        const lang = params.get('lang') || navigator.language || 'pt-BR';
        const pendingCaller = params.get('pendingCaller');

        window.targetTranslationLang = lang;

        // ✅ GERA QR CODE IMEDIATAMENTE
        const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
        QRCodeGenerator.generate("qrcode", callerUrl);
        console.log('📱 QR Code gerado');

        // ✅ 3. Inicializa WebRTC
        window.rtcCore = new WebRTCCore();
        window.rtcCore.initialize(myId);
        window.rtcCore.setupSocketHandlers();
        console.log('🔌 WebRTC inicializado');

        // ✅ 4. Configura callbacks WebRTC
        window.rtcCore.setDataChannelCallback((mensagem) => {
            console.log('📩 Mensagem recebida:', mensagem);
            const elemento = document.getElementById('texto-recebido');
            if (elemento) {
                elemento.textContent = "";
                elemento.style.opacity = '1';
                elemento.style.animation = 'pulsar-flutuar-intenso 0.8s infinite ease-in-out';
                elemento.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elemento.style.border = '2px solid #ff0000';
            }

            if (window.SpeechSynthesis) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(mensagem);
                utterance.lang = window.targetTranslationLang || 'pt-BR';
                utterance.rate = 0.9;
                utterance.volume = 0.8;

                utterance.onstart = () => {
                    if (elemento) {
                        elemento.style.animation = 'none';
                        elemento.style.backgroundColor = '';
                        elemento.style.border = '';
                        elemento.textContent = mensagem;
                    }
                };
                window.speechSynthesis.speak(utterance);
            }
        });

        // ✅ 5. Se foi aberto via notificação, inicia chamada reversa
        if (pendingCaller) {
            console.log('🔔 Receiver acordado por notificação. Caller aguardando:', pendingCaller);
            setTimeout(async () => {
                const meuIdioma = await obterIdiomaCompleto(lang);
                await iniciarChamadaReversa(pendingCaller, localStream, meuIdioma);
            }, 2000);
        }

        window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
            if (!localStream) return;

            console.log('🎯 Caller conectou:', idiomaDoCaller);
            window.sourceTranslationLang = idiomaDoCaller;
            window.targetTranslationLang = lang;

            window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                remoteStream.getAudioTracks().forEach(track => track.enabled = false);
                const remoteVideo = document.getElementById('remoteVideo');
                if (remoteVideo) remoteVideo.srcObject = remoteStream;

                const overlay = document.querySelector('.info-overlay');
                if (overlay) overlay.classList.add('hidden');

                window.targetTranslationLang = idiomaDoCaller || lang;
                
                if (idiomaDoCaller) aplicarBandeiraRemota(idiomaDoCaller);
            });
        };

        // ✅ 6. Traduções de interface (OPCIONAL - não trava o fluxo)
        setTimeout(async () => {
            try {
                const frasesParaTraduzir = {
                    "translator-label": "Real-time translation.",
                    "qr-modal-title": "This is your online key",
                    "qr-modal-description": "You can ask to scan, share or print on your business card."
                };

                for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
                    const el = document.getElementById(id);
                    if (el) {
                        const traduzido = await translateText(texto, lang);
                        el.textContent = traduzido;
                    }
                }
            } catch (error) {
                console.log('⚠️ Tradução de interface falhou (normal)');
            }
        }, 3000);

        // ✅ 7. Bandeiras (OPCIONAL)
        async function aplicarBandeiraLocal(langCode) {
            try {
                const bandeira = '🏳️'; // Fallback simples
                const localLangElement = document.querySelector('.local-mic-Lang');
                if (localLangElement) localLangElement.textContent = bandeira;
            } catch (error) {
                // Ignora erro
            }
        }

        async function aplicarBandeiraRemota(langCode) {
            try {
                const bandeira = '🏳️';
                const remoteLangElement = document.querySelector('.remoter-Lang');
                if (remoteLangElement) remoteLangElement.textContent = bandeira;
            } catch (error) {
                // Ignora erro
            }
        }

        aplicarBandeiraLocal(lang);

        console.log('✅ Receiver-ui.js carregado com sucesso');

    } catch (error) {
        console.error("❌ Erro no receiver-ui.js:", error);
    }
};

// ✅ CORREÇÃO CRÍTICA: Inicia o tradutor APENAS quando tudo estiver pronto
function quandoEstiverProntoIniciarTradutor() {
    if (typeof initializeTranslator === 'function') {
        console.log('✅ Iniciando tradutor após receiver estar pronto...');
        initializeTranslator();
    } else {
        setTimeout(quandoEstiverProntoIniciarTradutor, 1000);
    }
}

// Aguarda tudo carregar para iniciar o tradutor
window.addEventListener('load', () => {
    setTimeout(quandoEstiverProntoIniciarTradutor, 3000);
});
