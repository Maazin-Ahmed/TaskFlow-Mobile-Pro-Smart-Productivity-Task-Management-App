"""
TaskFlow Pro — Notification Model
"""
from datetime import datetime, timezone
from bson import ObjectId
from ..extensions import get_db


class Notification:
    """Notification model for TaskFlow Pro."""

    COLLECTION = "notifications"

    TYPES = ["info", "success", "warning", "deadline", "achievement"]

    @staticmethod
    def create(user_id, notif_type, message):
        """Create a new notification."""
        db = get_db()
        notif_doc = {
            "user_id": user_id,
            "type": notif_type,
            "message": message,
            "read": False,
            "created_at": datetime.now(timezone.utc),
        }
        result = db[Notification.COLLECTION].insert_one(notif_doc)
        notif_doc["_id"] = result.inserted_id
        return Notification._serialize(notif_doc)

    @staticmethod
    def get_user_notifications(user_id, limit=20, unread_only=False):
        """Get notifications for a user."""
        db = get_db()
        query = {"user_id": user_id}
        if unread_only:
            query["read"] = False

        notifs = list(
            db[Notification.COLLECTION]
            .find(query)
            .sort("created_at", -1)
            .limit(limit)
        )
        return [Notification._serialize(n) for n in notifs]

    @staticmethod
    def mark_read(notif_id, user_id):
        """Mark a notification as read."""
        db = get_db()
        result = db[Notification.COLLECTION].update_one(
            {"_id": ObjectId(notif_id), "user_id": user_id},
            {"$set": {"read": True}}
        )
        return result.modified_count > 0

    @staticmethod
    def mark_all_read(user_id):
        """Mark all notifications as read for a user."""
        db = get_db()
        db[Notification.COLLECTION].update_many(
            {"user_id": user_id, "read": False},
            {"$set": {"read": True}}
        )

    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications."""
        db = get_db()
        return db[Notification.COLLECTION].count_documents(
            {"user_id": user_id, "read": False}
        )

    @staticmethod
    def _serialize(notif_doc):
        """Serialize notification document."""
        if notif_doc is None:
            return None
        return {
            "id": str(notif_doc["_id"]),
            "type": notif_doc.get("type", "info"),
            "message": notif_doc.get("message", ""),
            "read": notif_doc.get("read", False),
            "created_at": notif_doc["created_at"].isoformat() if notif_doc.get("created_at") else None,
        }
