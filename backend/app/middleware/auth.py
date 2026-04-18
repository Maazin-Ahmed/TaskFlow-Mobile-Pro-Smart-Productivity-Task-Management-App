"""
TaskFlow Pro — JWT Authentication Middleware
"""
import jwt
from functools import wraps
from flask import request, jsonify, current_app


def token_required(f):
    """Decorator to protect routes with JWT authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

        if not token:
            return jsonify({
                "error": "Authentication required",
                "message": "Please provide a valid access token"
            }), 401

        try:
            secret = current_app.config["JWT_SECRET_KEY"]
            payload = jwt.decode(token, secret, algorithms=["HS256"])
            current_user_id = payload["user_id"]
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Token expired",
                "message": "Your session has expired. Please log in again."
            }), 401
        except jwt.InvalidTokenError:
            return jsonify({
                "error": "Invalid token",
                "message": "Your token is invalid. Please log in again."
            }), 401

        return f(current_user_id, *args, **kwargs)

    return decorated
