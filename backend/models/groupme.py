from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import uuid

Base = declarative_base()

class GroupMeChannel(Base):
    """GroupMe channel/group configuration"""
    __tablename__ = "groupme_channels"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)  # Friendly name for admin
    groupme_group_id = Column(String(50), unique=True, nullable=False, index=True)
    groupme_bot_id = Column(String(50), unique=True, index=True)
    channel_type = Column(String(20), nullable=False)  # 'league' or 'team'
    team_id = Column(String, ForeignKey("teams.id"), nullable=True)  # null for league channels
    is_active = Column(Boolean, default=True)
    notification_settings = Column(JSON, default=dict)  # Custom notification preferences
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    team = relationship("Team", back_populates="groupme_channel")
    messages = relationship("GroupMeMessage", back_populates="channel")
    notifications = relationship("GroupMeNotification", back_populates="channel")

class GroupMeMessage(Base):
    """Stored GroupMe messages for display and tracking"""
    __tablename__ = "groupme_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_id = Column(String, ForeignKey("groupme_channels.id"), nullable=False)
    groupme_message_id = Column(String(50), unique=True, index=True, nullable=False)
    sender_id = Column(String(50), nullable=False)
    sender_name = Column(String(100), nullable=False)
    text = Column(Text)
    attachments = Column(JSON, default=list)  # Store attachments data
    created_at = Column(DateTime(timezone=True), nullable=False)
    message_type = Column(String(50), default="standard")  # standard, system, rsvp, command
    processed = Column(Boolean, default=False)  # For command processing
    
    # Relationships
    channel = relationship("GroupMeChannel", back_populates="messages")

class GroupMeNotification(Base):
    """Track sent notifications and delivery status"""
    __tablename__ = "groupme_notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_id = Column(String, ForeignKey("groupme_channels.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.id"), nullable=True)  # null for non-event notifications
    notification_type = Column(String(50), nullable=False)  # event_created, event_reminder, rsvp_summary, announcement
    title = Column(String(200))
    message_text = Column(Text, nullable=False)
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    delivery_status = Column(String(20), default="pending")  # pending, sent, failed
    error_message = Column(Text, nullable=True)
    
    # Relationships
    channel = relationship("GroupMeChannel", back_populates="notifications")
    event = relationship("Event", back_populates="groupme_notifications")

class EventRSVP(Base):
    """RSVP responses from GroupMe users"""
    __tablename__ = "event_rsvps"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    groupme_user_id = Column(String(50), nullable=False)
    user_name = Column(String(100), nullable=False)
    user_avatar_url = Column(String(255), nullable=True)
    response = Column(String(20), nullable=False)  # attending, not_attending, maybe
    response_time = Column(DateTime(timezone=True), server_default=func.now())
    message_id = Column(String, ForeignKey("groupme_messages.id"), nullable=True)  # Reference to the message
    
    # Relationships
    event = relationship("Event", back_populates="rsvps")
    message = relationship("GroupMeMessage")
    
    # Unique constraint to prevent duplicate RSVPs
    __table_args__ = (
        Column('event_id', 'groupme_user_id', unique=True),
    )

class NotificationFilter(Base):
    """User preferences for notifications"""
    __tablename__ = "notification_filters"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_id = Column(String, ForeignKey("groupme_channels.id"), nullable=False)
    groupme_user_id = Column(String(50), nullable=False)
    user_name = Column(String(100), nullable=False)
    
    # Notification preferences (JSON structure)
    preferences = Column(JSON, default={
        "events": {
            "games": True,
            "practices": True,
            "meetings": True,
            "reminders": True
        },
        "announcements": True,
        "rsvp_summaries": True,
        "schedule_changes": True
    })
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    channel = relationship("GroupMeChannel")
    
    # Unique constraint
    __table_args__ = (
        Column('channel_id', 'groupme_user_id', unique=True),
    )