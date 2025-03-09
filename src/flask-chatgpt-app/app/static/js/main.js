document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatOutput = document.getElementById('chat-output');
    const resetButton = document.getElementById('reset-button');

    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const userMessage = chatInput.value;
        chatInput.value = '';

        if (userMessage.trim() === '') return;

        appendMessage('User', userMessage);
        sendMessageToServer(userMessage);
    });

    resetButton.addEventListener('click', function() {
        chatOutput.innerHTML = '';
    });

    function appendMessage(role, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${role}:</strong> ${message}`;
        chatOutput.appendChild(messageElement);
    }

    function sendMessageToServer(message) {
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            appendMessage('Assistant', data.response);
        })
        .catch(error => {
            console.error('Error:', error);
            appendMessage('Assistant', 'Sorry, there was an error processing your request.');
        });
    }
});