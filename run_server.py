import uvicorn
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.5)
    webbrowser.open("http://localhost:8050")

if __name__ == "__main__":
    print("🚀 Starting Sentinel X Trade Analysis & Signal Provider Web Server...")
    print("🌐 Web App available at: http://localhost:8050")
    
    # Launch browser automatically
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start FastAPI server
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8050, reload=False)

