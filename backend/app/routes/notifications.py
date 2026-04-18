"""
TaskFlow Pro — Notification Routes
GET   /api/notifications/          Get notifications
PATCH /api/notifications/<id>/read Mark as read
PATCH /api/notifications/read-all  Mark all as read
GET   /api/notifications/unread-count
"""
from flask import Blueprint, request, jsonify
from ..models.notification import Notification
from ..middleware.auth import token_required

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/", methods=["GET"])
@token_required
def get_notifications(current_user_id):
    """Get notifications for the current user."""
    unread_only = request.args.get("unread_only") == "true"
    limit = int(request.args.get("limit", 20))
    notifications = Notification.get_user_notifications(current_user_id, limit, unread_only)
    return jsonify({"notifications": notifications}), 200


@notifications_bp.route("/unread-count", methods=["GET"])
@token_required
def get_unread_count(current_user_id):
    """Get count of unread notifications."""
    count = Notification.get_unread_count(current_user_id)
    return jsonify({"count": count}), 200


@notifications_bp.route("/<notif_id>/read", methods=["PATCH"])
@token_required
def mark_read(current_user_id, notif_id):
    """Mark a notification as read."""
    success = Notification.mark_read(notif_id, current_user_id)
    if not success:
        return jsonify({"error": "Notification not found"}), 404
    return jsonify({"message": "Notification marked as read"}), 200


@notifications_bp.route("/read-all", methods=["PATCH"])
@token_required
def mark_all_read(current_user_id):
    """Mark all notifications as read."""
    Notification.mark_all_read(current_user_id)
    return jsonify({"message": "All notifications marked as read"}), 200
