"""
TaskFlow Pro — Flask Application Factory
"""
from flask import Flask, jsonify
from flask_cors import CORS
from .config import config_by_name
from .extensions import init_db
import os


def create_app():
    """Create and configure the Flask application."""
    env = os.getenv("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[env])

    # Initialize CORS
    cors_origins = app.config.get("CORS_ORIGINS", "*")
    if isinstance(cors_origins, str):
        cors_origins = [o.strip() for o in cors_origins.split(",")]
    CORS(app, resources={r"/api/*": {"origins": cors_origins}},
         supports_credentials=True)

    # Initialize database
    init_db(app)

    # Register blueprints
    from .routes.auth import auth_bp
    from .routes.tasks import tasks_bp
    from .routes.profile import profile_bp
    from .routes.productivity import productivity_bp
    from .routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(profile_bp, url_prefix="/api/profile")
    app.register_blueprint(productivity_bp, url_prefix="/api/productivity")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")

    # Health check
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "message": "TaskFlow Pro API is running"}), 200

    # Global error handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "message": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found", "message": "The requested resource was not found"}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "message": "Something went wrong"}), 500

    return app
