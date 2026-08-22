from flair.data import Sentence
from flair.models import SequenceTagger
from flask import Flask, request, jsonify

app = Flask(__name__)

# Load the pretrained model ONCE when the server starts
tagger = SequenceTagger.load("flair/upos-multi")


@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    text = data.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    sentence = Sentence(text)

    # Run POS tagging
    tagger.predict(sentence)

    vocabulary = []

    for token in sentence:

        label = token.get_label("upos")

        if label.value in ["NOUN", "ADJ"]:

            vocabulary.append({
                "word": token.text,
                "part_of_speech": label.value,
                "confidence": label.score
            })

    return jsonify({
        "vocabulary": vocabulary
    })


if __name__ == "__main__":
    app.run(port=5000)