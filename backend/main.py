import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from routers import auth, clients, tracking, proposals, email, gemini, documents, conversations

load_dotenv()

app = FastAPI(title="Fristine Presales Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(tracking.router)
app.include_router(proposals.router)
app.include_router(email.router)
app.include_router(gemini.router)
app.include_router(documents.router)
app.include_router(conversations.router)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
