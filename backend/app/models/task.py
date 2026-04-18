"""
TaskFlow Pro — Task Model
"""
from datetime import datetime, timezone
from bson import ObjectId
from ..extensions import get_db


class Task:
    """Task model for TaskFlow Pro."""

    COLLECTION = "tasks"

    PRIORITIES = ["high", "medium", "low"]
    CATEGORIES = ["work", "personal", "study", "health", "finance"]
    STATUSES = ["todo", "in-progress", "completed"]

    @staticmethod
    def create(user_id, data):
        """Create a new task."""
        db = get_db()

        task_doc = {
            "user_id": user_id,
            "title": data["title"],
            "description": data.get("description", ""),
            "priority": data.get("priority", "medium"),
            "category": data.get("category", "work"),
            "status": data.get("status", "todo"),
            "deadline": Task._parse_date(data.get("deadline")),
            "position": data.get("position", 0),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        result = db[Task.COLLECTION].insert_one(task_doc)
        task_doc["_id"] = result.inserted_id
        return Task._serialize(task_doc)

    @staticmethod
    def find_by_user(user_id, filters=None):
        """Find all tasks for a user with optional filters."""
        db = get_db()
        query = {"user_id": user_id}

        if filters:
            if filters.get("status"):
                query["status"] = filters["status"]
            if filters.get("priority"):
                query["priority"] = filters["priority"]
            if filters.get("category"):
                query["category"] = filters["category"]
            if filters.get("search"):
                query["$or"] = [
                    {"title": {"$regex": filters["search"], "$options": "i"}},
                    {"description": {"$regex": filters["search"], "$options": "i"}},
                ]
            if filters.get("deadline_from"):
                query.setdefault("deadline", {})["$gte"] = Task._parse_date(filters["deadline_from"])
            if filters.get("deadline_to"):
                query.setdefault("deadline", {})["$lte"] = Task._parse_date(filters["deadline_to"])

        sort_field = filters.get("sort", "created_at") if filters else "created_at"
        sort_order = -1 if filters and filters.get("order") == "asc" else -1

        # Sort by position for kanban, otherwise by created_at
        if sort_field == "position":
            sort_spec = [("status", 1), ("position", 1)]
        elif sort_field == "deadline":
            sort_spec = [("deadline", 1)]
        elif sort_field == "priority":
            priority_order = {"high": 0, "medium": 1, "low": 2}
            sort_spec = [("created_at", -1)]  # Fall back, handled in-memory
        else:
            sort_spec = [("created_at", sort_order)]

        tasks = list(db[Task.COLLECTION].find(query).sort(sort_spec))
        return [Task._serialize(t) for t in tasks]

    @staticmethod
    def find_by_id(task_id, user_id=None):
        """Find a task by ID, optionally verifying ownership."""
        db = get_db()
        query = {"_id": ObjectId(task_id)}
        if user_id:
            query["user_id"] = user_id
        task = db[Task.COLLECTION].find_one(query)
        return Task._serialize(task) if task else None

    @staticmethod
    def update(task_id, user_id, data):
        """Update a task."""
        db = get_db()
        allowed_fields = {
            "title", "description", "priority", "category",
            "status", "deadline", "position"
        }
        update_data = {}
        for k, v in data.items():
            if k in allowed_fields:
                if k == "deadline":
                    update_data[k] = Task._parse_date(v)
                else:
                    update_data[k] = v

        update_data["updated_at"] = datetime.now(timezone.utc)

        result = db[Task.COLLECTION].update_one(
            {"_id": ObjectId(task_id), "user_id": user_id},
            {"$set": update_data}
        )

        if result.modified_count == 0 and result.matched_count == 0:
            return None

        return Task.find_by_id(task_id, user_id)

    @staticmethod
    def delete(task_id, user_id):
        """Delete a task."""
        db = get_db()
        result = db[Task.COLLECTION].delete_one(
            {"_id": ObjectId(task_id), "user_id": user_id}
        )
        return result.deleted_count > 0

    @staticmethod
    def update_status(task_id, user_id, status):
        """Update task status."""
        return Task.update(task_id, user_id, {"status": status})

    @staticmethod
    def reorder(user_id, task_orders):
        """Batch update task positions for kanban reordering.

        task_orders: list of {"id": ..., "status": ..., "position": ...}
        """
        db = get_db()
        for item in task_orders:
            db[Task.COLLECTION].update_one(
                {"_id": ObjectId(item["id"]), "user_id": user_id},
                {"$set": {
                    "status": item["status"],
                    "position": item["position"],
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
        return True

    @staticmethod
    def get_stats(user_id):
        """Get task statistics for a user."""
        db = get_db()
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        results = list(db[Task.COLLECTION].aggregate(pipeline))
        stats = {"total": 0, "todo": 0, "in-progress": 0, "completed": 0}
        for r in results:
            stats[r["_id"]] = r["count"]
            stats["total"] += r["count"]

        # Overdue tasks
        now = datetime.now(timezone.utc)
        overdue = db[Task.COLLECTION].count_documents({
            "user_id": user_id,
            "status": {"$ne": "completed"},
            "deadline": {"$lt": now, "$ne": None}
        })
        stats["overdue"] = overdue

        return stats

    @staticmethod
    def get_upcoming_deadlines(user_id, limit=5):
        """Get tasks with upcoming deadlines."""
        db = get_db()
        now = datetime.now(timezone.utc)
        tasks = list(db[Task.COLLECTION].find({
            "user_id": user_id,
            "status": {"$ne": "completed"},
            "deadline": {"$gte": now}
        }).sort("deadline", 1).limit(limit))
        return [Task._serialize(t) for t in tasks]

    @staticmethod
    def _parse_date(date_str):
        """Parse a date string to datetime."""
        if date_str is None or date_str == "":
            return None
        if isinstance(date_str, datetime):
            return date_str
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

    @staticmethod
    def _serialize(task_doc):
        """Serialize task document for API response."""
        if task_doc is None:
            return None
        return {
            "id": str(task_doc["_id"]),
            "user_id": task_doc.get("user_id", ""),
            "title": task_doc.get("title", ""),
            "description": task_doc.get("description", ""),
            "priority": task_doc.get("priority", "medium"),
            "category": task_doc.get("category", "work"),
            "status": task_doc.get("status", "todo"),
            "deadline": task_doc["deadline"].isoformat() if task_doc.get("deadline") else None,
            "position": task_doc.get("position", 0),
            "created_at": task_doc["created_at"].isoformat() if task_doc.get("created_at") else None,
            "updated_at": task_doc["updated_at"].isoformat() if task_doc.get("updated_at") else None,
        }
