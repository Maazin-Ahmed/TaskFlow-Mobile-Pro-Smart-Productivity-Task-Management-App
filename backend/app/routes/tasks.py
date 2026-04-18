"""
TaskFlow Pro — Task Routes
GET    /api/tasks/         List tasks (with filters)
POST   /api/tasks/         Create task
GET    /api/tasks/<id>     Get task
PUT    /api/tasks/<id>     Update task
DELETE /api/tasks/<id>     Delete task
PATCH  /api/tasks/<id>/status  Toggle status
PATCH  /api/tasks/reorder      Kanban reorder
GET    /api/tasks/stats         Task stats
GET    /api/tasks/upcoming      Upcoming deadlines
"""
from flask import Blueprint, request, jsonify
from ..models.task import Task
from ..models.productivity import ProductivityLog
from ..models.notification import Notification
from ..utils.validators import validate_task
from ..middleware.auth import token_required

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/", methods=["GET"])
@token_required
def get_tasks(current_user_id):
    """Get all tasks for the current user with optional filters."""
    filters = {
        "status": request.args.get("status"),
        "priority": request.args.get("priority"),
        "category": request.args.get("category"),
        "search": request.args.get("search"),
        "sort": request.args.get("sort", "created_at"),
        "order": request.args.get("order", "desc"),
        "deadline_from": request.args.get("deadline_from"),
        "deadline_to": request.args.get("deadline_to"),
    }
    # Remove None values
    filters = {k: v for k, v in filters.items() if v}

    tasks = Task.find_by_user(current_user_id, filters)
    return jsonify({"tasks": tasks, "count": len(tasks)}), 200


@tasks_bp.route("/", methods=["POST"])
@token_required
def create_task(current_user_id):
    """Create a new task."""
    data = request.get_json(silent=True) or {}

    valid, errors = validate_task(data)
    if not valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        task = Task.create(current_user_id, data)

        # Log productivity activity
        ProductivityLog.log_activity(current_user_id, "task_created", data.get("category"))

        return jsonify({
            "message": "Task created successfully",
            "task": task
        }), 201
    except Exception as e:
        return jsonify({"error": "Failed to create task", "detail": str(e)}), 500


@tasks_bp.route("/stats", methods=["GET"])
@token_required
def get_stats(current_user_id):
    """Get task statistics for the current user."""
    stats = Task.get_stats(current_user_id)
    return jsonify({"stats": stats}), 200


@tasks_bp.route("/upcoming", methods=["GET"])
@token_required
def get_upcoming(current_user_id):
    """Get tasks with upcoming deadlines."""
    limit = int(request.args.get("limit", 5))
    tasks = Task.get_upcoming_deadlines(current_user_id, limit)
    return jsonify({"tasks": tasks}), 200


@tasks_bp.route("/<task_id>", methods=["GET"])
@token_required
def get_task(current_user_id, task_id):
    """Get a single task by ID."""
    try:
        task = Task.find_by_id(task_id, current_user_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
        return jsonify({"task": task}), 200
    except Exception:
        return jsonify({"error": "Invalid task ID"}), 400


@tasks_bp.route("/<task_id>", methods=["PUT"])
@token_required
def update_task(current_user_id, task_id):
    """Update a task."""
    data = request.get_json(silent=True) or {}

    valid, errors = validate_task(data)
    if not valid:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    try:
        task = Task.update(task_id, current_user_id, data)
        if task is None:
            return jsonify({"error": "Task not found"}), 404
        return jsonify({"message": "Task updated successfully", "task": task}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update task", "detail": str(e)}), 500


@tasks_bp.route("/<task_id>", methods=["DELETE"])
@token_required
def delete_task(current_user_id, task_id):
    """Delete a task."""
    try:
        deleted = Task.delete(task_id, current_user_id)
        if not deleted:
            return jsonify({"error": "Task not found"}), 404

        ProductivityLog.log_activity(current_user_id, "task_deleted")
        return jsonify({"message": "Task deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to delete task", "detail": str(e)}), 500


@tasks_bp.route("/<task_id>/status", methods=["PATCH"])
@token_required
def update_status(current_user_id, task_id):
    """Update task status."""
    data = request.get_json(silent=True) or {}
    status = data.get("status")

    if status not in ["todo", "in-progress", "completed"]:
        return jsonify({"error": "Invalid status value"}), 400

    try:
        task = Task.update_status(task_id, current_user_id, status)
        if task is None:
            return jsonify({"error": "Task not found"}), 404

        # Log completion
        if status == "completed":
            ProductivityLog.log_activity(current_user_id, "task_completed", task.get("category"))
            # Check for milestone notifications
            stats = Task.get_stats(current_user_id)
            completed = stats.get("completed", 0)
            if completed in [1, 5, 10, 25, 50, 100]:
                Notification.create(
                    current_user_id,
                    "achievement",
                    f"🎉 Achievement unlocked! You've completed {completed} task{'s' if completed > 1 else ''}!"
                )

        return jsonify({"message": "Task status updated", "task": task}), 200
    except Exception as e:
        return jsonify({"error": "Failed to update status", "detail": str(e)}), 500


@tasks_bp.route("/reorder", methods=["PATCH"])
@token_required
def reorder_tasks(current_user_id):
    """Batch reorder tasks for kanban board."""
    data = request.get_json(silent=True) or {}
    task_orders = data.get("tasks", [])

    if not task_orders:
        return jsonify({"error": "No task orders provided"}), 400

    try:
        Task.reorder(current_user_id, task_orders)
        return jsonify({"message": "Tasks reordered successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to reorder tasks", "detail": str(e)}), 500
