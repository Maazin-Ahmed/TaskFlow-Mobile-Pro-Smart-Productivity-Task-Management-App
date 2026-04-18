"""
TaskFlow Pro — Input Validators
"""
import re


def validate_email(email):
    """Validate email format."""
    if not email:
        return False, "Email is required"
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        return False, "Invalid email format"
    return True, None


def validate_password(password):
    """Validate password strength."""
    if not password:
        return False, "Password is required"
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one number"
    return True, None


def validate_name(name):
    """Validate user name."""
    if not name or not name.strip():
        return False, "Name is required"
    if len(name.strip()) < 2:
        return False, "Name must be at least 2 characters long"
    if len(name.strip()) > 100:
        return False, "Name must be less than 100 characters"
    return True, None


def validate_task(data):
    """Validate task data."""
    errors = []

    if not data.get("title") or not data["title"].strip():
        errors.append("Task title is required")
    elif len(data["title"].strip()) > 200:
        errors.append("Task title must be less than 200 characters")

    if data.get("priority") and data["priority"] not in ["high", "medium", "low"]:
        errors.append("Priority must be 'high', 'medium', or 'low'")

    if data.get("category") and data["category"] not in ["work", "personal", "study", "health", "finance"]:
        errors.append("Invalid category")

    if data.get("status") and data["status"] not in ["todo", "in-progress", "completed"]:
        errors.append("Status must be 'todo', 'in-progress', or 'completed'")

    if data.get("description") and len(data["description"]) > 2000:
        errors.append("Description must be less than 2000 characters")

    if errors:
        return False, errors
    return True, None
