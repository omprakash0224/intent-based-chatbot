import json
import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification


# Load model and tokenizer
tokenizer = DistilBertTokenizerFast.from_pretrained("intent_model")
model = DistilBertForSequenceClassification.from_pretrained("intent_model")
model.eval()

# Load label classes
label_classes = torch.load("label_classes.pt")

# Load responses
with open("intents.json") as f:
    intents_data = json.load(f)

responses = {
    intent["tag"]: intent["responses"]
    for intent in intents_data["intents"]
}

app = FastAPI(title="Intent Based Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    intent: str
    response: str
    confidence: float

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    inputs = tokenizer(
        request.message,
        return_tensors="pt",
        truncation=True,
        padding=True
    )

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=1)
    confidence, predicted_class = torch.max(probs, dim=1)

    intent = label_classes[predicted_class.item()]
    confidence_score = confidence.item()

    if confidence_score < 0.6:
        return ChatResponse(
            intent="unknown",
            response="Sorry, I didn't understand that. Please rephrase.",
            confidence=confidence_score
        )

    response_text = responses[intent][0]

    return ChatResponse(
        intent=intent,
        response=response_text,
        confidence=confidence_score
    )
