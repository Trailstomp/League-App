from typing import Optional, Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from models.api_integrations import APIIntegration, APIIntegrationCreate, APIIntegrationUpdate
from services.encryption_service import encryption_service
from datetime import datetime

class APIIntegrationsService:
    """Service for managing API integrations and credentials"""
    
    def __init__(self, db):
        self.db = db
    
    async def get_integration(self, integration_name: str) -> Optional[Dict[str, Any]]:
        """Get integration by name"""
        integration = await self.db.api_integrations.find_one({
            "integration_name": integration_name,
            "is_active": True
        })
        
        if not integration:
            return None
        
        # Decrypt credentials
        if integration.get("encrypted_credentials"):
            credentials = encryption_service.decrypt_credentials(integration["encrypted_credentials"])
            integration["credentials"] = credentials
            
        return integration
    
    async def get_all_integrations(self) -> list:
        """Get all integrations (without sensitive credentials)"""
        cursor = self.db.api_integrations.find({})
        integrations = await cursor.to_list(length=None)
        
        print(f"🔧 DEBUG: Retrieved {len(integrations)} integrations from database")
        
        # Remove sensitive data from response
        for i, integration in enumerate(integrations):
            print(f"🔧 DEBUG: Integration {i}: {integration}")
            has_encrypted_credentials = bool(integration.get("encrypted_credentials"))
            print(f"🔧 DEBUG: Integration {i} has encrypted_credentials: {has_encrypted_credentials}")
            integration.pop("encrypted_credentials", None)
            integration["has_credentials"] = has_encrypted_credentials
            print(f"🔧 DEBUG: Integration {i} after processing: {integration}")
            
        return integrations
    
    async def create_integration(self, integration_data: APIIntegrationCreate, created_by: str = None) -> str:
        """Create new API integration"""
        print(f"🔧 DEBUG: Creating integration with data: {integration_data.dict()}")
        
        integration = APIIntegration(
            **integration_data.dict(),
            created_by=created_by
        )
        
        print(f"🔧 DEBUG: Integration object created: {integration.dict()}")
        print(f"🔧 DEBUG: Credentials to encrypt: {integration.credentials}")
        
        # Encrypt credentials
        encrypted_credentials = encryption_service.encrypt_credentials(integration.credentials)
        print(f"🔧 DEBUG: Encrypted credentials: {encrypted_credentials}")
        print(f"🔧 DEBUG: Encrypted credentials type: {type(encrypted_credentials)}")
        print(f"🔧 DEBUG: Encrypted credentials length: {len(encrypted_credentials) if encrypted_credentials else 0}")
        
        # Store in database
        db_integration = integration.dict()
        db_integration["encrypted_credentials"] = encrypted_credentials
        db_integration.pop("credentials", None)  # Remove plaintext credentials
        
        print(f"🔧 DEBUG: DB integration data: {db_integration}")
        
        result = await self.db.api_integrations.insert_one(db_integration)
        print(f"🔧 DEBUG: Insert result: {result}")
        
        return integration.id
    
    async def update_integration(self, integration_name: str, update_data: APIIntegrationUpdate) -> bool:
        """Update existing API integration"""
        update_dict = {}
        
        for field, value in update_data.dict(exclude_unset=True).items():
            if field == "credentials" and value:
                # Encrypt new credentials
                update_dict["encrypted_credentials"] = encryption_service.encrypt_credentials(value)
            else:
                update_dict[field] = value
        
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        result = await self.db.api_integrations.update_one(
            {"integration_name": integration_name},
            {"$set": update_dict}
        )
        
        return result.modified_count > 0
    
    async def delete_integration(self, integration_name: str) -> bool:
        """Delete (deactivate) API integration"""
        result = await self.db.api_integrations.update_one(
            {"integration_name": integration_name},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        return result.modified_count > 0
    
    async def test_integration(self, integration_name: str) -> Dict[str, Any]:
        """Test an API integration"""
        integration = await self.get_integration(integration_name)
        
        if not integration:
            return {"success": False, "error": "Integration not found"}
        
        if integration_name == "groupme":
            return await self._test_groupme_integration(integration["credentials"])
        
        return {"success": False, "error": "Integration type not supported for testing"}
    
    async def _test_groupme_integration(self, credentials: Dict[str, Any]) -> Dict[str, Any]:
        """Test GroupMe integration"""
        access_token = credentials.get("access_token")
        
        if not access_token:
            return {"success": False, "error": "Missing access token"}
        
        try:
            import urllib.request
            import json
            
            url = f"https://api.groupme.com/v3/groups?token={access_token}"
            request = urllib.request.Request(url)
            
            with urllib.request.urlopen(request, timeout=10) as response:
                data = json.loads(response.read().decode())
            
            if data.get('meta', {}).get('code') == 200:
                groups = data.get('response', [])
                return {
                    "success": True,
                    "groups_count": len(groups),
                    "groups": groups
                }
            else:
                return {"success": False, "error": f"GroupMe API error: {data}"}
                
        except urllib.error.HTTPError as e:
            if e.code == 401:
                return {"success": False, "error": "Invalid GroupMe access token"}
            elif e.code == 403:
                return {"success": False, "error": "GroupMe access token has insufficient permissions"}
            else:
                return {"success": False, "error": f"GroupMe API error (HTTP {e.code})"}
        except Exception as e:
            return {"success": False, "error": f"Connection failed: {str(e)}"}
    
    async def get_groupme_credentials(self) -> Optional[Dict[str, Any]]:
        """Get GroupMe credentials specifically"""
        integration = await self.get_integration("groupme")
        return integration["credentials"] if integration else None