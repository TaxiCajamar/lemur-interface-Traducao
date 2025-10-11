// browser-detector.js - TESTE DE DETECÇÃO PRECISA
console.log('🎯 TESTE: Verificando navegador EXATO...');

// Teste PRECISO para Safari
function detectarNavegadorExato() {
    const userAgent = navigator.userAgent;
    console.log('📱 User Agent:', userAgent);
    
    const isChrome = /chrome|chromium/i.test(userAgent);
    const isSafari = /safari/i.test(userAgent) && !isChrome;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isFirefox = /firefox/i.test(userAgent);
    const isEdge = /edg/i.test(userAgent);
    
    console.log('🔍 Resultados:');
    console.log(' - Chrome:', isChrome);
    console.log(' - Safari:', isSafari);
    console.log(' - iOS:', isIOS);
    console.log(' - Firefox:', isFirefox);
    console.log(' - Edge:', isEdge);
    
    return {
        isSafari: isSafari,
        isIOS: isIOS,
        isSafariOrIOS: isSafari || isIOS
    };
}

// Executa o teste
const resultado = detectarNavegadorExato();
console.log('🎯 Deve redirecionar para Safari?', resultado.isSafariOrIOS);

// Só redireciona se for Safari/iOS
if (resultado.isSafariOrIOS) {
    console.log('🔄 REDIRECIONANDO para versão Safari!');
    // Aqui viria o redirecionamento
} else {
    console.log('✅ Navegador normal, continuando...');
}
