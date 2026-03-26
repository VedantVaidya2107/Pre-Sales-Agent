import io
import os
import docx
import PyPDF2
import uuid
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import FileResponse

from utils.supabase_client import supabase

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/parse/{client_id}")
async def parse_document(client_id: str, file: UploadFile = File(...)):
    filename = file.filename.lower()
    # Create unique filename to avoid collisions
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        content = await file.read()
        
        # Save file to disk
        with open(file_path, "wb") as f:
            f.write(content)
            
        extracted_text = ""

        if filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
                
        elif filename.endswith(".txt") or filename.endswith(".csv"):
            extracted_text = content.decode("utf-8", errors="replace")
            
        else:
            # If not parsable, still save and return the filename for download
            pass
        
        # Save metadata to Supabase
        file_data = {
            "client_id": client_id,
            "name": file.filename,
            "stored_name": unique_filename,
            "type": file.content_type,
            "size": len(content)
        }
        supabase.table("files").insert(file_data).execute()

        return {
            "filename": file.filename, 
            "stored_name": unique_filename,
            "text": extracted_text.strip()
        }

    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error parsing document: {str(e)}")

@router.get("/list/{client_id}")
async def list_files(client_id: str):
    try:
        res = supabase.table("files").select("*").eq("client_id", client_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(file_path, filename=filename.split('_', 1)[-1])
