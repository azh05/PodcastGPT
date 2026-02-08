import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri, tlsCAFile=certifi.where())
    db = client[settings.mongodb_db_name]
    await client.admin.command("ping")
    print(f"Connected to MongoDB: {settings.mongodb_db_name}")
    await db["episodes"].create_index("category")
    await db["episodes"].create_index("tone")


async def close_db() -> None:
    global client, db
    if client:
        client.close()
        client = None
        db = None
        print("MongoDB connection closed")
