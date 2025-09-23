import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import json

class EncryptionService:
    """Service for encrypting/decrypting sensitive data like API keys"""
    
    def __init__(self):
        # Get encryption key from environment or generate one
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
    
    def _get_or_create_key(self):
        """Get encryption key from environment or create one"""
        # Try to get key from environment
        env_key = os.environ.get('ENCRYPTION_KEY')
        if env_key:
            return env_key.encode()
        
        # For development, use a default key derived from app name
        # In production, this should be set in environment variables
        password = os.environ.get('SECRET_KEY', 'lacrosse-league-app-default-key').encode()
        salt = b'lacrosse_league_salt'  # In production, use random salt
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def encrypt_data(self, data):
        """Encrypt sensitive data (like API keys)"""
        if not data:
            return None
        
        # Convert dict to JSON string if needed
        if isinstance(data, dict):
            data = json.dumps(data)
        
        # Encrypt the data
        encrypted_data = self.cipher.encrypt(data.encode())
        
        # Return base64 encoded string for database storage
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt_data(self, encrypted_data):
        """Decrypt sensitive data"""
        if not encrypted_data:
            return None
        
        try:
            # Decode from base64
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            
            # Decrypt the data
            decrypted_data = self.cipher.decrypt(encrypted_bytes)
            
            # Try to parse as JSON, otherwise return as string
            try:
                return json.loads(decrypted_data.decode())
            except json.JSONDecodeError:
                return decrypted_data.decode()
                
        except Exception as e:
            print(f"Failed to decrypt data: {str(e)}")
            return None
    
    def encrypt_credentials(self, credentials_dict):
        """Encrypt API credentials dictionary"""
        return self.encrypt_data(credentials_dict)
    
    def decrypt_credentials(self, encrypted_credentials):
        """Decrypt API credentials dictionary"""
        return self.decrypt_data(encrypted_credentials)

# Global instance
encryption_service = EncryptionService()