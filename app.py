from fastapi import FastAPI
import uvicorn

app = FastAPI()

@app.get("/")
def ciao():
    return "Ciao"

uvicorn.run(app=app, host='0.0.0.0', port=8000)