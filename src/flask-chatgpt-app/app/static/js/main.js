document.addEventListener('DOMContentLoaded', function () {
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const resetButton = document.getElementById('reset-button');

    // Render all messages
    function renderMessages() {
        messagesContainer.innerHTML = '';
        window.messages.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.role}`;

            const roleSpan = document.createElement('span');
            roleSpan.className = 'role';
            roleSpan.textContent = message.role === 'user' ? 'You: ' : 'Assistant: ';
            messageDiv.appendChild(roleSpan);

            const contentSpan = document.createElement('span');
            contentSpan.className = 'content';

            // Renderizar HTML para mensajes del asistente
            if (message.role === 'assistant') {
                contentSpan.innerHTML = message.content; // Usar innerHTML para renderizar HTML
            } else {
                contentSpan.textContent = message.content; // Usar textContent para usuarios (seguridad)
            }

            messageDiv.appendChild(contentSpan);
            messagesContainer.appendChild(messageDiv);
        });

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Initial render
    renderMessages();

    // Function to add a temporary "consulting" message
    function addConsultingMessage() {
        const consultingDiv = document.createElement('div');
        consultingDiv.className = 'message assistant consulting';
        consultingDiv.id = 'consulting-message';

        const roleSpan = document.createElement('span');
        roleSpan.className = 'role';
        roleSpan.textContent = 'Assistant: ';

        const contentSpan = document.createElement('span');
        contentSpan.className = 'content';
        contentSpan.innerHTML = '<em>Consultando...</em>';

        consultingDiv.appendChild(roleSpan);
        consultingDiv.appendChild(contentSpan);
        messagesContainer.appendChild(consultingDiv);

        // Scroll to show the consulting message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Function to remove the consulting message
    function removeConsultingMessage() {
        const consultingMessage = document.getElementById('consulting-message');
        if (consultingMessage) {
            consultingMessage.remove();
        }
    }

    // Send message function
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // Clear input
        userInput.value = '';

        // Create form data
        const formData = new FormData();
        formData.append('user_message', message);

        // Add user message immediately
        const userMessageObj = { role: 'user', content: message };
        if (!window.messages) {
            window.messages = [];
        }
        window.messages.push(userMessageObj);
        renderMessages();

        // Show consulting message
        addConsultingMessage();

        // Disable send button while processing
        sendButton.disabled = true;

        // Send message
        fetch('/chat', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Network response was not ok');
            })
            .then(data => {
                // Remove consulting message
                removeConsultingMessage();

                // Update messages with response from server
                if (data.messages && data.messages.length > 0) {
                    // The server returns the last two messages (user + assistant)
                    // We already added the user message, so we just need the assistant's response
                    window.messages.pop(); // Remove the user message we added (server will provide it)
                    window.messages = window.messages.concat(data.messages);
                }
                renderMessages();
            })
            .catch(error => {
                console.error('Error:', error);
                removeConsultingMessage();

                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message assistant error';
                errorDiv.innerHTML = '<span class="role">Assistant: </span><span class="content"><em>Error: No se pudo obtener respuesta</em></span>';
                messagesContainer.appendChild(errorDiv);
            })
            .finally(() => {
                // Re-enable send button
                sendButton.disabled = false;
            });
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    resetButton.addEventListener('click', function () {
        fetch('/reset', { method: 'POST' })
            .then(() => {
                window.messages = [];
                renderMessages();
            })
            .catch(error => console.error('Error:', error));
    });
});