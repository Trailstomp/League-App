"""
Routes package - Feature-based API routers
"""
from .finance import finance_router, set_db as set_finance_db
from .locations import locations_router, set_db as set_locations_db

__all__ = [
    'finance_router',
    'locations_router',
    'set_finance_db',
    'set_locations_db'
]
