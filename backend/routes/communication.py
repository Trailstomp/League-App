"""
Communication Router - Handles SMTP email config, SMS/Twilio, webhooks
Extracted from server.py during backend refactoring
"""
from fastapi import APIRouter, HTTPException, Request
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid
import os
import json
import logging

logger = logging.getLogger("server")

comms_router = APIRouter(tags=["communication"])

db = None

def set_db(database):
    global db
    db = database

# SMTP EMAIL CONFIGURATION
# ============================================================================

@comms_router.get("/smtp-config/status")
async def get_smtp_config_status():
    """Check if SMTP is configured"""
    try:
        league_data = await db.league_data.find_one({"id": "main_league"})
        
        if not league_data or not league_data.get("smtpConfig"):
            return {"configured": False}
        
        smtp_config = league_data.get("smtpConfig", {})
        
        return {
            "configured": True,
            "email": smtp_config.get("email", ""),
            "sender_name": smtp_config.get("sender_name", ""),
            "host": smtp_config.get("host", ""),
            "port": smtp_config.get("port", 587)
        }
        
    except Exception as e:
        logger.error(f"❌ Error checking SMTP status: {e}")
        return {"configured": False}


@comms_router.post("/smtp-config/save")
async def save_smtp_config(config: Dict[str, Any]):
    """Save SMTP configuration"""
    try:
        email = config.get("email", "").strip()
        password = config.get("password", "").strip()
        sender_name = config.get("sender_name", "").strip()
        
        if not email or not password:
            raise HTTPException(status_code=400, detail="Email and password are required")
        
        # Auto-detect SMTP settings
        email_domain = email.split('@')[1] if '@' in email else ''
        smtp_configs = {
            'gmail.com': {'host': 'smtp.gmail.com', 'port': 587},
            'mlbl.org': {'host': 'smtp.gmail.com', 'port': 587},  # Google Workspace
            'outlook.com': {'host': 'smtp-mail.outlook.com', 'port': 587},
            'yahoo.com': {'host': 'smtp.mail.yahoo.com', 'port': 587}
        }
        
        auto_config = smtp_configs.get(email_domain, {'host': 'smtp.gmail.com', 'port': 587})
        
        smtp_config = {
            "email": email,
            "password": password,
            "sender_name": sender_name or "League Admin",
            "host": config.get("host") or auto_config['host'],
            "port": config.get("port") or auto_config['port'],
            "tls": True,
            "configuredAt": datetime.now(timezone.utc).isoformat()
        }
        
        # Update database
        await db.league_data.update_one(
            {"id": "main_league"},
            {"$set": {"smtpConfig": smtp_config}},
            upsert=True
        )
        
        logger.info(f"✅ SMTP config saved for {email}")
        
        return {
            "status": "success",
            "message": "SMTP configuration saved successfully!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error saving SMTP config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@comms_router.post("/smtp-config/test")
async def test_smtp_connection(config: Dict[str, Any]):
    """Test SMTP connection"""
    try:
        from services.smtp_email_service import SMTPEmailService
        
        smtp_service = SMTPEmailService(config)
        result = smtp_service.test_connection()
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Error testing SMTP: {e}")
        return {
            "status": "error",
            "message": str(e)
        }


@comms_router.post("/smtp-config/send-test-email")
async def send_test_email(data: Dict[str, Any]):
    """Send a test email to verify SMTP configuration"""
    try:
        to_email = data.get("to_email")
        
        if not to_email:
            raise HTTPException(status_code=400, detail="to_email is required")
        
        # Get SMTP config
        league_data = await db.league_data.find_one({"id": "main_league"})
        if not league_data or not league_data.get("smtpConfig"):
            raise HTTPException(status_code=400, detail="SMTP not configured")
        
        smtp_config = league_data["smtpConfig"]
        
        from services.smtp_email_service import SMTPEmailService
        smtp_service = SMTPEmailService(smtp_config)
        
        # Send simple test email
        result = smtp_service.send_event_notification(
            to_emails=[to_email],
            event_title="Test Event - Email System Check",
            event_date="2025-01-15",
            event_time="19:00",
            event_location="Test Location",
            event_description="This is a test email to verify your SMTP configuration is working correctly.",
            rsvp_link="https://team-lax-portal.emergent.host",
            team_logos=[],
            calendar_event=SMTPEmailService.generate_ics_calendar_event(
                event_title="Test Event",
                event_date="2025-01-15",
                event_time="19:00",
                event_location="Test Location",
                event_description="Test event",
                duration_hours=2,
                organizer_email=smtp_config["email"]
            )
        )
        
        logger.info(f"✅ Test email sent to {to_email}")
        
        return {
            "status": "success",
            "message": f"Test email sent to {to_email}",
            "result": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending test email: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@comms_router.get("/sms-config")
async def get_sms_config():
    """Get SMS/Twilio configuration (with masked auth token)"""
    try:
        config = await db.sms_config.find_one({"id": "main_sms"})
        
        if not config:
            return {
                "id": "main_sms",
                "enabled": False,
                "account_sid": "",
                "auth_token_configured": False,
                "phone_number": "",
                "event_reminder_template": "📅 Reminder: {event_title} on {event_date} at {event_time}. Location: {location}. RSVP: {rsvp_link}",
                "rsvp_confirmation_template": "✅ Your RSVP for {event_title} has been recorded as: {response}",
                "custom_template": ""
            }
        
        config.pop('_id', None)
        
        # Mask auth token for security
        if config.get("auth_token"):
            config["auth_token_configured"] = True
            config["auth_token_masked"] = "••••••••" + config["auth_token"][-4:] if len(config["auth_token"]) > 4 else "••••"
        else:
            config["auth_token_configured"] = False
            config["auth_token_masked"] = ""
        
        # Don't return the actual auth token
        response = {
            "id": config.get("id", "main_sms"),
            "enabled": config.get("enabled", False),
            "account_sid": config.get("account_sid", ""),
            "auth_token_configured": config.get("auth_token_configured", False),
            "auth_token_masked": config.get("auth_token_masked", ""),
            "phone_number": config.get("phone_number", ""),
            "event_reminder_template": config.get("event_reminder_template", ""),
            "rsvp_confirmation_template": config.get("rsvp_confirmation_template", ""),
            "custom_template": config.get("custom_template", "")
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting SMS config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@comms_router.post("/sms-config")
async def update_sms_config(config: Dict[str, Any]):
    """Update SMS/Twilio configuration"""
    try:
        existing = await db.sms_config.find_one({"id": "main_sms"})
        
        update_data = {
            "id": "main_sms",
            "enabled": config.get("enabled", False),
            "account_sid": config.get("account_sid", ""),
            "phone_number": config.get("phone_number", ""),
            "event_reminder_template": config.get("event_reminder_template", ""),
            "rsvp_confirmation_template": config.get("rsvp_confirmation_template", ""),
            "custom_template": config.get("custom_template", ""),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Only update auth token if provided (not empty)
        if config.get("auth_token") and config["auth_token"].strip():
            update_data["auth_token"] = config["auth_token"]
        elif existing and existing.get("auth_token"):
            # Keep existing token if not provided
            update_data["auth_token"] = existing["auth_token"]
        
        await db.sms_config.replace_one(
            {"id": "main_sms"},
            update_data,
            upsert=True
        )
        
        logger.info("✅ SMS configuration updated")
        
        return {
            "status": "success",
            "message": "SMS configuration updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating SMS config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@comms_router.post("/sms-config/test")
async def test_sms_config(test_data: Dict[str, Any]):
    """Test SMS configuration by sending a test message"""
    try:
        from twilio.rest import Client as TwilioClient
        
        # Get SMS config
        config = await db.sms_config.find_one({"id": "main_sms"})
        
        if not config:
            raise HTTPException(status_code=400, detail="SMS not configured")
        
        account_sid = config.get("account_sid")
        auth_token = config.get("auth_token")
        from_number = config.get("phone_number")
        
        if not account_sid or not auth_token or not from_number:
            raise HTTPException(status_code=400, detail="SMS configuration incomplete. Please provide Account SID, Auth Token, and Phone Number.")
        
        to_number = test_data.get("to_number")
        if not to_number:
            raise HTTPException(status_code=400, detail="Please provide a test phone number")
        
        # Initialize Twilio client
        client = TwilioClient(account_sid, auth_token)
        
        # Send test message
        test_message = "🏆 Test message from your Lacrosse League! SMS notifications are configured successfully."
        
        message = client.messages.create(
            body=test_message,
            from_=from_number,
            to=to_number
        )
        
        logger.info(f"✅ Test SMS sent - SID: {message.sid}")
        
        return {
            "status": "success",
            "message": f"Test SMS sent successfully to {to_number}",
            "message_sid": message.sid
        }
        
    except Exception as e:
        logger.error(f"❌ Error testing SMS: {e}")
        error_msg = str(e)
        if "authenticate" in error_msg.lower():
            error_msg = "Authentication failed. Please check your Account SID and Auth Token."
        elif "phone number" in error_msg.lower():
            error_msg = "Invalid phone number. Please use E.164 format (e.g., +1234567890)."
        raise HTTPException(status_code=400, detail=error_msg)

@comms_router.post("/sms/send")
async def send_sms(request: SMSRequest):
    """Send SMS to multiple recipients"""
    try:
        from twilio.rest import Client as TwilioClient
        
        # Get SMS config
        config = await db.sms_config.find_one({"id": "main_sms"})
        
        if not config or not config.get("enabled"):
            raise HTTPException(status_code=400, detail="SMS notifications are not enabled")
        
        account_sid = config.get("account_sid")
        auth_token = config.get("auth_token")
        from_number = config.get("phone_number")
        
        if not account_sid or not auth_token or not from_number:
            raise HTTPException(status_code=400, detail="SMS configuration incomplete")
        
        # Initialize Twilio client
        client = TwilioClient(account_sid, auth_token)
        
        results = {
            "sent": [],
            "failed": []
        }
        
        for to_number in request.to_numbers:
            try:
                message = client.messages.create(
                    body=request.message,
                    from_=from_number,
                    to=to_number
                )
                results["sent"].append({
                    "number": to_number,
                    "message_sid": message.sid
                })
            except Exception as e:
                results["failed"].append({
                    "number": to_number,
                    "error": str(e)
                })
        
        # Log the SMS send
        await db.sms_logs.insert_one({
            "id": str(uuid.uuid4()),
            "event_id": request.event_id,
            "message": request.message,
            "recipients": len(request.to_numbers),
            "sent": len(results["sent"]),
            "failed": len(results["failed"]),
            "sent_at": datetime.now(timezone.utc).isoformat()
        })
        
        return {
            "status": "success",
            "sent_count": len(results["sent"]),
            "failed_count": len(results["failed"]),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@comms_router.post("/events/{event_id}/send-sms-notifications")
async def send_event_sms_notifications(event_id: str, notification_data: Dict[str, Any]):
    """Send SMS notifications for an event to all players with phone numbers"""
    try:
        from twilio.rest import Client as TwilioClient
        
        # Get SMS config
        config = await db.sms_config.find_one({"id": "main_sms"})
        
        if not config or not config.get("enabled"):
            raise HTTPException(status_code=400, detail="SMS notifications are not enabled")
        
        account_sid = config.get("account_sid")
        auth_token = config.get("auth_token")
        from_number = config.get("phone_number")
        
        if not account_sid or not auth_token or not from_number:
            raise HTTPException(status_code=400, detail="SMS configuration incomplete")
        
        # Get event details
        event = await db.unified_events.find_one({"id": event_id}, {"_id": 0})
        
        if not event:
            # Check leagueSchedule
            league_doc = await db.league_data.find_one({"leagueSchedule.id": event_id})
            if league_doc:
                for e in league_doc.get("leagueSchedule", []):
                    if e.get("id") == event_id:
                        event = e
                        break
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get notification type
        notification_type = notification_data.get("notification_type", "event_reminder")
        custom_message = notification_data.get("custom_message")
        target_users = notification_data.get("target_users", "all")  # all, going, maybe
        
        # Build message from template
        if custom_message:
            message = custom_message
        else:
            template = config.get(f"{notification_type}_template", config.get("event_reminder_template", ""))
            
            # Generate RSVP URL
            frontend_url = os.environ.get('FRONTEND_URL', os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000')).replace('/api', '').rstrip('/')
            rsvp_link = f"{frontend_url}/quick-rsvp/{event_id}"
            
            # Format date and time
            event_date = event.get("date", "TBD")
            event_time = event.get("time", "TBD")
            
            if event_date and event_date != "TBD":
                try:
                    date_obj = datetime.strptime(event_date, "%Y-%m-%d")
                    event_date = date_obj.strftime("%B %d, %Y")
                except:
                    pass
            
            if event_time and event_time != "TBD":
                try:
                    time_parts = event_time.split(":")
                    hour = int(time_parts[0])
                    minute = time_parts[1] if len(time_parts) > 1 else "00"
                    ampm = "PM" if hour >= 12 else "AM"
                    hour = hour % 12 or 12
                    event_time = f"{hour}:{minute} {ampm}"
                except:
                    pass
            
            message = template.format(
                event_title=event.get("title", "Event"),
                event_date=event_date,
                event_time=event_time,
                location=event.get("location", "TBD"),
                rsvp_link=rsvp_link
            )
        
        # Get users with phone numbers
        users_query = {"phone": {"$exists": True, "$ne": ""}}
        
        # Filter by team if event has teams
        if event.get("teams"):
            users_query["teamId"] = {"$in": event["teams"]}
        
        # Filter by RSVP status if specified
        if target_users != "all":
            rsvps = await db.event_rsvps.find({"event_id": event_id}).to_list(500)
            rsvp_emails = []
            for rsvp in rsvps:
                if target_users == "going" and rsvp.get("response") == "yes":
                    rsvp_emails.append(rsvp.get("user_email"))
                elif target_users == "maybe" and rsvp.get("response") == "maybe":
                    rsvp_emails.append(rsvp.get("user_email"))
            
            if rsvp_emails:
                users_query["email"] = {"$in": rsvp_emails}
        
        users = await db.users.find(users_query).to_list(500)
        
        # Also check league_data.players for legacy phone numbers
        league_doc = await db.league_data.find_one({"id": "main_league"})
        legacy_players = league_doc.get("players", []) if league_doc else []
        
        phone_numbers = set()
        for user in users:
            if user.get("phone"):
                phone = user["phone"].strip()
                if not phone.startswith("+"):
                    phone = "+1" + phone.replace("-", "").replace(" ", "")
                phone_numbers.add(phone)
        
        for player in legacy_players:
            if player.get("phone"):
                phone = player["phone"].strip()
                if not phone.startswith("+"):
                    phone = "+1" + phone.replace("-", "").replace(" ", "")
                phone_numbers.add(phone)
        
        if not phone_numbers:
            return {
                "status": "warning",
                "message": "No users with phone numbers found",
                "sent_count": 0
            }
        
        # Initialize Twilio client and send messages
        client = TwilioClient(account_sid, auth_token)
        
        results = {
            "sent": [],
            "failed": []
        }
        
        for phone in phone_numbers:
            try:
                msg = client.messages.create(
                    body=message,
                    from_=from_number,
                    to=phone
                )
                results["sent"].append({
                    "phone": phone,
                    "message_sid": msg.sid
                })
            except Exception as e:
                results["failed"].append({
                    "phone": phone,
                    "error": str(e)
                })
        
        # Log the notification
        await db.sms_logs.insert_one({
            "id": str(uuid.uuid4()),
            "event_id": event_id,
            "notification_type": notification_type,
            "message": message,
            "recipients": len(phone_numbers),
            "sent": len(results["sent"]),
            "failed": len(results["failed"]),
            "sent_at": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"✅ SMS notifications sent for event {event_id}: {len(results['sent'])} sent, {len(results['failed'])} failed")
        
        return {
            "status": "success",
            "message": f"SMS notifications sent to {len(results['sent'])} recipients",
            "sent_count": len(results["sent"]),
            "failed_count": len(results["failed"]),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@comms_router.get("/sms-logs")
async def get_sms_logs(limit: int = 50):
    """Get SMS notification logs"""
    try:
        logs = await db.sms_logs.find().sort("sent_at", -1).limit(limit).to_list(500)
        
        for log in logs:
            log.pop('_id', None)
        
        return {"logs": logs}
        
    except Exception as e:
        logger.error(f"Error getting SMS logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ TWILIO SMS WEBHOOK ENDPOINTS ============

@comms_router.post("/sms/webhook")
async def sms_incoming_webhook(request: Request):
    """
    Handle incoming SMS messages from Twilio
    Twilio sends POST data with: From, To, Body, MessageSid, etc.
    """
    try:
        # Parse form data from Twilio
        form_data = await request.form()
        
        incoming_message = {
            "id": str(uuid.uuid4()),
            "message_sid": form_data.get("MessageSid"),
            "from_number": form_data.get("From"),
            "to_number": form_data.get("To"),
            "body": form_data.get("Body", ""),
            "num_media": form_data.get("NumMedia", "0"),
            "from_city": form_data.get("FromCity"),
            "from_state": form_data.get("FromState"),
            "from_country": form_data.get("FromCountry"),
            "received_at": datetime.now(timezone.utc).isoformat(),
            "processed": False,
            "response_sent": False
        }
        
        logger.info(f"📱 Incoming SMS from {incoming_message['from_number']}: {incoming_message['body'][:50]}...")
        
        # Store the incoming message
        await db.sms_incoming.insert_one(incoming_message)
        
        # Check if this is a reply to a known user
        user = await db.users.find_one({"phone": incoming_message['from_number']})
        if user:
            incoming_message['user_id'] = user.get('id')
            incoming_message['user_name'] = user.get('name')
            await db.sms_incoming.update_one(
                {"id": incoming_message['id']},
                {"$set": {"user_id": user.get('id'), "user_name": user.get('name')}}
            )
        
        # Process keywords in the message
        body_lower = incoming_message['body'].lower().strip()
        response_message = None
        
        if body_lower in ['stop', 'unsubscribe', 'cancel']:
            # Handle opt-out
            if user:
                await db.users.update_one(
                    {"id": user['id']},
                    {"$set": {"sms_opted_out": True, "sms_opt_out_date": datetime.now(timezone.utc).isoformat()}}
                )
            response_message = "You have been unsubscribed from SMS notifications. Reply START to re-subscribe."
            
        elif body_lower in ['start', 'subscribe', 'yes']:
            # Handle opt-in
            if user:
                await db.users.update_one(
                    {"id": user['id']},
                    {"$set": {"sms_opted_out": False}}
                )
            response_message = "You have been subscribed to SMS notifications. Reply STOP to unsubscribe."
            
        elif body_lower == 'help':
            response_message = "MLBL SMS: Reply STOP to unsubscribe, START to subscribe. For support, visit our website."
        
        # Return TwiML response if we have a response message
        if response_message:
            await db.sms_incoming.update_one(
                {"id": incoming_message['id']},
                {"$set": {"processed": True, "response_sent": True, "auto_response": response_message}}
            )
            twiml_response = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{response_message}</Message></Response>'
            return Response(content=twiml_response, media_type="application/xml")
        
        # Return empty TwiML (acknowledge receipt, no response)
        return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Error processing incoming SMS: {e}")
        # Return empty response to acknowledge (don't want Twilio to retry)
        return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")


@comms_router.post("/sms/webhook/fallback")
async def sms_fallback_webhook(request: Request):
    """
    Fallback webhook when primary webhook fails
    Logs the error and stores the message for later processing
    """
    try:
        form_data = await request.form()
        
        fallback_message = {
            "id": str(uuid.uuid4()),
            "message_sid": form_data.get("MessageSid"),
            "from_number": form_data.get("From"),
            "to_number": form_data.get("To"),
            "body": form_data.get("Body", ""),
            "error_code": form_data.get("ErrorCode"),
            "error_message": form_data.get("ErrorMessage"),
            "received_at": datetime.now(timezone.utc).isoformat(),
            "is_fallback": True
        }
        
        logger.warning(f"⚠️ SMS Fallback triggered for message from {fallback_message['from_number']}")
        
        # Store in fallback collection for manual review
        await db.sms_fallback.insert_one(fallback_message)
        
        # Return acknowledgment
        return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Error in SMS fallback webhook: {e}")
        return Response(content='<?xml version="1.0" encoding="UTF-8"?><Response></Response>', media_type="application/xml")


@comms_router.post("/sms/status")
async def sms_status_callback(request: Request):
    """
    Handle delivery status callbacks from Twilio
    Tracks: queued, sent, delivered, undelivered, failed
    """
    try:
        form_data = await request.form()
        
        status_update = {
            "message_sid": form_data.get("MessageSid"),
            "message_status": form_data.get("MessageStatus"),  # queued, sent, delivered, undelivered, failed
            "to_number": form_data.get("To"),
            "from_number": form_data.get("From"),
            "error_code": form_data.get("ErrorCode"),
            "error_message": form_data.get("ErrorMessage"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        logger.info(f"📊 SMS Status Update: {status_update['message_sid']} -> {status_update['message_status']}")
        
        # Update the original SMS log with delivery status
        result = await db.sms_logs.update_one(
            {"message_sid": status_update['message_sid']},
            {"$set": {
                "delivery_status": status_update['message_status'],
                "delivery_updated_at": status_update['updated_at'],
                "error_code": status_update.get('error_code'),
                "error_message": status_update.get('error_message')
            }}
        )
        
        # Also store in status history
        await db.sms_status_history.insert_one({
            "id": str(uuid.uuid4()),
            **status_update
        })
        
        # Handle failed deliveries - could trigger alerts or retry logic
        if status_update['message_status'] in ['failed', 'undelivered']:
            logger.warning(f"❌ SMS delivery failed: {status_update['message_sid']} - {status_update.get('error_message', 'Unknown error')}")
            
            # Mark the phone number as potentially invalid if multiple failures
            if status_update.get('error_code') in ['30003', '30005', '30006']:  # Invalid number codes
                await db.sms_invalid_numbers.update_one(
                    {"phone": status_update['to_number']},
                    {"$set": {
                        "phone": status_update['to_number'],
                        "last_error": status_update.get('error_message'),
                        "last_error_code": status_update.get('error_code'),
                        "updated_at": status_update['updated_at']
                    }, "$inc": {"failure_count": 1}},
                    upsert=True
                )
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Error processing SMS status callback: {e}")
        return {"status": "error", "message": str(e)}


@comms_router.get("/sms/incoming")
async def get_incoming_sms(limit: int = 50):
    """Get incoming SMS messages"""
    try:
        messages = await db.sms_incoming.find().sort("received_at", -1).limit(limit).to_list(500)
        for msg in messages:
            msg.pop('_id', None)
        return {"messages": messages, "count": len(messages)}
    except Exception as e:
        logger.error(f"Error getting incoming SMS: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@comms_router.get("/sms/status-history")
async def get_sms_status_history(limit: int = 100):
    """Get SMS delivery status history"""
    try:
        history = await db.sms_status_history.find().sort("updated_at", -1).limit(limit).to_list(500)
        for h in history:
            h.pop('_id', None)
        return {"history": history, "count": len(history)}
    except Exception as e:
        logger.error(f"Error getting SMS status history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

