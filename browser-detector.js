// browser-detector.js - VERSÃO CORRIGIDA
console.log('🔍 Detector: Verificando navegador...');

function isSafariOrIOS() {
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return isSafari || isIOS;
}

function mostrarAvisoSafari() {
    if (!isSafariOrIOS()) {
        console.log('✅ Navegador normal (Chrome/Android), continuando...');
        return; // ⬅️ NÃO FAZ NADA NO CHROME
    }
    
    console.log('📱 Safari/iPhone detectado! Mostrando aviso...');
    
    const aviso = document.createElement('div');
    aviso.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.95);
        color: white;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
    `;
    
    aviso.innerHTML = `
        <h2 style="font-size: 24px; margin-bottom: 20px;">📱 VERSÃO SAFARI</h2>
        <p style="font-size: 18px; margin-bottom: 30px;">Para melhor experiência no iPhone/Safari</p>
        <a href="safari-version/safari-receiver.html${window.location.search}" 
           style="background: #007AFF; 
                  color: white; 
                  padding: 15px 30px; 
                  border-radius: 10px; 
                  text-decoration: none;
                  font-size: 18px;
                  cursor: pointer;">
            CLIQUE AQUI para versão Safari
        </a>
        <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
            Ou copie este link:<br>
            <code style="background: #333; padding: 5px; border-radius: 5px;">
                safari-version/safari-receiver.html
            </code>
        </p>
    `;
    
    document.body.appendChild(aviso);
}

// Executa quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarAvisoSafari);
} else {
    mostrarAvisoSafari();
}
