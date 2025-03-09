#!/usr/bin/env python
# -*- coding: utf-8 -*-
from openai import OpenAI
from rich.console import Console
from rich.markdown import Markdown
import json
import os


console = Console()
default_model: str = "o1-mini"
model_options = ["gpt-4o", "o1-mini"]

model = (
    input(f"\nChoose a model {model_options} (default is '{default_model}'): ")
    or default_model
)
if model not in model_options:
    console.print(f"Invalid model selected. Defaulting to 'gpt4'.")
    model = default_model


def main():

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        console.print(
            "Please set your OpenAI API key as an environment variable named 'OPENAI_API_KEY'."
        )
        return
    messages = []
    client = OpenAI(api_key=openai_api_key)

    while True:
        user_prompt = input("\nEnter your prompt (or 'exit' to quit): ")
        if user_prompt.lower() == "exit":
            break

        user_message = {
            "role": "user",
            "content": [{"type": "text", "text": user_prompt}],
        }

        messages.append(user_message)
        response = client.chat.completions.create(model=model, messages=messages)

        markdown_response: str = json.loads(response.to_json())["choices"][0][
            "message"
        ]["content"]
        message_to_print = f"\n---\n{markdown_response}\n---\n"
        console.print(Markdown(message_to_print))
        chat_response: dict = {
            "role": "assistant",
            "content": [{"type": "text", "text": markdown_response}],
        }
        messages.append(chat_response)


if __name__ == "__main__":
    main()
