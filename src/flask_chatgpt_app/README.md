# Flask ChatGPT Application

This project is a simple web application that allows users to interact with a ChatGPT-style chatbot using Flask. The application provides a user-friendly interface for chatting with the model, and it supports session-based chat history.

## Project Structure

```
flask-chatgpt-app
├── app
│   ├── __init__.py          # Initializes the Flask application
│   ├── config.py            # Configuration settings for the application
│   ├── routes.py            # Defines the application routes
│   ├── static               # Contains static files (CSS, JS)
│   │   ├── css
│   │   │   └── style.css     # Styles for the application
│   │   └── js
│   │       └── main.js       # JavaScript for client-side interactions
│   └── templates            # Contains HTML templates
│       ├── base.html        # Base template for the application
│       ├── chat.html        # Chat interface template
│       └── index.html       # Landing page template
├── instance
│   └── .env.example         # Example environment variable file
├── requirements.txt         # Project dependencies
├── run.py                   # Entry point to run the application
└── README.md                # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd flask-chatgpt-app
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   - Copy the `instance/.env.example` file to `.env` at the project root (or to the `instance/` folder) and update the necessary variables. Example contents:

   ```env
   # OpenAI API key (required)
   OPENAI_API_KEY=your-openai-api-key

   # Flask secret key for session signing (recommended: 32+ random bytes or hex)
   SECRET_KEY=your-secret-key

   # Debug mode (True/False). Defaults to False in code.
   DEBUG=False

   # Optional: override port/host
   # PORT=6060
   # HOST=0.0.0.0
   ```

   - After copying and editing, run the app as shown below. The project already includes `.env` in `.gitignore`.

5. **Run the application:**
   ```bash
   python run.py
   ```

## Usage

- Open your web browser and navigate to `http://127.0.0.1:5000/` to access the application.
- Choose a model and start chatting with the chatbot.
- You can reset the chat content using the provided button in the chat interface.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.