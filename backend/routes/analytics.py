"""
Analytics Router - Page visit tracking and reporting
Tracks page views across the site with user role and team breakdowns
"""
from fastapi import APIRouter
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import logging

logger = logging.getLogger("server")

analytics_router = APIRouter(tags=["analytics"])

db = None

def set_db(database):
    global db
    db = database


@analytics_router.post("/analytics/track")
async def track_page_visit(data: Dict[str, Any]):
    """Record a page visit"""
    visit = {
        "page": data.get("page", "unknown"),
        "team_id": data.get("team_id"),
        "team_name": data.get("team_name"),
        "user_id": data.get("user_id"),
        "user_role": data.get("user_role", "guest"),
        "is_guest": not bool(data.get("user_id")),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d")
    }
    await db.page_visits.insert_one(visit)
    return {"success": True}


@analytics_router.get("/analytics/summary")
async def get_visit_summary(days: int = 30):
    """Get overall visit summary for admin dashboard"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    pipeline = [
        {"$match": {"date": {"$gte": cutoff}}},
        {"$group": {
            "_id": {
                "page": "$page",
                "team_id": "$team_id",
                "team_name": "$team_name",
                "is_guest": "$is_guest",
                "user_role": "$user_role"
            },
            "count": {"$sum": 1}
        }}
    ]
    results = await db.page_visits.aggregate(pipeline).to_list(1000)

    # Build structured summary
    pages = {}
    for r in results:
        key = r["_id"]
        page = key["page"]
        team_id = key.get("team_id")
        team_name = key.get("team_name") or team_id
        is_guest = key["is_guest"]
        role = key["user_role"] or "guest"
        count = r["count"]

        # For team pages, use team_name as the key
        if page == "team" and team_name:
            page_key = f"team:{team_id}:{team_name}"
        else:
            page_key = page

        if page_key not in pages:
            pages[page_key] = {
                "page": page,
                "team_id": team_id,
                "team_name": team_name,
                "total": 0,
                "guests": 0,
                "logged_in": 0,
                "roles": {}
            }
        pages[page_key]["total"] += count
        if is_guest:
            pages[page_key]["guests"] += count
        else:
            pages[page_key]["logged_in"] += count
            pages[page_key]["roles"][role] = pages[page_key]["roles"].get(role, 0) + count

    return {
        "period_days": days,
        "pages": list(pages.values()),
        "total_visits": sum(p["total"] for p in pages.values())
    }


@analytics_router.get("/analytics/trends")
async def get_visit_trends(days: int = 30, page: Optional[str] = None, team_id: Optional[str] = None):
    """Get daily visit trends for charts"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    match_filter = {"date": {"$gte": cutoff}}
    if page:
        match_filter["page"] = page
    if team_id:
        match_filter["team_id"] = team_id

    pipeline = [
        {"$match": match_filter},
        {"$group": {
            "_id": {
                "date": "$date",
                "is_guest": "$is_guest",
                "user_role": "$user_role"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.date": 1}}
    ]
    results = await db.page_visits.aggregate(pipeline).to_list(5000)

    # Build daily breakdown
    daily = {}
    for r in results:
        date = r["_id"]["date"]
        is_guest = r["_id"]["is_guest"]
        role = r["_id"]["user_role"] or "guest"
        count = r["count"]

        if date not in daily:
            daily[date] = {"date": date, "total": 0, "guests": 0, "logged_in": 0, "roles": {}}
        daily[date]["total"] += count
        if is_guest:
            daily[date]["guests"] += count
        else:
            daily[date]["logged_in"] += count
            daily[date]["roles"][role] = daily[date]["roles"].get(role, 0) + count

    # Fill in missing dates
    all_dates = []
    current = datetime.now(timezone.utc) - timedelta(days=days)
    while current <= datetime.now(timezone.utc):
        d = current.strftime("%Y-%m-%d")
        if d not in daily:
            daily[d] = {"date": d, "total": 0, "guests": 0, "logged_in": 0, "roles": {}}
        all_dates.append(d)
        current += timedelta(days=1)

    sorted_daily = [daily[d] for d in sorted(all_dates)]

    return {"trends": sorted_daily, "period_days": days}
