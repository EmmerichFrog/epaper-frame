import os, random
import subprocess
from time import perf_counter_ns, sleep
from typing import Literal

from flask import (
    Flask,
    jsonify,
    render_template,
    request,
    send_from_directory,
)
from flask.wrappers import Response
from werkzeug import Request
from werkzeug.utils import secure_filename

from epaper import Panel
from PIL import Image

panel = Panel()
app = Flask(__name__)
Request.max_form_parts = 50000

CURR_FILE = "curr_filename"
FILE_SKIP = "cropped.png"
UPLOAD_FOLDER = "static/uploads/"
CONVERTED_FOLDER = "static/converted/"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["CONVERTED_FOLDER"] = CONVERTED_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 510 * 1024 * 1024

# Ensure the uploads folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "heic"}


def allowed_file(filename) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index() -> str:
    return render_template("index.html", panel=panel.PANEL_TYPE)


@app.route("/upload", methods=["POST"])
def upload_file() -> tuple[Response, Literal[400]] | tuple[Response, Literal[200]]:
    if "file" not in request.files:
        return jsonify({"Status": "error, no file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"Status": "Error, no selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)  # type: ignore
        file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(file_path)
        return jsonify({"Status": "Done", "Name": filename}), 200
    return jsonify({"Status": "error, file type not allowed"}), 400


def save_name(name: str) -> None:
    with open(CURR_FILE, "w") as f:
        f.write(name)


def read_name() -> str:
    with open(CURR_FILE, "r") as f:
        curr_name = f.read().strip()
    return curr_name


def convert_image(filepath: str) -> None:
    # Save converted image
    start_time = perf_counter_ns()
    conv_name, img = panel.rotate_enhance(filepath)
    tot_time = (perf_counter_ns() - start_time) / 1000000
    print(tot_time, "ms")

    panel.set_pic(img)
    save_name(conv_name)


@app.route("/converted", methods=["POST"])
def convert() -> tuple[Response, Literal[200]] | tuple[Response, Literal[400]]:
    file = request.files.get("cropped_image_data")

    if file:
        filename = secure_filename("cropped")
        file_path = os.path.join(app.config["CONVERTED_FOLDER"], filename + ".png")
        file.save(file_path)

        convert_image(file_path)
        return jsonify({"Status": "Done"}), 200

    return jsonify({"Status": "Error, invalid file format"}), 400


@app.route("/done", methods=["GET"])
def image_set_done() -> tuple[Response, Literal[200]]:
    if panel.is_done():
        return jsonify({"Status": "Done"}), 200
    else:
        return jsonify({"Status": "Waiting"}), 210


@app.route("/prev", methods=["GET"])
def set_prev() -> tuple[Response, Literal[200]] | tuple[Response, Literal[400]]:
    if panel.is_done():
        list_dir = os.listdir(app.config["CONVERTED_FOLDER"])
        list_dir.remove(FILE_SKIP)
        curr_name = read_name()
        img_idx = list_dir.index(curr_name)
        if img_idx <= 0:
            img_idx = len(list_dir) - 1
        else:
            img_idx -= 1

        img_name = list_dir[img_idx]
        img = Image.open(os.path.join(app.config["CONVERTED_FOLDER"], list_dir[img_idx])).convert("RGB")
        panel.set_pic(img)
        save_name(img_name)

        return jsonify({"Status": "Done", "Name": img_name}), 200
    else:
        return jsonify({"Status": "Busy"}), 400


@app.route("/next", methods=["GET"])
def set_next() -> tuple[Response, Literal[200]] | tuple[Response, Literal[400]]:
    if panel.is_done():
        list_dir = os.listdir(app.config["CONVERTED_FOLDER"])
        list_dir.remove(FILE_SKIP)
        curr_name = read_name()
        img_idx = list_dir.index(curr_name)
        if img_idx >= len(list_dir) - 1:
            img_idx = 0
        else:
            img_idx += 1

        img_name = list_dir[img_idx]
        img = Image.open(os.path.join(app.config["CONVERTED_FOLDER"], list_dir[img_idx])).convert("RGB")
        panel.set_pic(img)
        save_name(img_name)

        return jsonify({"Status": "Done", "Name": img_name}), 200
    else:
        return jsonify({"Status": "Busy"}), 400


@app.route("/rand", methods=["GET"])
def set_rnd() -> tuple[Response, Literal[200]] | tuple[Response, Literal[400]]:
    if panel.is_done():
        img_list = list()
        curr_name = read_name()
        for img_name in os.listdir(app.config["CONVERTED_FOLDER"]):
            if img_name != "cropped.png" and img_name != curr_name:
                img_list.append(os.path.join(app.config["CONVERTED_FOLDER"], img_name))

        img_name = random.choice(img_list)
        img = Image.open(img_name).convert("RGB")
        panel.set_pic(img)
        save_name(os.path.basename(img_name))

        return jsonify({"Status": "Done", "Name": os.path.basename(img_name)}), 200
    else:
        return jsonify({"Status": "Busy"}), 400


@app.route("/curr_name", methods=["GET"])
def get_curr_name() -> tuple[Response, Literal[200]]:
    curr_name = read_name()
    return jsonify({"Status": "Done", "Name": curr_name}), 200


@app.route("/uploads/<filename>")
def get_uploaded_file(filename) -> Response:
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/shutdown", methods=["GET"])
def shutdown() -> tuple[Response, Literal[200]]:
    command = "sudo shutdown now -h"
    subprocess.call(command.split())
    return jsonify({"Status": "Shutting down"}), 200


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=443,
        debug=False,
        ssl_context=("cert.pem", "key.pem"),
        threaded=True,
    )
