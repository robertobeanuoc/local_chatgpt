from flask import render_template, request, session, Flask, jsonify
from flask_session import Session
from openai import OpenAI
import markdown
import os
import base64
import mimetypes
from werkzeug.utils import secure_filename
from constants import model_options, default_model

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
    return render_template(
        "index.html", model_options=model_options, default_model=default_model
    )


Session(app)


def transform_messages_to_html(messages: list[dict]) -> list[dict]:
    """Transform messages to HTML format for rendering."""
    transformed_messages = []
    for message in messages:
        # Check if message content is a list
        if isinstance(message, list):
            message = message[0]
        transformed_message = message.copy()
        if message["role"] == "assistant":
            if isinstance(message["content"], list):
                message_content = message["content"][0]
            else:
                message_content = message["content"]
            transformed_message["content"] = markdown.markdown(message_content)
        transformed_messages.append(transformed_message)
    return transformed_messages


def prepare_message_with_file(user_message, file):
    """Prepara un mensaje con o sin fichero para la API de OpenAI."""
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(filepath)

        with open(filepath, "rb") as f:
            uploaded_file = client.files.create(file=f, purpose="assistants")

        ret_message = {
            "role": "user",
            "content": [
                {"type": "input_text", "text": user_message},
                {"type": "input_file", "file_id": uploaded_file.id},
            ],
        }
        os.remove(filepath)  # Eliminar el fichero después de subirlo
    else:
        # Mensaje solo texto
        ret_message = {
            "role": "user",
            "content": user_message,
        }

    return ret_message


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

            # Añadir mensaje del usuario (con o sin fichero) en el formato correcto
            if (
                uploaded_file
                and uploaded_file.filename
                and not session.get("web_search")
            ):
                user_msg = prepare_message_with_file(user_message, uploaded_file)
            else:
                user_msg = prepare_message_with_file(user_message, None)
                session["messages"].append(user_msg)

            if session.get("web_search"):
                if uploaded_file:
                    raise ValueError(
                        "Web search and file upload are not supported together."
                    )
                app.logger.info("Chat commpetions with web search enabled ...")
                response = client.responses.create(
                    model=session.get("model", default_model),
                    input=session["messages"],
                    tools=[{"type": "web_search_preview"}],
                )
                assistant_message = response.output_text
                app.logger.info("Chat completions response received.")
            else:
                if uploaded_file:
                    app.logger.info("Responses with file upload ...")
                    response = client.responses.create(
                        model=session.get("model", default_model),
                        input=[user_msg],
                    )
                    app.logger.info("Response with file upload received.")
                    assistant_message = response.output_text
                else:
                    app.logger.info("Chat completions without file upload ...")
                    response = client.chat.completions.create(
                        model=session.get("model", default_model),
                        messages=session["messages"],
                    )
                    app.logger.info("Chat completions response received.")
                    assistant_message = response.choices[0].message.content

            session["messages"].append(
                {
                    "role": "assistant",
                    "content": assistant_message,
                }
            )

    # Si es una solicitud AJAX, devolver respuesta JSON para que JS pueda manejarla
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"success": True, "reload": True})

    # Si no es AJAX, renderizar la plantilla normalmente
    rendered_page = render_template(
        "chat.html",
        messages=transform_messages_to_html(session["messages"]),
        model=session.get("model"),
        web_search=session.get("web_search"),
    )

    return rendered_page


@app.route("/get_model", methods=["GET"])
def get_model():
    return jsonify({"model": session.get("model")})


@app.route("/reset", methods=["POST"])
def reset_chat():
    session.pop("messages", None)
    return "", 204  # No content response for reset action


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=6060, ssl_context="adhoc")
