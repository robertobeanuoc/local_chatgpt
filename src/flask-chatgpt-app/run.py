from flask import render_template, request, session, Flask, jsonify
from flask_session import Session
from openai import OpenAI
import markdown
import os
import base64
import mimetypes
from werkzeug.utils import secure_filename

app = Flask(
    __name__,
    static_folder="app/static",
    template_folder="app/templates",
)
app.secret_key = os.getenv("SECRET_KEY")

# Configure upload folder
UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file size

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = app.secret_key


@app.route("/")
def index():
    return render_template("index.html")


Session(app)


def transform_messages_to_html(messages: list[dict]) -> list[dict]:
    """Transform messages to HTML format for rendering."""
    transformed_messages = []
    for message in messages:
        transformed_message = message.copy()
        if message["role"] == "assistant":
            transformed_message["content"] = markdown.markdown(message["content"])
        transformed_messages.append(transformed_message)
    return transformed_messages


def prepare_message_with_file(user_message, file):
    """Prepare a message with file content for OpenAI API."""
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        # Get the MIME type
        mime_type, _ = mimetypes.guess_type(filepath)
        if mime_type is None:
            mime_type = "application/octet-stream"

        # Read file as base64
        with open(filepath, "rb") as f:
            file_content = f.read()
            file_base64 = base64.b64encode(file_content).decode("utf-8")

        # Format message with file content for OpenAI API
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_message},
                    {
                        "type": (
                            "image_url"
                            if mime_type.startswith("image/")
                            else "file_url"
                        ),
                        "file_url": {"url": f"data:{mime_type};base64,{file_base64}"},
                    },
                ],
            }
        ]
        return messages, filename
    else:
        # Regular text message
        return [{"role": "user", "content": user_message}], None


@app.route("/chat", methods=["GET", "POST"])
def chat():
    if "messages" not in session:
        session["messages"] = []

    # Set model and web_search from query parameters if provided (GET request)
    if request.method == "GET":
        if request.args.get("model"):
            session["model"] = request.args.get("model")
        session["web_search"] = request.args.get("web_search") == "true"

    if request.method == "POST":
        if "change_model" in request.form:
            session["model"] = request.form["model"]
            session["web_search"] = request.form.get("web_search") == "true"
        else:
            user_message = request.form["user_message"]
            uploaded_file = request.files.get("file")

            # Store file information for display
            filename = None
            if uploaded_file and uploaded_file.filename:
                filename = secure_filename(uploaded_file.filename)

            # Add message to session
            session["messages"].append(
                {"role": "user", "content": user_message, "file": filename}
            )

            if session["web_search"]:
                # For web search, we need to format the input differently
                if uploaded_file and uploaded_file.filename:
                    # Currently, the web search API might not support file uploads
                    # This is a simplified implementation
                    response = client.responses.create(
                        model="gpt-4o",
                        input=f"{user_message} [File attached: {filename}]",
                        tools=[{"type": "web_search_preview"}],
                    )
                else:
                    response = client.responses.create(
                        model="gpt-4o",
                        input=user_message,
                        tools=[{"type": "web_search_preview"}],
                    )
                assistant_message = response.output_text
            else:
                # Prepare message with or without file
                if uploaded_file and uploaded_file.filename:
                    api_messages, filename = prepare_message_with_file(
                        user_message, uploaded_file
                    )
                    response = client.chat.completions.create(
                        model=session.get("model", "gpt-4o"),
                        messages=api_messages,
                    )
                else:
                    # Regular text message
                    # Get all previous messages for context
                    api_messages = []
                    for msg in session["messages"][
                        :-1
                    ]:  # Exclude the last message (just added)
                        if "file" not in msg:
                            api_messages.append(
                                {"role": msg["role"], "content": msg["content"]}
                            )

                    # Add the new user message
                    api_messages.append({"role": "user", "content": user_message})

                    response = client.chat.completions.create(
                        model=session.get("model", "gpt-4o"),
                        messages=api_messages,
                    )

                assistant_message = response.choices[0].message.content

            # Add assistant's response to session
            session["messages"].append(
                {"role": "assistant", "content": assistant_message}
            )

            # Return JSON response for AJAX requests
            if request.headers.get("X-Requested-With") == "XMLHttpRequest":
                return jsonify(
                    {
                        "messages": transform_messages_to_html(
                            session["messages"][-2:]
                        ),  # Return only the last 2 messages
                        "model": session.get("model"),
                        "web_search": session.get("web_search"),
                    }
                )

    return render_template(
        "chat.html",
        messages=transform_messages_to_html(session["messages"]),
        model=session.get("model"),
        web_search=session.get("web_search"),
    )


@app.route("/get_model", methods=["GET"])
def get_model():
    return jsonify({"model": session.get("model")})


@app.route("/reset", methods=["POST"])
def reset_chat():
    session.pop("messages", None)
    return "", 204  # No content response for reset action


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=6060, ssl_context="adhoc")
