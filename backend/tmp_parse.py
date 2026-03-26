import docx
import sys
import json
import os

def parse_docx(path):
    if not os.path.exists(path):
        return f"Error: File not found at {path}"
    try:
        doc = docx.Document(path)
        content = []
        for para in doc.paragraphs:
            content.append(para.text)
        return "\n".join(content)
    except Exception as e:
        return f"Error: {str(e)}"

files = [
    r"d:\Proposal Format\presales-fixed\docs\Copy of Reliance Hospitals-Zoho-CRM-Plus-Implementation-Budgetary Proposal.docx",
    r"d:\Proposal Format\presales-fixed\docs\Copy of Solid Plus 3D Tech INC-Zoho-Implementation-Proposal.docx"
]

results = {}
for f in files:
    results[f] = parse_docx(f)

print(json.dumps(results))
