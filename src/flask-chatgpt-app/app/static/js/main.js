+
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

        // Send message function
        function sendMessage() {
            const message = userInput.value.trim();
            if (message === '') return;

            // Clear input
            userInput.value = '';

            // Create form data
            const formData = new FormData();
            formData.append('user_message', message);

            // Send message
            fetch('/chat', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    }
                    throw new Error('Network response was not ok');
                })
                .then(data => {
                    window.messages = data.messages;
                    renderMessages();
                })
                .catch(error => {
                    console.error('Error:', error);
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