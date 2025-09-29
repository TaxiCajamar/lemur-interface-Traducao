// js/turbo-module.js - SISTEMA TURBO
class LemurTurbo {
    constructor() {
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        
        console.log('⚡ TURBO: Ativando sistema turbo...');
        
        // 1. WebRTC PRÉ-CONECTADO
        this.peerConnection = new RTCPeerConnection();
        this.dataChannel = this.peerConnection.createDataChannel("chat");
        
        // 2. NARRADOR PRÉ-AQUECIDO  
        this.preheatSpeechSynthesis();
        
        // 3. MÍDIA COM ATRASO (3 segundos)
        this.scheduleDelayedMedia();
        
        window.lemurTurbo = this;
        this.isInitialized = true;
        
        console.log('✅ TURBO: Sistema ativado!');
    }

    preheatSpeechSynthesis() {
        console.log('🎙️ TURBO: Aquecendo narrador...');
        const utterance = new SpeechSynthesisUtterance('inicio');
        utterance.volume = 0;
        utterance.lang = navigator.language || 'pt-BR';
        
        if (speechSynthesis.getVoices().length > 0) {
            speechSynthesis.speak(utterance);
        } else {
            speechSynthesis.onvoiceschanged = () => speechSynthesis.speak(utterance);
        }
    }

    scheduleDelayedMedia() {
        setTimeout(async () => {
            try {
                console.log('🎥 TURBO: Solicitando câmera e microfone...');
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                console.log('✅ TURBO: Câmera e microfone autorizados!');
            } catch (error) {
                console.log('⚠️ TURBO: Permissões não autorizadas');
            }
        }, 3000);
    }

    async getCamera() {
        if (this.mediaStream) return this.mediaStream;
        
        // Espera um pouco se o turbo está processando
        await new Promise(resolve => setTimeout(resolve, 500));
        if (this.mediaStream) return this.mediaStream;
        
        // Se não tem, pede normalmente
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    async getMicrophone() {
        if (this.mediaStream) return true;
        
        await new Promise(resolve => setTimeout(resolve, 500));
        if (this.mediaStream) return true;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setTimeout(() => stream.getTracks().forEach(track => track.stop()), 1000);
        return true;
    }
}

// INICIA AUTOMATICAMENTE
window.lemurTurboSystem = new LemurTurbo();
window.lemurTurboSystem.initialize();
