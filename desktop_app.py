import os
import sys
import threading
import time
import webview
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure the backend directory is in the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import the FastAPI app
from backend.main import app

def get_resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

# Serve the React SPA from FastAPI
dist_path = get_resource_path("dist")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    file_path = os.path.join(dist_path, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Fallback to index.html for client-side routing
    index_path = os.path.join(dist_path, "index.html")
    if os.path.exists(index_path):
         return FileResponse(index_path)
    return {"message": "Frontend not built yet. Run 'npm run build'."}

class ApiServer(threading.Thread):
    def __init__(self, host='127.0.0.1', port=8000):
        threading.Thread.__init__(self)
        self.host = host
        self.port = port
        self.server = None

    def run(self):
        config = uvicorn.Config(app, host=self.host, port=self.port, log_level="error")
        self.server = uvicorn.Server(config)
        self.server.run()

    def stop(self):
        if self.server:
            self.server.should_exit = True

import socket

def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def main():
    port = find_free_port()
    server_thread = ApiServer(port=port)
    server_thread.daemon = True
    server_thread.start()

    # Give the FastAPI server a second to start
    time.sleep(1)

    # Create the native desktop window using pywebview
    window = webview.create_window(
        "SubSync AI", 
        f"http://127.0.0.1:{port}", 
        width=1280, 
        height=800, 
        min_size=(1024, 700),
        resizable=True
    )
    
    # Start webview blocking event loop
    webview.start()
    
    # When webview is closed by the user, stop the FastAPI server gracefully
    print("Shutting down the server...")
    server_thread.stop()
    server_thread.join(timeout=3)
    print("Application closed gracefully.")

if __name__ == '__main__':
    main()
