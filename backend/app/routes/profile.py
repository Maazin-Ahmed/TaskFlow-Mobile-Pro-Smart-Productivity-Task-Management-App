"""
TaskFlow Pro — Profile Routes
GET /api/profile/   Get profile
PUT /api/profile/   Update profile
"""
from flask import Blueprint, request, jsonify
from ..models.user import User
from ..middleware.auth import token_required

profile_bp = Blueprint("profile", __name__)


@profile_bp.route("/", methods=["GET"])
@token_required
def get_profile(current_user_id):
    """Get the current user's profile."""
    user_doc = User.find_by_id(current_user_id)
    if not user_doc:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"profile": User.to_json(user_doc)}), 200


@profile_bp.route("/", methods=["PUT"])
@token_required
def update_profile(current_user_id):
    """Update the current user's profile."""
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    bio = data.get("bio", "").strip()

    if name and len(name) < 2:
        return jsonify({"error": "Name must be at least 2 characters"}), 400
    if len(bio) > 300:
        return jsonify({"error": "Bio must be less than 300 characters"}), 400

    update_data = {}
    if name:
        update_data["name"] = name
    if "bio" in data:
        update_data["bio"] = bio

    try:
        updated = User.update(current_user_id, update_data)
        return jsonify({
            "message": "Profile updated successfully",
            "profile": User.to_json(updated)
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to update profile", "detail": str(e)}), 500
