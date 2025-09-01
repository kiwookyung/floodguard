from fastapi import WebSocket
from typing import List
import asyncio # <-- Add this import

class LogConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.loop = None # <-- Add this line

    def set_loop(self, loop): # <-- Add this method
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    def broadcast(self, message: str): # <-- Modify this method
        """Broadcasts a message to all connected clients in a thread-safe manner."""
        if self.loop:
            asyncio.run_coroutine_threadsafe(self._broadcast(message), self.loop)

    async def _broadcast(self, message: str): # <-- Add this internal coroutine
        """Actual broadcast coroutine."""
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except RuntimeError as e:
                # Handle cases where connection might be closed unexpectedly
                print(f"Error sending to websocket: {e}")
                self.disconnect(connection) # Disconnect problematic client
            except Exception as e:
                print(f"Unexpected error during broadcast: {e}")

log_manager = LogConnectionManager()
