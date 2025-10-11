// browser-detector.js - PASSO 1
console.log('🔍 Detector de navegador carregado...');

class BrowserDetector {
    static isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    static needsSafariVersion() {
        return this.isSafari() || this.isIOS();
    }

    static redirectToSafariVersion() {
        const currentPage = window.location.pathname.split('/').pop();
        console.log('📄 Página atual:', currentPage);
        
        let safariPage = '';
        
        if (currentPage === 'caller.html') {
            safariPage = 'safari-caller.html';
        } else if (currentPage === 'receiver.html') {
            safariPage = 'safari-receiver.html';
        } else if (currentPage === 'notificador.html') {
            safariPage = 'safari-notificador.html';
        } else {
            console.log('⚠️ Página não identificada, sem redirecionamento');
            return false;
        }
        
        // Mantém parâmetros importantes (token, lang)
        const newUrl = safariPage + window.location.search;
        console.log('🦁 Redirecionando para:', newUrl);
        window.location.href = newUrl;
        return true;
    }
}

// Aguarda página carregar
window.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Página carregada, verificando navegador...');
    
    if (BrowserDetector.needsSafariVersion()) {
        console.log('📱 iPhone/Safari detectado!');
        
        // Pequeno delay para evitar problemas
        setTimeout(function() {
            const redirecionou = BrowserDetector.redirectToSafariVersion();
            if (!redirecionou) {
                console.log('ℹ️ Continuando na versão normal...');
            }
        }, 200);
    } else {
        console.log('✅ Navegador normal (Chrome/Android), continuando...');
    }
});
