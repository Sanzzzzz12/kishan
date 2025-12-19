# db.py
from pymongo import MongoClient


MONGO_URI = "mongodb+srv://sanjana:9761662478@cluster0.rv1vbsp.mongodb.net/?appName=Cluster0"
client = MongoClient(MONGO_URI)
db = client["kishan"]
messages_collection = db["messages"]

def save_message(user_id, role, text):
    messages_collection.insert_one({
        "user_id": user_id,
        "role": role,
        "text": text
    })

def get_history(user_id, limit=10):
    msgs = messages_collection.find({"user_id": user_id}).sort("_id", -1).limit(limit)
    return list(reversed(list(msgs)))
