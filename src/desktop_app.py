import threading

from web_server import run_web_server


def run_desktop_app(excel_path, frontend_path, config, port=8765):
    """Run the HTML UI inside a native desktop window, with Python as backend."""
    server_thread = threading.Thread(
        target=run_web_server,
        args=(excel_path, frontend_path, config, port, False),
        daemon=True
    )
    server_thread.start()

    try:
        import webview
        webview.create_window(
            config.get("app_name", "vieXLSX"),
            f"http://127.0.0.1:{port}",
            width=1280,
            height=820,
            min_size=(900, 620),
            resizable=True,
            maximized=True,
            fullscreen=False
        )
        webview.start()
    except ImportError:
        import webbrowser
        webbrowser.open(f"http://127.0.0.1:{port}")
        server_thread.join()
