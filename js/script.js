// Elementos del DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const loadingIndicator = document.getElementById('loading');

// Estado de la aplicación
let isProcessing = false;

/**
 * Añade un mensaje al chat
 * @param {string} content - Contenido del mensaje
 * @param {boolean} isUser - Indica si el mensaje es del usuario
 */
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'message--user' : 'message--ai'}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Maneja el envío de mensajes
 * @returns {Promise<void>}
 */
async function sendMessage() {
    if (isProcessing || !userInput.value.trim()) return;

    const userMessage = userInput.value.trim();
    addMessage(userMessage, true);
    userInput.value = '';

    isProcessing = true;
    sendButton.disabled = true;
    loadingIndicator.style.display = 'flex';

    try {
        const response = await fetch(CONFIG.API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API.KEY}`
            },
            body: JSON.stringify({
                model: CONFIG.API.MODEL,
                messages: [{
                    role: 'user',
                    content: userMessage
                }],
                temperature: CONFIG.CHAT.TEMPERATURE,
                max_tokens: CONFIG.CHAT.MAX_TOKENS
            })
        });

        if (!response.ok) {
            throw new Error(`Error en la API: ${response.status}`);
        }

        const data = await response.json();
        addMessage(data.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error);
        addMessage('Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta nuevamente.');
    } finally {
        isProcessing = false;
        sendButton.disabled = false;
        loadingIndicator.style.display = 'none';
    }
}

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Ajusta la altura del textarea automáticamente
userInput.addEventListener('input', function() {
    // Reset height para obtener la altura correcta
    this.style.height = 'auto';
    // Establece la nueva altura basada en el contenido
    this.style.height = (this.scrollHeight) + 'px';
    // Limita la altura máxima
    if (this.scrollHeight > 150) {
        this.style.height = '150px';
        this.style.overflowY = 'auto';
    }
});

// Mantener el foco en el input cuando se carga la página
window.addEventListener('load', () => {
    userInput.focus();
});

// Gestión de errores de red
window.addEventListener('offline', () => {
    addMessage('Se ha perdido la conexión a Internet. Reconectando...', false);
});

window.addEventListener('online', () => {
    addMessage('¡Conexión restaurada!', false);
});