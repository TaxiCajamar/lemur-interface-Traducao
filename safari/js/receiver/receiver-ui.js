<style>
/* 🆕 ESTILOS PARA CHAT SAFARI */
#safariChatContainer {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 400px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 1000;
    display: flex;
    gap: 8px;
    align-items: center;
    backdrop-filter: blur(10px);
}

#inputTextoSafari {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px;
    font-size: 16px;
    outline: none;
    border-radius: 10px;
}

#btnEnviarSafari, #btnDitadoSafari {
    border: none;
    border-radius: 50%;
    width: 44px;
    height: 44px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

#btnEnviarSafari { background: #4CAF50; }
#btnDitadoSafari { background: #2196F3; }
</style>
