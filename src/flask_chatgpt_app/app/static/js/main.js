document.addEventListener('DOMContentLoaded', function () {
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const resetButton = document.getElementById('reset-button');
    const fileInput = document.getElementById('file-input');
    const fileName = document.getElementById('file-name');
    const removeFile = document.getElementById('remove-file');

    // File handling
    let selectedFile = null;

    fileInput.addEventListener('change', function () {
        if (this.files.length > 0) {
            selectedFile = this.files[0];
            fileName.textContent = selectedFile.name;
            removeFile.style.display = 'inline';
        }
    });

    removeFile.addEventListener('click', function () {
        selectedFile = null;
        fileInput.value = '';
        fileName.textContent = '';
        removeFile.style.display = 'none';
    });

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

            // Render HTML for assistant messages
            if (message.role === 'assistant') {
                contentSpan.innerHTML = message.content;
            } else {
                // For user messages, check if there's a file attachment
                contentSpan.textContent = message.content;

                if (message.file) {
                    const fileAttachment = document.createElement('div');
                    fileAttachment.className = 'file-attachment';
                    fileAttachment.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
                        </svg>
                        Attached file: ${message.file}
                    `;
                    contentSpan.appendChild(fileAttachment);
                }
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

    function sendMessage() {
        const message = userInput.value.trim();
        const fileInput = document.getElementById('file-input');
        const file = fileInput.files[0];

        if (message === '' && !file) return;

        // Show consulting message
        addConsultingMessage();

        // Create form data with message and file
        const formData = new FormData();
        formData.append('user_message', message);
        if (file) {
            formData.append('file', file);
        }

        // Clear inputs
        userInput.value = '';
        fileInput.value = '';
        document.getElementById('file-name').textContent = '';

        // Send data to server
        fetch('/chat', {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(response => response.json())
            .then(data => {
                // Handle response
                removeConsultingMessage();
                // Update messages
                // ...rest of your code
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