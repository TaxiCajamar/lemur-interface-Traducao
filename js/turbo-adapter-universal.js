// js/turbo-adapter-universal.js - ADAPTADOR SIMPLES
class TurboAdapter {
    static async getCamera() {
        if (window.lemurTurboSystem) {
            return await window.lemurTurboSystem.getCamera();
        }
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }
    
    static async getMicrophone() {
        if (window.lemurTurboSystem) {
            return await window.lemurTurboSystem.getMicrophone();
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setTimeout(() => stream.getTracks().forEach(track => track.stop()), 1000);
        return true;
    }
}
