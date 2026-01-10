"""
Routes package - Feature-based API routers
"""
from .finance import finance_router, set_db as set_finance_db
from .locations import locations_router, set_db as set_locations_db
from .teams import teams_router, set_db as set_teams_db
from .users import users_router, set_db as set_users_db
from .rsvp import rsvp_router, set_db as set_rsvp_db
from .drive import drive_router, set_db as set_drive_db
from .cleanup import cleanup_router, set_db as set_cleanup_db

__all__ = [
    'finance_router',
    'locations_router',
    'teams_router',
    'users_router',
    'rsvp_router',
    'drive_router',
    'cleanup_router',
    'set_finance_db',
    'set_locations_db',
    'set_teams_db',
    'set_users_db',
    'set_rsvp_db',
    'set_drive_db',
    'set_cleanup_db'
]
