from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class APIIntegration(BaseModel):
    id: str = None
    integration_name: str  # 'groupme', 'stripe', 'twilio', etc.
    display_name: str
    credentials: Dict[str, Any]  # Encrypted storage for API keys/tokens
    settings: Dict[str, Any] = {}
    is_active: bool = True
    created_at: datetime = None
    updated_at: datetime = None
    created_by: Optional[str] = None  # User who configured it
    
    def __init__(self, **data):
        if not data.get('id'):
            data['id'] = str(uuid.uuid4())
        if not data.get('created_at'):
            data['created_at'] = datetime.utcnow().isoformat()
        if not data.get('updated_at'):
            data['updated_at'] = datetime.utcnow().isoformat()
        super().__init__(**data)

class APIIntegrationCreate(BaseModel):
    integration_name: str
    display_name: str
    credentials: Dict[str, Any]
    settings: Dict[str, Any] = {}
    is_active: bool = True

class APIIntegrationUpdate(BaseModel):
    display_name: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None
    settings: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class APIIntegrationResponse(BaseModel):
    id: str
    integration_name: str
    display_name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str]
    # Note: credentials are NOT included in response for security
    has_credentials: bool = True
    status: str = "active"  # active, error, testing