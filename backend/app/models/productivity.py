"""
TaskFlow Pro — Productivity Log Model
"""
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from ..extensions import get_db


class ProductivityLog:
    """Productivity log model for tracking daily task completion."""

    COLLECTION = "productivity_logs"

    @staticmethod
    def log_activity(user_id, action, category=None):
        """Log a productivity activity (task created, completed, etc.)."""
        db = get_db()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # Upsert daily log
        update = {"$set": {"user_id": user_id, "date": today}}

        if action == "task_completed":
            update["$inc"] = {"tasks_completed": 1}
        elif action == "task_created":
            update["$inc"] = {"tasks_created": 1}
        elif action == "task_deleted":
            update["$inc"] = {"tasks_deleted": 1}

        if category:
            update.setdefault("$inc", {})
            update["$inc"][f"categories.{category}"] = 1

        db[ProductivityLog.COLLECTION].update_one(
            {"user_id": user_id, "date": today},
            update,
            upsert=True
        )

    @staticmethod
    def get_weekly(user_id):
        """Get the last 7 days of productivity data."""
        db = get_db()
        today = datetime.now(timezone.utc)
        dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]

        logs = list(db[ProductivityLog.COLLECTION].find({
            "user_id": user_id,
            "date": {"$in": dates}
        }).sort("date", 1))

        # Build complete 7-day dataset (fill missing days with zeros)
        log_map = {log["date"]: log for log in logs}
        result = []
        for date_str in dates:
            if date_str in log_map:
                log = log_map[date_str]
                result.append({
                    "date": date_str,
                    "tasks_completed": log.get("tasks_completed", 0),
                    "tasks_created": log.get("tasks_created", 0),
                })
            else:
                result.append({
                    "date": date_str,
                    "tasks_completed": 0,
                    "tasks_created": 0,
                })

        return result

    @staticmethod
    def get_monthly(user_id):
        """Get the last 30 days of productivity data."""
        db = get_db()
        today = datetime.now(timezone.utc)
        dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(29, -1, -1)]

        logs = list(db[ProductivityLog.COLLECTION].find({
            "user_id": user_id,
            "date": {"$in": dates}
        }).sort("date", 1))

        log_map = {log["date"]: log for log in logs}
        result = []
        for date_str in dates:
            if date_str in log_map:
                log = log_map[date_str]
                result.append({
                    "date": date_str,
                    "tasks_completed": log.get("tasks_completed", 0),
                    "tasks_created": log.get("tasks_created", 0),
                })
            else:
                result.append({
                    "date": date_str,
                    "tasks_completed": 0,
                    "tasks_created": 0,
                })

        return result

    @staticmethod
    def get_summary(user_id):
        """Get overall productivity summary."""
        db = get_db()
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "total_completed": {"$sum": "$tasks_completed"},
                "total_created": {"$sum": "$tasks_created"},
                "active_days": {"$sum": 1},
            }}
        ]
        result = list(db[ProductivityLog.COLLECTION].aggregate(pipeline))

        if result:
            return {
                "total_completed": result[0].get("total_completed", 0),
                "total_created": result[0].get("total_created", 0),
                "active_days": result[0].get("active_days", 0),
                "completion_rate": round(
                    result[0].get("total_completed", 0) /
                    max(result[0].get("total_created", 1), 1) * 100, 1
                )
            }
        return {
            "total_completed": 0,
            "total_created": 0,
            "active_days": 0,
            "completion_rate": 0
        }
