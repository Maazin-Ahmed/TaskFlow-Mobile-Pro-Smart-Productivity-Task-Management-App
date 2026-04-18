"""
TaskFlow Pro — Authentication Routes
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/change-password
POST /api/auth/logout
"""
from flask import Blueprint, request, jsonify
from ..models.user import User
from ..models.notification import Notification
from ..utils.validators import validate_email, validate_password, validate_name
from ..utils.helpers import generate_token
from ..middleware.auth import token_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user."""
    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    # Validate inputs
    valid_name, name_err = validate_name(name)
    if not valid_name:
        return jsonify({"error": name_err}), 400

    valid_email, email_err = validate_email(email)
    if not valid_email:
        return jsonify({"error": email_err}), 400

    valid_pwd, pwd_err = validate_password(password)
    if not valid_pwd:
        return jsonify({"error": pwd_err}), 400

    # Check if email already exists
    existing = User.find_by_email(email)
    if existing:
        return jsonify({"error": "An account with this email already exists"}), 409

    # Create user
    try:
        user = User.create(name, email, password)
        token = generate_token(user["id"])

        # Welcome notification
        Notification.create(
            user["id"],
            "success",
            f"Welcome to TaskFlow Pro, {name}! Start by creating your first task."
        )

        return jsonify({
            "message": "Account created successfully",
            "user": user,
            "token": token
        }), 201

    except Exception as e:
        return jsonify({"error": "Failed to create account", "detail": str(e)}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """Log in an existing user."""
    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    # Find user
    user_doc = User.find_by_email(email)
    if not user_doc:
        return jsonify({"error": "Invalid email or password"}), 401

    # Verify password
    if not User.verify_password(user_doc["password_hash"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    user = User.to_json(user_doc)
    token = generate_token(user["id"])

    return jsonify({
        "message": "Logged in successfully",
        "user": user,
        "token": token
    }), 200


@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user_id):
    """Get the current authenticated user."""
    user_doc = User.find_by_id(current_user_id)
    if not user_doc:
        return jsonify({"error": "User not found"}), 404

    return jsonify({"user": User.to_json(user_doc)}), 200


@auth_bp.route("/change-password", methods=["POST"])
@token_required
def change_password(current_user_id):
    """Change current user's password."""
    data = request.get_json(silent=True) or {}

    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "Current password and new password are required"}), 400

    # Verify current password
    user_doc = User.find_by_id(current_user_id)
    if not User.verify_password(user_doc["password_hash"], current_password):
        return jsonify({"error": "Current password is incorrect"}), 400

    # Validate new password
    valid, err = validate_password(new_password)
    if not valid:
        return jsonify({"error": err}), 400

    if current_password == new_password:
        return jsonify({"error": "New password must be different from the current password"}), 400

    User.change_password(current_user_id, new_password)
    return jsonify({"message": "Password changed successfully"}), 200


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout(current_user_id):
    """Logout endpoint (client-side token removal)."""
    return jsonify({"message": "Logged out successfully"}), 200
