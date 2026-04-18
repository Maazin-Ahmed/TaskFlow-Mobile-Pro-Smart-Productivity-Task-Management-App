"""
TaskFlow Pro — Utility Helpers
"""
import jwt
from datetime import datetime, timezone, timedelta
from flask import current_app


def generate_token(user_id):
    """Generate a JWT token for a user."""
    secret = current_app.config["JWT_SECRET_KEY"]
    expiration_hours = current_app.config.get("JWT_EXPIRATION_HOURS", 24)

    payload = {
        "user_id": str(user_id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=expiration_hours),
    }

    token = jwt.encode(payload, secret, algorithm="HS256")
    return token


def format_datetime(dt):
    """Format a datetime object for API response."""
    if dt is None:
        return None
    if isinstance(dt, str):
        return dt
    return dt.isoformat()


def get_day_name(date_str):
    """Get day name from date string."""
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        return date_obj.strftime("%a")
    except (ValueError, TypeError):
        return ""
