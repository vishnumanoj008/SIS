import os
from typing import List, Dict
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from groq import Groq
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


if not GROQ_API_KEY:
    raise ValueError("API key for Groq is missing. Please set the GROQ_API_KEY in the .env file.")


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


client = Groq(api_key=GROQ_API_KEY)


class UserInput(BaseModel):
    message: str
    role: str = "user"
    conversation_id: str
    
class Conversation:
    def __init__(self):
        self.messages: List[Dict[str, str]] = [
            {"role": "system", "content": "You are a useful AI assistant."}
        ]
        self.active: bool = True

conversations: Dict[str, Conversation] = {}




def query_groq_api(conversation: Conversation) -> str:
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=conversation.messages,
            temperature=1,
            max_tokens=1024,
            top_p=1,
            stream=True,
            stop=None,
        )
        
        response = ""
        for chunk in completion:
            response += chunk.choices[0].delta.content or ""
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error with Groq API: {str(e)}")


def get_or_create_conversation(conversation_id: str) -> Conversation:
    if conversation_id not in conversations:
        conversations[conversation_id] = Conversation()
    return conversations[conversation_id]




'''@app.post("/chat/")
async def chat(input: UserInput):
    conversation = get_or_create_conversation(input.conversation_id)

    if not conversation.active:
        raise HTTPException(
            status_code=400, 
            detail="The chat session has ended. Please start a new session."
        )
        
    try:
        # Append the user's message to the conversation
        conversation.messages.append({
            "role": input.role,
            "content": input.message
        })
        
        response = query_groq_api(conversation)
        
        conversation.messages.append({
            "role": "assistant",
            "content": response
        })
        
        return {
            "response": response,
            "conversation_id": input.conversation_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    '''


@app.post("/chat/")
async def chat(input: UserInput):
    conversation = get_or_create_conversation(input.conversation_id)
    
    # Always start with a fixed system prompt
    conversation.messages[0] = {
        "role": "system",
        "content": (
            "You are Salama, an AI assistant working at Salama Integrated Solutions. You specialize in providing help related to IT services, hardware, cloud computing, and computer infrastructure technology. Always greet users politely when they say hello, hi, or similar greetings, and follow up with How can I help you? You are programmed to respond only to questions within your domain of expertise and always within 60 words.Always refer to yourself as Salama the company and always respond as consice as possible.If someone asks where you are located, tell them the address is at the bottom of the website/ scroll down to view the address but also in general mention we are located in Darsait, Ruwi. If someone asks about philosophy, general knowledge, or anything outside your field or unrelated to Salama Integrated Solutions, politely respond with Sorry, I don't think I can help you there. If a user asks for a phone number, always respond with +968 24709753. If they ask for an email address, always give them info@sis.co.om."

        )
    }

    # Extract user input
    user_msg = input.message.lower()


    # Add user message to conversation history
    conversation.messages.append({
        "role": input.role,
        "content": input.message
    })

    try:
        # Get AI response from Groq (LLaMA 3.1)
        response = query_groq_api(conversation)

        # Add assistant response to chat history
        conversation.messages.append({
            "role": "assistant",
            "content": response
        })

        return {
            "response": response,
            "conversation_id": input.conversation_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
def read_root():
    return {"message": "Backend is running!"}

    
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port)