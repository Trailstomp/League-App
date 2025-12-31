"""
Fee Management Models
Models for fee tracking, payments, and payment configurations
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class FeeType(str, Enum):
    LEAGUE_FEE = "league_fee"
    TEAM_FEE = "team_fee"
    UNIFORM = "uniform"
    TOURNAMENT = "tournament"
    EQUIPMENT = "equipment"
    CUSTOM = "custom"

class FeeAssignmentType(str, Enum):
    PER_PLAYER = "per_player"
    PER_TEAM = "per_team"

class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"
    WAIVED = "waived"
    REFUNDED = "refunded"

class PaymentMethod(str, Enum):
    STRIPE = "stripe"
    PAYPAL = "paypal"
    VENMO = "venmo"
    ZELLE = "zelle"
    CASH = "cash"
    CHECK = "check"
    OTHER = "other"

# Fee Definition Model
class FeeDefinition(BaseModel):
    id: str
    name: str
    description: Optional[str] = ""
    fee_type: FeeType = FeeType.CUSTOM
    assignment_type: FeeAssignmentType = FeeAssignmentType.PER_PLAYER
    amount: float
    currency: str = "USD"
    
    # Scope
    scope: str = "league"  # league, team
    team_id: Optional[str] = None  # If team-specific
    
    # Payment Plan Options
    allow_payment_plan: bool = False
    max_installments: int = 1
    installment_frequency_days: int = 30
    
    # Due Date
    due_date: Optional[str] = None
    
    # Auto-assign settings
    auto_assign_new_players: bool = False
    auto_assign_teams: List[str] = []
    
    # Metadata
    created_by: str  # user_id
    created_at: str
    updated_at: Optional[str] = None
    status: str = "active"  # active, archived

# Fee Assignment (individual assignment to player/team)
class FeeAssignment(BaseModel):
    id: str
    fee_id: str  # Reference to FeeDefinition
    fee_name: str  # Denormalized for display
    
    # Assignment Target
    assignment_type: FeeAssignmentType
    player_id: Optional[str] = None
    player_name: Optional[str] = None
    player_email: Optional[str] = None
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    
    # Amount Details
    total_amount: float
    amount_paid: float = 0.0
    amount_due: float  # Computed: total_amount - amount_paid
    currency: str = "USD"
    
    # Payment Plan
    is_payment_plan: bool = False
    installments_total: int = 1
    installments_paid: int = 0
    next_installment_amount: Optional[float] = None
    next_installment_date: Optional[str] = None
    
    # Status
    status: PaymentStatus = PaymentStatus.UNPAID
    due_date: Optional[str] = None
    
    # Tracking
    assigned_by: str  # user_id
    assigned_at: str
    last_payment_date: Optional[str] = None
    notes: Optional[str] = None

# Individual Payment Record
class PaymentRecord(BaseModel):
    id: str
    assignment_id: str  # Reference to FeeAssignment
    fee_id: str
    
    # Payment Details
    amount: float
    currency: str = "USD"
    payment_method: PaymentMethod
    
    # Transaction Info
    transaction_id: Optional[str] = None  # External payment provider ID
    payment_provider: Optional[str] = None  # stripe, paypal, etc.
    
    # Status
    status: str = "completed"  # pending, completed, failed, refunded
    
    # Metadata
    paid_by: Optional[str] = None  # user_id of payer
    paid_by_name: Optional[str] = None
    recorded_by: str  # user_id of person recording payment
    payment_date: str
    notes: Optional[str] = None
    receipt_url: Optional[str] = None

# Payment Configuration (per league or team)
class PaymentConfig(BaseModel):
    id: str
    scope: str = "league"  # league, team
    team_id: Optional[str] = None
    
    # Stripe
    stripe_enabled: bool = False
    stripe_account_id: Optional[str] = None  # For Stripe Connect
    stripe_publishable_key: Optional[str] = None
    
    # PayPal
    paypal_enabled: bool = False
    paypal_client_id: Optional[str] = None
    paypal_email: Optional[str] = None  # For manual tracking
    
    # Venmo
    venmo_enabled: bool = False
    venmo_username: Optional[str] = None
    
    # Zelle
    zelle_enabled: bool = False
    zelle_email: Optional[str] = None
    zelle_phone: Optional[str] = None
    
    # Cash/Check
    cash_enabled: bool = True
    check_enabled: bool = True
    check_payable_to: Optional[str] = None
    
    # Instructions
    payment_instructions: Optional[str] = None
    
    # Notifications
    send_reminders: bool = True
    reminder_days_before: List[int] = [7, 3, 1]  # Days before due date
    
    # Metadata
    updated_by: Optional[str] = None
    updated_at: Optional[str] = None

# API Request/Response Models
class CreateFeeRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    fee_type: str = "custom"
    assignment_type: str = "per_player"
    amount: float
    currency: str = "USD"
    scope: str = "league"
    team_id: Optional[str] = None
    allow_payment_plan: bool = False
    max_installments: int = 1
    installment_frequency_days: int = 30
    due_date: Optional[str] = None
    auto_assign_new_players: bool = False
    auto_assign_teams: List[str] = []

class AssignFeeRequest(BaseModel):
    fee_id: str
    player_ids: List[str] = []
    team_ids: List[str] = []
    use_payment_plan: bool = False
    installments: int = 1
    custom_due_date: Optional[str] = None
    notes: Optional[str] = None

class RecordPaymentRequest(BaseModel):
    assignment_id: str
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    payment_date: Optional[str] = None
    notes: Optional[str] = None

class UpdatePaymentConfigRequest(BaseModel):
    stripe_enabled: Optional[bool] = None
    stripe_publishable_key: Optional[str] = None
    paypal_enabled: Optional[bool] = None
    paypal_client_id: Optional[str] = None
    paypal_email: Optional[str] = None
    venmo_enabled: Optional[bool] = None
    venmo_username: Optional[str] = None
    zelle_enabled: Optional[bool] = None
    zelle_email: Optional[str] = None
    zelle_phone: Optional[str] = None
    cash_enabled: Optional[bool] = None
    check_enabled: Optional[bool] = None
    check_payable_to: Optional[str] = None
    payment_instructions: Optional[str] = None
    send_reminders: Optional[bool] = None
    reminder_days_before: Optional[List[int]] = None
