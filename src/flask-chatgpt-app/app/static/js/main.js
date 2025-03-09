document.addEventListener('DOMContentLoaded', function () {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const messagesContainer = document.getElementById('messages');
    const sendButton = document.getElementById('send-button');
    const resetButton = document.getElementById('reset-button');

    // Display existing messages if any
    function loadMessages() {
        if (window.messages) {
            window.messages.forEach(message => {
                appendMessage(message.role, message.content);
            });
        }
    }

    // Initialize messages display
    loadMessages();

    sendButton.addEventListener('click', function () {
        sendMessage();
    });

    userInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    resetButton.addEventListener('click', function () {
        fetch('/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(() => {
                messagesContainer.innerHTML = '';
            })
            .catch(error => console.error('Error resetting chat:', error));
    });

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
                    window.location.reload(); // Reload to get updated messages
                }
            })
            .catch(error => console.error('Error sending message:', error));
    }

    function appendMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', role);

        const roleSpan = document.createElement('span');
        roleSpan.classList.add('role');
        roleSpan.textContent = role === 'user' ? 'You: ' : 'Assistant: ';

        const contentSpan = document.createElement('span');
        contentSpan.classList.add('content');
        contentSpan.textContent = content;

        messageDiv.appendChild(roleSpan);
        messageDiv.appendChild(contentSpan);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
});