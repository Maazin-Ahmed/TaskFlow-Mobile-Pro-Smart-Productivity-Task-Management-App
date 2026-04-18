"""
TaskFlow Pro — Database & Extensions
"""
from pymongo import MongoClient

# Global database reference
db = None
mongo_client = None


def init_db(app):
    """Initialize MongoDB connection."""
    global db, mongo_client
    mongo_uri = app.config.get("MONGO_URI")
    mongo_client = MongoClient(
        mongo_uri,
        serverSelectionTimeoutMS=5000,  # Don't block app startup for 30s
        connectTimeoutMS=5000,
    )
    # Extract database name from URI, default to 'taskflow_pro'
    db_name = mongo_uri.rsplit("/", 1)[-1].split("?")[0] if "/" in mongo_uri else "taskflow_pro"
    db = mongo_client[db_name]

    # Create indexes — non-fatal if DB unavailable at startup
    try:
        _create_indexes()
    except Exception as e:
        import warnings
        warnings.warn(f"Could not create MongoDB indexes (DB may be unreachable): {e}")

    return db


def _create_indexes():
    """Create MongoDB indexes for optimal query performance."""
    global db
    if db is None:
        return

    # Users indexes
    db.users.create_index("email", unique=True)

    # Tasks indexes
    db.tasks.create_index("user_id")
    db.tasks.create_index([("user_id", 1), ("status", 1)])
    db.tasks.create_index([("user_id", 1), ("priority", 1)])
    db.tasks.create_index([("user_id", 1), ("category", 1)])
    db.tasks.create_index([("user_id", 1), ("deadline", 1)])
    db.tasks.create_index([("user_id", 1), ("created_at", -1)])

    # Productivity logs indexes
    db.productivity_logs.create_index([("user_id", 1), ("date", -1)])

    # Notifications indexes
    db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    db.notifications.create_index([("user_id", 1), ("read", 1)])


def get_db():
    """Get the database instance."""
    global db
    return db
