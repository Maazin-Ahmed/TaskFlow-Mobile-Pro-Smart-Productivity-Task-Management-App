"""
TaskFlow Pro — Productivity Routes
GET /api/productivity/weekly   Weekly stats
GET /api/productivity/monthly  Monthly stats
GET /api/productivity/summary  Overall summary
"""
from flask import Blueprint, request, jsonify
from ..models.productivity import ProductivityLog
from ..utils.helpers import get_day_name
from ..middleware.auth import token_required

productivity_bp = Blueprint("productivity", __name__)


@productivity_bp.route("/weekly", methods=["GET"])
@token_required
def get_weekly(current_user_id):
    """Get last 7 days of productivity data."""
    data = ProductivityLog.get_weekly(current_user_id)

    # Enrich with day names
    for entry in data:
        entry["day"] = get_day_name(entry["date"])

    return jsonify({"data": data}), 200


@productivity_bp.route("/monthly", methods=["GET"])
@token_required
def get_monthly(current_user_id):
    """Get last 30 days of productivity data."""
    data = ProductivityLog.get_monthly(current_user_id)
    return jsonify({"data": data}), 200


@productivity_bp.route("/summary", methods=["GET"])
@token_required
def get_summary(current_user_id):
    """Get overall productivity summary."""
    summary = ProductivityLog.get_summary(current_user_id)
    return jsonify({"summary": summary}), 200
