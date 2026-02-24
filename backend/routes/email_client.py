"""
Email Client Router - Full IMAP/SMTP email client supporting Gmail, O365, Custom SMTP
Provides inbox reading, compose, reply, forward, trash, search, attachments
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import imaplib
import smtplib
import email as email_lib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.header import decode_header
from email.utils import parseaddr, parsedate_to_datetime
import uuid
import os
import json
import logging
import base64
from cryptography.fernet import Fernet

logger = logging.getLogger("server")

email_router = APIRouter(tags=["email-client"])

db = None

def set_db(database):
    global db
    db = database

# Encryption key for storing passwords
_ENCRYPT_KEY = os.environ.get("EMAIL_ENCRYPT_KEY")
if not _ENCRYPT_KEY:
    _ENCRYPT_KEY = Fernet.generate_key().decode()
    os.environ["EMAIL_ENCRYPT_KEY"] = _ENCRYPT_KEY

_fernet = Fernet(_ENCRYPT_KEY.encode() if isinstance(_ENCRYPT_KEY, str) else _ENCRYPT_KEY)

def encrypt_password(password: str) -> str:
    return _fernet.encrypt(password.encode()).decode()

def decrypt_password(encrypted: str) -> str:
    return _fernet.decrypt(encrypted.encode()).decode()

# Provider presets
PROVIDER_PRESETS = {
    "gmail": {
        "imap_host": "imap.gmail.com",
        "imap_port": 993,
        "smtp_host": "smtp.gmail.com",
        "smtp_port": 587,
        "use_ssl": True,
        "use_tls": True,
        "instructions": "Use an App Password (not your regular password). Go to Google Account > Security > 2-Step Verification > App Passwords. Generate a password for 'Mail' and use it here."
    },
    "office365": {
        "imap_host": "outlook.office365.com",
        "imap_port": 993,
        "smtp_host": "smtp.office365.com",
        "smtp_port": 587,
        "use_ssl": True,
        "use_tls": True,
        "instructions": "Use your Office 365 email and password. If you have MFA enabled, you may need to create an App Password in your Microsoft account security settings."
    },
    "custom": {
        "imap_host": "",
        "imap_port": 993,
        "smtp_host": "",
        "smtp_port": 587,
        "use_ssl": True,
        "use_tls": True,
        "instructions": "Enter your mail server's IMAP and SMTP settings. Contact your email provider for these details."
    }
}

def _sanitize_account(account: dict) -> dict:
    """Remove sensitive fields before returning to client"""
    safe = {k: v for k, v in account.items() if k not in ("_id", "password_encrypted")}
    safe["has_password"] = bool(account.get("password_encrypted"))
    return safe

def _decode_header_value(value):
    """Decode an email header value"""
    if not value:
        return ""
    decoded_parts = decode_header(value)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            result.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            result.append(str(part))
    return " ".join(result)

def _get_email_body(msg):
    """Extract body text from email message"""
    body_html = ""
    body_text = ""
    
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            content_disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in content_disposition:
                continue
            if content_type == "text/html":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body_html = payload.decode(charset, errors="replace")
            elif content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    charset = part.get_content_charset() or "utf-8"
                    body_text = payload.decode(charset, errors="replace")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            charset = msg.get_content_charset() or "utf-8"
            content_type = msg.get_content_type()
            decoded = payload.decode(charset, errors="replace")
            if content_type == "text/html":
                body_html = decoded
            else:
                body_text = decoded
    
    return body_html or body_text

def _get_attachments_info(msg):
    """Get list of attachment metadata from email"""
    attachments = []
    if msg.is_multipart():
        for i, part in enumerate(msg.walk()):
            content_disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in content_disposition or (part.get_content_maintype() not in ("text", "multipart") and "inline" not in content_disposition):
                filename = part.get_filename()
                if filename:
                    filename = _decode_header_value(filename)
                    size = len(part.get_payload(decode=True) or b"")
                    attachments.append({
                        "index": i,
                        "filename": filename,
                        "content_type": part.get_content_type(),
                        "size": size
                    })
    return attachments

def _connect_imap(account: dict):
    """Create an IMAP connection"""
    password = decrypt_password(account["password_encrypted"])
    if account.get("use_ssl", True):
        conn = imaplib.IMAP4_SSL(account["imap_host"], account.get("imap_port", 993))
    else:
        conn = imaplib.IMAP4(account["imap_host"], account.get("imap_port", 143))
    conn.login(account["email"], password)
    return conn


# Standard folder name alternatives for different mail servers
FOLDER_ALTERNATIVES = {
    "sent": ["Sent", "Sent Items", "Sent Messages", "[Gmail]/Sent Mail", "INBOX.Sent"],
    "drafts": ["Drafts", "[Gmail]/Drafts", "INBOX.Drafts", "Draft"],
    "trash": ["Trash", "Deleted Items", "Deleted Messages", "[Gmail]/Trash", "INBOX.Trash"],
    "spam": ["Spam", "Junk", "Junk E-mail", "[Gmail]/Spam", "INBOX.Spam", "Bulk Mail"],
    "inbox": ["INBOX"],
    "notes": ["Notes", "INBOX.Notes"],
}


def _resolve_folder(conn, folder_name: str) -> str:
    """Try to resolve a folder name to the actual IMAP folder, trying alternatives if needed"""
    # First try the exact folder name
    status, _ = conn.select(f'"{folder_name}"', readonly=True)
    if status == "OK":
        return folder_name
    
    # Try without quotes
    status, _ = conn.select(folder_name, readonly=True)
    if status == "OK":
        return folder_name
    
    # Try standard alternatives
    key = folder_name.lower().replace(" ", "")
    alternatives = FOLDER_ALTERNATIVES.get(key, [])
    
    for alt in alternatives:
        try:
            status, _ = conn.select(f'"{alt}"', readonly=True)
            if status == "OK":
                return alt
        except Exception:
            continue
        try:
            status, _ = conn.select(alt, readonly=True)
            if status == "OK":
                return alt
        except Exception:
            continue
    
    return None

def _connect_smtp(account: dict):
    """Create an SMTP connection"""
    password = decrypt_password(account["password_encrypted"])
    if account.get("use_tls", True):
        server = smtplib.SMTP(account["smtp_host"], account.get("smtp_port", 587))
        server.starttls()
    else:
        server = smtplib.SMTP_SSL(account["smtp_host"], account.get("smtp_port", 465))
    server.login(account["email"], password)
    return server


# ─── ACCOUNT MANAGEMENT ───

@email_router.get("/email-client/providers")
async def get_provider_presets():
    """Get provider presets and setup instructions"""
    return {"providers": PROVIDER_PRESETS}


@email_router.post("/email-client/accounts")
async def create_email_account(data: Dict[str, Any]):
    """Create/save an email account configuration"""
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    provider = data.get("provider", "custom")
    preset = PROVIDER_PRESETS.get(provider, PROVIDER_PRESETS["custom"])
    
    account = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "provider": provider,
        "email": data.get("email", ""),
        "display_name": data.get("display_name", ""),
        "imap_host": data.get("imap_host") or preset["imap_host"],
        "imap_port": data.get("imap_port") or preset["imap_port"],
        "smtp_host": data.get("smtp_host") or preset["smtp_host"],
        "smtp_port": data.get("smtp_port") or preset["smtp_port"],
        "use_ssl": data.get("use_ssl", preset["use_ssl"]),
        "use_tls": data.get("use_tls", preset["use_tls"]),
        "password_encrypted": encrypt_password(data.get("password", "")),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.email_accounts.insert_one(account)
    return {"success": True, "account": _sanitize_account(account)}


@email_router.get("/email-client/accounts")
async def get_email_accounts(user_id: str):
    """Get all email accounts for a user"""
    accounts = await db.email_accounts.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(20)
    return {"accounts": [_sanitize_account(a) for a in accounts]}


@email_router.put("/email-client/accounts/{account_id}")
async def update_email_account(account_id: str, data: Dict[str, Any]):
    """Update an email account"""
    update_fields = {}
    for field in ["email", "display_name", "imap_host", "imap_port", "smtp_host", "smtp_port", "use_ssl", "use_tls", "provider", "is_active"]:
        if field in data:
            update_fields[field] = data[field]
    
    if "password" in data and data["password"]:
        update_fields["password_encrypted"] = encrypt_password(data["password"])
    
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.email_accounts.update_one(
        {"id": account_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    return {"success": True, "account": _sanitize_account(account)}


@email_router.delete("/email-client/accounts/{account_id}")
async def delete_email_account(account_id: str):
    """Delete an email account"""
    result = await db.email_accounts.delete_one({"id": account_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"success": True}


@email_router.post("/email-client/accounts/{account_id}/test")
async def test_email_account(account_id: str):
    """Test IMAP and SMTP connections"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    results = {"imap": False, "smtp": False, "imap_error": None, "smtp_error": None}
    
    # Test IMAP
    try:
        conn = _connect_imap(account)
        conn.select("INBOX")
        conn.logout()
        results["imap"] = True
    except Exception as e:
        results["imap_error"] = str(e)
    
    # Test SMTP
    try:
        server = _connect_smtp(account)
        server.quit()
        results["smtp"] = True
    except Exception as e:
        results["smtp_error"] = str(e)
    
    return results


# ─── FOLDERS ───

@email_router.get("/email-client/accounts/{account_id}/folders")
async def get_email_folders(account_id: str):
    """List available IMAP folders"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        conn = _connect_imap(account)
        status, folder_list = conn.list()
        folders = []
        
        if status == "OK":
            for item in folder_list:
                if isinstance(item, bytes):
                    decoded = item.decode("utf-8", errors="replace")
                    # Parse folder name from IMAP response - handle both "/" and "." delimiters
                    parts = decoded.split(' "/" ')
                    if len(parts) < 2:
                        parts = decoded.split(' "." ')
                    if len(parts) >= 2:
                        folder_name = parts[-1].strip().strip('"')
                        # Skip IMAP internal folders
                        if folder_name.startswith("[Gmail]") and folder_name == "[Gmail]":
                            continue
                        folders.append(folder_name)
        
        conn.logout()
        
        # Ensure INBOX is always first
        if "INBOX" in folders:
            folders.remove("INBOX")
        folders.insert(0, "INBOX")
        
        return {"folders": folders}
    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error listing folders: {e}")
        raise HTTPException(status_code=500, detail=f"IMAP connection error: {str(e)}")
    except Exception as e:
        logger.error(f"Error listing folders: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list folders: {str(e)}")


# ─── MESSAGES ───

@email_router.get("/email-client/accounts/{account_id}/messages")
async def get_email_messages(
    account_id: str,
    folder: str = "INBOX",
    page: int = 1,
    per_page: int = 25,
    search: str = ""
):
    """Fetch email messages from a folder with pagination and search"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        conn = _connect_imap(account)
        
        # Resolve the folder name (handles alternative folder names)
        resolved_folder = _resolve_folder(conn, folder)
        
        if not resolved_folder:
            conn.logout()
            # Folder doesn't exist - return empty instead of error
            return {"messages": [], "total": 0, "page": page, "per_page": per_page, "total_pages": 0, "folder_missing": True}
        
        # Search
        if search:
            search_criteria = f'(OR SUBJECT "{search}" FROM "{search}" TO "{search}" BODY "{search}")'
            status, msg_ids = conn.search(None, search_criteria)
        else:
            status, msg_ids = conn.search(None, "ALL")
        
        if status != "OK":
            conn.logout()
            return {"messages": [], "total": 0, "page": page, "per_page": per_page}
        
        all_ids = msg_ids[0].split()
        all_ids.reverse()  # Newest first
        
        total = len(all_ids)
        start = (page - 1) * per_page
        end = start + per_page
        page_ids = all_ids[start:end]
        
        messages = []
        if page_ids:
            # Fetch headers for page
            ids_str = b",".join(page_ids)
            status, data = conn.fetch(ids_str, "(FLAGS RFC822.HEADER RFC822.SIZE)")
            
            if status == "OK":
                i = 0
                while i < len(data):
                    item = data[i]
                    if isinstance(item, tuple) and len(item) >= 2:
                        header_data = item[1]
                        meta_line = item[0].decode("utf-8", errors="replace") if isinstance(item[0], bytes) else str(item[0])
                        
                        # Parse UID from meta
                        uid = page_ids[len(messages)] if len(messages) < len(page_ids) else b"0"
                        
                        # Parse flags
                        is_read = "\\Seen" in meta_line
                        is_flagged = "\\Flagged" in meta_line
                        
                        # Parse size
                        size = 0
                        if "RFC822.SIZE" in meta_line:
                            try:
                                size_part = meta_line.split("RFC822.SIZE")[1]
                                size = int("".join(c for c in size_part.split(")")[0] if c.isdigit()))
                            except (ValueError, IndexError):
                                pass
                        
                        msg = email_lib.message_from_bytes(header_data)
                        
                        # Parse date
                        date_str = msg.get("Date", "")
                        try:
                            date_parsed = parsedate_to_datetime(date_str)
                            date_iso = date_parsed.isoformat()
                        except Exception:
                            date_iso = date_str
                        
                        from_name, from_email = parseaddr(msg.get("From", ""))
                        
                        messages.append({
                            "uid": uid.decode() if isinstance(uid, bytes) else str(uid),
                            "subject": _decode_header_value(msg.get("Subject", "(No Subject)")),
                            "from_name": _decode_header_value(from_name) or from_email,
                            "from_email": from_email,
                            "to": _decode_header_value(msg.get("To", "")),
                            "date": date_iso,
                            "is_read": is_read,
                            "is_flagged": is_flagged,
                            "size": size,
                            "has_attachments": False  # Will be determined when viewing
                        })
                    i += 1
        
        conn.logout()
        
        return {
            "messages": messages,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching messages: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")


@email_router.get("/email-client/accounts/{account_id}/messages/{uid}")
async def get_email_message(account_id: str, uid: str, folder: str = "INBOX"):
    """Fetch a single email with full body and attachment info"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        conn = _connect_imap(account)
        resolved_folder = _resolve_folder(conn, folder)
        if not resolved_folder:
            conn.logout()
            raise HTTPException(status_code=404, detail=f"Folder '{folder}' not found")
        
        # Fetch full message
        status, data = conn.fetch(uid.encode(), "(FLAGS RFC822)")
        
        if status != "OK" or not data or not data[0]:
            conn.logout()
            raise HTTPException(status_code=404, detail="Message not found")
        
        raw_email = None
        for item in data:
            if isinstance(item, tuple) and len(item) >= 2:
                raw_email = item[1]
                break
        
        if not raw_email:
            conn.logout()
            raise HTTPException(status_code=404, detail="Could not parse message")
        
        # Mark as read
        conn.store(uid.encode(), "+FLAGS", "\\Seen")
        conn.logout()
        
        msg = email_lib.message_from_bytes(raw_email)
        
        # Parse date
        date_str = msg.get("Date", "")
        try:
            date_parsed = parsedate_to_datetime(date_str)
            date_iso = date_parsed.isoformat()
        except Exception:
            date_iso = date_str
        
        from_name, from_email = parseaddr(msg.get("From", ""))
        
        return {
            "uid": uid,
            "subject": _decode_header_value(msg.get("Subject", "(No Subject)")),
            "from_name": _decode_header_value(from_name) or from_email,
            "from_email": from_email,
            "to": _decode_header_value(msg.get("To", "")),
            "cc": _decode_header_value(msg.get("Cc", "")),
            "date": date_iso,
            "body": _get_email_body(msg),
            "attachments": _get_attachments_info(msg),
            "message_id": msg.get("Message-ID", ""),
            "in_reply_to": msg.get("In-Reply-To", ""),
            "references": msg.get("References", "")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching message: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch message: {str(e)}")


@email_router.get("/email-client/accounts/{account_id}/messages/{uid}/attachment/{index}")
async def get_email_attachment(account_id: str, uid: str, index: int, folder: str = "INBOX"):
    """Download an email attachment"""
    from fastapi.responses import Response
    
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        conn = _connect_imap(account)
        resolved_folder = _resolve_folder(conn, folder)
        if not resolved_folder:
            conn.logout()
            raise HTTPException(status_code=404, detail=f"Folder '{folder}' not found")
        
        status, data = conn.fetch(uid.encode(), "(RFC822)")
        conn.logout()
        
        if status != "OK" or not data or not data[0]:
            raise HTTPException(status_code=404, detail="Message not found")
        
        raw_email = None
        for item in data:
            if isinstance(item, tuple) and len(item) >= 2:
                raw_email = item[1]
                break
        
        msg = email_lib.message_from_bytes(raw_email)
        
        current_index = 0
        for part in msg.walk():
            content_disposition = str(part.get("Content-Disposition", ""))
            if "attachment" in content_disposition or (part.get_content_maintype() not in ("text", "multipart") and "inline" not in content_disposition):
                if part.get_filename():
                    if current_index == index:
                        payload = part.get_payload(decode=True)
                        filename = _decode_header_value(part.get_filename())
                        content_type = part.get_content_type()
                        return Response(
                            content=payload,
                            media_type=content_type,
                            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
                        )
                    current_index += 1
        
        raise HTTPException(status_code=404, detail="Attachment not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── SEND / REPLY / FORWARD ───

@email_router.post("/email-client/accounts/{account_id}/send")
async def send_email(account_id: str, data: Dict[str, Any]):
    """Send an email"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    to_addrs = data.get("to", [])
    cc_addrs = data.get("cc", [])
    bcc_addrs = data.get("bcc", [])
    subject = data.get("subject", "")
    body = data.get("body", "")
    is_html = data.get("is_html", True)
    in_reply_to = data.get("in_reply_to", "")
    references = data.get("references", "")
    
    if not to_addrs:
        raise HTTPException(status_code=400, detail="At least one recipient is required")
    
    try:
        msg = MIMEMultipart("mixed")
        msg["From"] = f"{account.get('display_name', '')} <{account['email']}>"
        msg["To"] = ", ".join(to_addrs) if isinstance(to_addrs, list) else to_addrs
        if cc_addrs:
            msg["Cc"] = ", ".join(cc_addrs) if isinstance(cc_addrs, list) else cc_addrs
        msg["Subject"] = subject
        msg["Date"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S %z")
        
        if in_reply_to:
            msg["In-Reply-To"] = in_reply_to
        if references:
            msg["References"] = references
        
        # Body
        if is_html:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))
        
        # Handle base64 attachments from frontend
        attachments = data.get("attachments", [])
        for att in attachments:
            if att.get("data"):
                # Base64 encoded file data
                file_data = base64.b64decode(att["data"])
                part = MIMEBase("application", "octet-stream")
                part.set_payload(file_data)
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f'attachment; filename="{att.get("filename", "file")}"')
                msg.attach(part)
        
        # Send
        all_recipients = []
        if isinstance(to_addrs, list):
            all_recipients.extend(to_addrs)
        else:
            all_recipients.append(to_addrs)
        if isinstance(cc_addrs, list):
            all_recipients.extend(cc_addrs)
        if isinstance(bcc_addrs, list):
            all_recipients.extend(bcc_addrs)
        
        server = _connect_smtp(account)
        server.sendmail(account["email"], all_recipients, msg.as_string())
        server.quit()
        
        # Save to sent history in DB
        await db.email_sent.insert_one({
            "_id": str(uuid.uuid4()),
            "account_id": account_id,
            "user_id": account["user_id"],
            "to": to_addrs,
            "cc": cc_addrs,
            "subject": subject,
            "body_preview": body[:200],
            "sent_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {"success": True, "message": "Email sent successfully"}
    except smtplib.SMTPAuthenticationError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send: {str(e)}")


# ─── TRASH / DELETE ───

@email_router.put("/email-client/accounts/{account_id}/messages/{uid}/trash")
async def move_to_trash(account_id: str, uid: str, data: Dict[str, Any] = {}):
    """Move a message to trash"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    folder = data.get("folder", "INBOX")
    
    try:
        conn = _connect_imap(account)
        resolved_folder = _resolve_folder(conn, folder)
        if not resolved_folder:
            conn.logout()
            raise HTTPException(status_code=404, detail=f"Folder '{folder}' not found")
        
        # Try common trash folder names
        trash_folders = ["[Gmail]/Trash", "Trash", "Deleted Items", "Deleted"]
        trash_folder = None
        
        status, folder_list = conn.list()
        if status == "OK":
            for item in folder_list:
                decoded = item.decode("utf-8", errors="replace") if isinstance(item, bytes) else str(item)
                for tf in trash_folders:
                    if tf.lower() in decoded.lower():
                        # Extract the actual folder name
                        parts = decoded.split(' "/" ')
                        if len(parts) < 2:
                            parts = decoded.split(' "." ')
                        if len(parts) >= 2:
                            trash_folder = parts[-1].strip().strip('"')
                            break
                if trash_folder:
                    break
        
        # Re-select the source folder for the copy/delete operations
        conn.select(resolved_folder)
        
        if trash_folder:
            conn.copy(uid.encode(), trash_folder)
            conn.store(uid.encode(), "+FLAGS", "\\Deleted")
            conn.expunge()
        else:
            # No trash folder found, just mark as deleted
            conn.store(uid.encode(), "+FLAGS", "\\Deleted")
            conn.expunge()
        
        conn.logout()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moving to trash: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@email_router.delete("/email-client/accounts/{account_id}/messages/{uid}")
async def delete_message(account_id: str, uid: str, folder: str = "Trash"):
    """Permanently delete a message"""
    account = await db.email_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    try:
        conn = _connect_imap(account)
        resolved_folder = _resolve_folder(conn, folder)
        if not resolved_folder:
            conn.logout()
            raise HTTPException(status_code=404, detail=f"Folder '{folder}' not found")
        
        conn.store(uid.encode(), "+FLAGS", "\\Deleted")
        conn.expunge()
        conn.logout()
        return {"success": True}
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(status_code=500, detail=str(e))
