from flask import render_template, request, session, Flask
from flask_session import Session
from openai import OpenAI
import os


app = Flask(
    __name__,
    static_folder="app/static",
    template_folder="app/templates",
)
app.secret_key = os.getenv("SECRET_KEY")

# Initialize OpenAI client
openai_api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_api_key)

app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = app.secret_key


@app.route("/")
def index():
    return render_template("index.html")


Session(app)


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
            if session["web_search"]:

                response = client.responses.create(
                    model="gpt-4o",
                    input=user_message,
                    tools=[{"type": "web_search_preview"}],
                )
                assistant_message = response.output_text
            else:
                session["messages"].append({"role": "user", "content": user_message})
                response = client.chat.completions.create(
                    model=session.get("model", "gpt-4o"),
                    messages=session["messages"],
                )
                assistant_message = response.choices[0].message.content

            session["messages"].append(
                {"role": "assistant", "content": assistant_message}
            )

    return render_template(
        "chat.html",
        messages=session["messages"],
        model=session.get("model"),
        web_search=session.get("web_search"),
    )


@app.route("/reset", methods=["POST"])
def reset_chat():
    session.pop("messages", None)
    return "", 204  # No content response for reset action


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=6060, ssl_context="adhoc")
