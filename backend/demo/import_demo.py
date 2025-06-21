import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from input.api_importer import APIImporter
from flask import Flask, render_template, request


app = Flask(__name__, template_folder="templates")

@app.route("/", methods=["GET", "POST"])
def index():
    api_client = None
    if request.method == "POST":
        file = request.files.get("api_file")
        if file:
            filepath = f"/tmp/{file.filename}"
            file.save(filepath)

            importer = APIImporter()
            try:
                api_client = importer.import_openapi(filepath)
            except Exception as e:
                return f"<h2>Failed to import: {e}</h2>"

    return render_template("index.html", api_client=api_client)

if __name__ == "__main__":
    app.run(debug=True)
