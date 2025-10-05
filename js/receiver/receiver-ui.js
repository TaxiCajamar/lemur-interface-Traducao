// ✅ CONFIGURA o botão para gerar QR Code quando clicado
document.getElementById('logo-traduz').addEventListener('click', function() {
    
    // ✅ FAZ O #click DESAPARECER
    const elementoClick = document.getElementById('click');
    if (elementoClick) {
        elementoClick.style.display = 'none';
    }
    
    // 🔄 VERIFICA SE JÁ EXISTE UM QR CODE ATIVO
    const overlay = document.querySelector('.info-overlay');
    const qrcodeContainer = document.getElementById('qrcode');
    
    // Se o overlay já está visível, apenas oculta (toggle)
    if (overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
        console.log('📱 QR Code fechado pelo usuário');
        return;
    }
    
    // 🔄 VERIFICA CONEXÃO WEBRTC DE FORMA MAIS INTELIGENTE
    const remoteVideo = document.getElementById('remoteVideo');
    const isConnected = remoteVideo && remoteVideo.srcObject;
    
    if (isConnected) {
        console.log('❌ WebRTC já conectado - QR Code não pode ser reaberto');
        
        // Opcional: mostrar mensagem ao usuário
        alert('Conexão já estabelecida. Para novo QR Code, recarregue a página.');
        return;
    }
    
    console.log('🗝️ Gerando/Reabrindo QR Code...');
    
    // 🔄 LIMPA QR CODE ANTERIOR SE EXISTIR
    if (qrcodeContainer) {
        qrcodeContainer.innerHTML = '';
    }
    
    const callerUrl = `${window.location.origin}/caller.html?targetId=${window.qrCodeData.myId}&token=${encodeURIComponent(window.qrCodeData.token)}&lang=${encodeURIComponent(window.qrCodeData.lang)}`;
    
    // Gera o QR Code
    QRCodeGenerator.generate("qrcode", callerUrl);
    
    // Mostra o overlay do QR Code
    if (overlay) {
        overlay.classList.remove('hidden');
    }
    
    console.log('✅ QR Code gerado/reativado!');
});

// ✅ FECHA QR CODE AO CLICAR FORA (opcional)
document.querySelector('.info-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
        console.log('📱 QR Code fechado (clique fora)');
    }
});
