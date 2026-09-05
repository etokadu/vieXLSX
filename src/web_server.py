import json
import mimetypes
import os
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

from generator import Task


class VieXLSXServer:
    def __init__(self, excel_path, frontend_path, config):
        self.excel_path = excel_path
        self.frontend_path = frontend_path
        self.config = config
        self.lock = threading.RLock()
        self.client = None

    def get_client(self):
        if self.client is None:
            from client import TodoClient
            self.client = TodoClient(self.excel_path)
        return self.client

    def task_list(self):
        with self.lock:
            tasks = self.get_client().listTasks()
            if tasks is None:
                raise RuntimeError("Could not read Excel workbook")
            return [task.toDict() for task in tasks]

    def save_tasks(self, tasks):
        client = self.get_client()
        client.generator.tasks = tasks
        client.markChanged()
        if not client.save():
            raise RuntimeError("Could not save Excel workbook")
        return [task.toDict() for task in tasks]

    def add_task(self, payload):
        with self.lock:
            client = self.get_client()
            task = client.addTask(
                title=str(payload.get("title", "")),
                description=str(payload.get("description", "")),
                status=str(payload.get("status", "todo")),
                priority=str(payload.get("priority", "normal")),
                due_date=str(payload.get("due_date", "")),
                category=str(payload.get("category", "")),
                tags=str(payload.get("tags", ""))
            )
            if task is None or not client.save():
                raise RuntimeError("Could not create task")
            return task.toDict()

    def update_task(self, task_id, payload):
        with self.lock:
            client = self.get_client()
            tasks = client.listTasks()
            if tasks is None:
                raise RuntimeError("Could not read Excel workbook")
            task = next((item for item in tasks if item.id == task_id), None)
            if task is None:
                raise KeyError("Task not found")

            allowed = (
                "title", "description", "status", "priority",
                "due_date", "category", "tags"
            )
            for field in allowed:
                if field in payload:
                    setattr(task, field, str(payload[field]))

            task.done = task.status == "done"
            if task.done and not task.completed_time:
                from datetime import datetime
                task.completed_time = datetime.now().isoformat(
                    timespec="seconds"
                )
            if not task.done:
                task.completed_time = ""

            client.markChanged()
            if not client.save():
                raise RuntimeError("Could not update task")
            return task.toDict()

    def delete_task(self, task_id):
        with self.lock:
            client = self.get_client()
            if not client.delete(task_id):
                raise KeyError("Task not found")
            return {"deleted": task_id}

    def update_config(self, payload):
        with self.lock:
            for key in (
                "app_name", "username", "language", "theme", "autosave",
                "show_sidebar", "show_activity", "show_stats"
            ):
                if key in payload:
                    self.config[key] = payload[key]
            for key in ("category_options", "tag_options"):
                if key in payload and isinstance(payload[key], list):
                    self.config[key] = [str(value).strip() for value in payload[key] if str(value).strip()]
            config_path = os.path.join(os.path.dirname(self.excel_path), "config.json")
            with open(config_path, "w", encoding="utf-8") as file:
                json.dump(self.config, file, indent=2, ensure_ascii=False)
            return self.config


class RequestHandler(BaseHTTPRequestHandler):
    server_version = "vieXLSX/2.0"

    @property
    def app(self):
        return self.server.app

    def log_message(self, format_string, *args):
        if sys.stdout:
            print("[web] " + format_string % args)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1024 * 1024:
            raise ValueError("Request body is too large")
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        parsed = urlparse(self.path)
        try:
            if parsed.path == "/api/tasks":
                self.send_json({"tasks": self.app.task_list()})
                return
            if parsed.path == "/api/config":
                self.send_json(self.app.config)
                return
            self.serve_static(parsed.path)
        except Exception as error:
            self.send_json({"error": str(error)}, 500)

    def do_POST(self):
        if self.path == "/api/config":
            try:
                self.send_json(self.app.update_config(self.read_json()))
            except Exception as error:
                self.send_json({"error": str(error)}, 400)
            return
        if self.path != "/api/tasks":
            self.send_json({"error": "Not found"}, 404)
            return
        try:
            task = self.app.add_task(self.read_json())
            self.send_json({"task": task}, 201)
        except Exception as error:
            self.send_json({"error": str(error)}, 400)

    def do_PATCH(self):
        parts = urlparse(self.path).path.strip("/").split("/")
        if len(parts) != 3 or parts[:2] != ["api", "tasks"]:
            self.send_json({"error": "Not found"}, 404)
            return
        try:
            task = self.app.update_task(int(parts[2]), self.read_json())
            self.send_json({"task": task})
        except KeyError as error:
            self.send_json({"error": str(error)}, 404)
        except Exception as error:
            self.send_json({"error": str(error)}, 400)

    def do_DELETE(self):
        parts = urlparse(self.path).path.strip("/").split("/")
        if len(parts) != 3 or parts[:2] != ["api", "tasks"]:
            self.send_json({"error": "Not found"}, 404)
            return
        try:
            result = self.app.delete_task(int(parts[2]))
            self.send_json(result)
        except KeyError as error:
            self.send_json({"error": str(error)}, 404)
        except Exception as error:
            self.send_json({"error": str(error)}, 400)

    def serve_static(self, request_path):
        relative = unquote(request_path.lstrip("/")) or "index.html"
        if relative == "index.html":
            relative = "index.html"
        root = os.path.realpath(self.app.frontend_path)
        file_path = os.path.realpath(os.path.join(root, relative))
        if not file_path.startswith(root + os.sep) or not os.path.isfile(file_path):
            self.send_error(404, "File not found")
            return
        content_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
        with open(file_path, "rb") as file:
            body = file.read()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_web_server(excel_path, frontend_path, config, port=8765, open_browser=True):
    app = VieXLSXServer(excel_path, frontend_path, config)
    http_server = ThreadingHTTPServer(("127.0.0.1", port), RequestHandler)
    http_server.app = app
    url = f"http://127.0.0.1:{port}"
    if sys.stdout:
        print(f"vieXLSX web app running at {url}")
    if open_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        http_server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        http_server.server_close()
