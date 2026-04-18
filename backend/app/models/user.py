"""
TaskFlow Pro — User Model
"""
from datetime import datetime, timezone
import bcrypt
from bson import ObjectId
from ..extensions import get_db


class User:
    """User model for TaskFlow Pro."""

    COLLECTION = "users"

    @staticmethod
    def create(name, email, password):
        """Create a new user."""
        db = get_db()
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        user_doc = {
            "name": name,
            "email": email.lower().strip(),
            "password_hash": password_hash,
            "bio": "",
            "avatar_color": User._generate_avatar_color(name),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        result = db[User.COLLECTION].insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        return User._serialize(user_doc)

    @staticmethod
    def find_by_email(email):
        """Find a user by email."""
        db = get_db()
        return db[User.COLLECTION].find_one({"email": email.lower().strip()})

    @staticmethod
    def find_by_id(user_id):
        """Find a user by ID."""
        db = get_db()
        return db[User.COLLECTION].find_one({"_id": ObjectId(user_id)})

    @staticmethod
    def update(user_id, data):
        """Update user profile."""
        db = get_db()
        allowed_fields = {"name", "bio"}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data["updated_at"] = datetime.now(timezone.utc)

        db[User.COLLECTION].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return User.find_by_id(user_id)

    @staticmethod
    def change_password(user_id, new_password):
        """Change user password."""
        db = get_db()
        password_hash = bcrypt.hashpw(
            new_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        db[User.COLLECTION].update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "password_hash": password_hash,
                "updated_at": datetime.now(timezone.utc)
            }}
        )

    @staticmethod
    def verify_password(stored_hash, password):
        """Verify a password against its hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"),
            stored_hash.encode("utf-8")
        )

    @staticmethod
    def _generate_avatar_color(name):
        """Generate a consistent avatar color from user name."""
        colors = [
            "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
            "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"
        ]
        index = sum(ord(c) for c in name) % len(colors)
        return colors[index]

    @staticmethod
    def _serialize(user_doc):
        """Serialize user document for API response (exclude password)."""
        if user_doc is None:
            return None
        return {
            "id": str(user_doc["_id"]),
            "name": user_doc.get("name", ""),
            "email": user_doc.get("email", ""),
            "bio": user_doc.get("bio", ""),
            "avatar_color": user_doc.get("avatar_color", "#6366f1"),
            "created_at": user_doc.get("created_at", "").isoformat() if user_doc.get("created_at") else None,
        }

    @staticmethod
    def to_json(user_doc):
        """Convert user document to JSON-safe format."""
        return User._serialize(user_doc)
