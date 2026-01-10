"""
Routes package - Feature-based API routers
"""
from .finance import finance_router, set_db as set_finance_db
from .locations import locations_router, set_db as set_locations_db
from .teams import teams_router, set_db as set_teams_db
from .users import users_router, set_db as set_users_db
from .rsvp import rsvp_router, set_db as set_rsvp_db

__all__ = [
    'finance_router',
    'locations_router',
    'teams_router',
    'users_router',
    'rsvp_router',
    'set_finance_db',
    'set_locations_db',
    'set_teams_db',
    'set_users_db',
    'set_rsvp_db'
]
