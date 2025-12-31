"""
Fee Management Service
Handles fee creation, assignment, payment tracking, and payment processing
"""
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from uuid import uuid4

logger = logging.getLogger(__name__)

class FeeService:
    """Service for managing fees and payments"""
    
    def __init__(self, db):
        self.db = db
    
    # ==================== FEE DEFINITIONS ====================
    
    async def create_fee(self, fee_data: Dict[str, Any], created_by: str) -> Dict[str, Any]:
        """Create a new fee definition"""
        fee = {
            "id": str(uuid4()),
            "name": fee_data.get("name"),
            "description": fee_data.get("description", ""),
            "fee_type": fee_data.get("fee_type", "custom"),
            "assignment_type": fee_data.get("assignment_type", "per_player"),
            "amount": float(fee_data.get("amount", 0)),
            "currency": fee_data.get("currency", "USD"),
            "scope": fee_data.get("scope", "league"),
            "team_id": fee_data.get("team_id"),
            "allow_payment_plan": fee_data.get("allow_payment_plan", False),
            "max_installments": fee_data.get("max_installments", 1),
            "installment_frequency_days": fee_data.get("installment_frequency_days", 30),
            "due_date": fee_data.get("due_date"),
            "auto_assign_new_players": fee_data.get("auto_assign_new_players", False),
            "auto_assign_teams": fee_data.get("auto_assign_teams", []),
            "created_by": created_by,
            "created_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        
        await self.db.fees.insert_one(fee)
        logger.info(f"Created fee: {fee['id']} - {fee['name']}")
        return fee
    
    async def get_fees(self, scope: str = None, team_id: str = None, include_archived: bool = False) -> List[Dict]:
        """Get all fee definitions"""
        query = {}
        
        if scope:
            query["scope"] = scope
        if team_id:
            query["team_id"] = team_id
        if not include_archived:
            query["status"] = "active"
        
        fees = await self.db.fees.find(query, {"_id": 0}).to_list(length=None)
        return fees
    
    async def get_fee(self, fee_id: str) -> Optional[Dict]:
        """Get a single fee by ID"""
        fee = await self.db.fees.find_one({"id": fee_id}, {"_id": 0})
        return fee
    
    async def update_fee(self, fee_id: str, updates: Dict[str, Any], updated_by: str) -> Optional[Dict]:
        """Update a fee definition"""
        updates["updated_at"] = datetime.utcnow().isoformat()
        updates["updated_by"] = updated_by
        
        result = await self.db.fees.update_one(
            {"id": fee_id},
            {"$set": updates}
        )
        
        if result.modified_count > 0:
            return await self.get_fee(fee_id)
        return None
    
    async def archive_fee(self, fee_id: str) -> bool:
        """Archive a fee (soft delete)"""
        result = await self.db.fees.update_one(
            {"id": fee_id},
            {"$set": {"status": "archived", "updated_at": datetime.utcnow().isoformat()}}
        )
        return result.modified_count > 0
    
    # ==================== FEE ASSIGNMENTS ====================
    
    async def assign_fee(
        self,
        fee_id: str,
        assigned_by: str,
        player_ids: List[str] = None,
        team_ids: List[str] = None,
        use_payment_plan: bool = False,
        installments: int = 1,
        custom_due_date: str = None,
        notes: str = None
    ) -> List[Dict]:
        """Assign a fee to players or teams"""
        fee = await self.get_fee(fee_id)
        if not fee:
            raise ValueError(f"Fee {fee_id} not found")
        
        assignments = []
        now = datetime.utcnow().isoformat()
        due_date = custom_due_date or fee.get("due_date")
        
        # Get player/team details
        if player_ids:
            for player_id in player_ids:
                # Look up player info
                player = await self.db.users.find_one({"id": player_id}, {"_id": 0})
                if not player:
                    # Try league_data players
                    league_data = await self.db.league_data.find_one({"id": "main_league"})
                    if league_data:
                        player = next((p for p in league_data.get("players", []) if p.get("id") == player_id), None)
                
                player_name = player.get("name", "Unknown") if player else "Unknown"
                player_email = player.get("email", "") if player else ""
                
                assignment = await self._create_assignment(
                    fee=fee,
                    assignment_type="per_player",
                    player_id=player_id,
                    player_name=player_name,
                    player_email=player_email,
                    assigned_by=assigned_by,
                    use_payment_plan=use_payment_plan and fee.get("allow_payment_plan", False),
                    installments=min(installments, fee.get("max_installments", 1)),
                    due_date=due_date,
                    notes=notes
                )
                assignments.append(assignment)
        
        if team_ids:
            for team_id in team_ids:
                # Look up team info
                team = await self.db.teams.find_one({"id": team_id}, {"_id": 0})
                if not team:
                    league_data = await self.db.league_data.find_one({"id": "main_league"})
                    if league_data:
                        team = next((t for t in league_data.get("teams", []) if t.get("id") == team_id), None)
                
                team_name = team.get("name", "Unknown") if team else "Unknown"
                
                assignment = await self._create_assignment(
                    fee=fee,
                    assignment_type="per_team",
                    team_id=team_id,
                    team_name=team_name,
                    assigned_by=assigned_by,
                    use_payment_plan=use_payment_plan and fee.get("allow_payment_plan", False),
                    installments=min(installments, fee.get("max_installments", 1)),
                    due_date=due_date,
                    notes=notes
                )
                assignments.append(assignment)
        
        logger.info(f"Created {len(assignments)} fee assignments for fee {fee_id}")
        return assignments
    
    async def _create_assignment(
        self,
        fee: Dict,
        assignment_type: str,
        assigned_by: str,
        player_id: str = None,
        player_name: str = None,
        player_email: str = None,
        team_id: str = None,
        team_name: str = None,
        use_payment_plan: bool = False,
        installments: int = 1,
        due_date: str = None,
        notes: str = None
    ) -> Dict:
        """Create a single fee assignment"""
        total_amount = fee["amount"]
        installment_amount = total_amount / installments if use_payment_plan else total_amount
        
        assignment = {
            "id": str(uuid4()),
            "fee_id": fee["id"],
            "fee_name": fee["name"],
            "assignment_type": assignment_type,
            "player_id": player_id,
            "player_name": player_name,
            "player_email": player_email,
            "team_id": team_id,
            "team_name": team_name,
            "total_amount": total_amount,
            "amount_paid": 0.0,
            "amount_due": total_amount,
            "currency": fee.get("currency", "USD"),
            "is_payment_plan": use_payment_plan,
            "installments_total": installments,
            "installments_paid": 0,
            "next_installment_amount": installment_amount if use_payment_plan else None,
            "next_installment_date": due_date,
            "status": "unpaid",
            "due_date": due_date,
            "assigned_by": assigned_by,
            "assigned_at": datetime.utcnow().isoformat(),
            "notes": notes
        }
        
        await self.db.fee_assignments.insert_one(assignment)
        return assignment
    
    async def get_assignments(
        self,
        fee_id: str = None,
        player_id: str = None,
        team_id: str = None,
        status: str = None,
        scope: str = None
    ) -> List[Dict]:
        """Get fee assignments with optional filters"""
        query = {}
        
        if fee_id:
            query["fee_id"] = fee_id
        if player_id:
            query["player_id"] = player_id
        if team_id:
            query["team_id"] = team_id
        if status:
            query["status"] = status
        
        assignments = await self.db.fee_assignments.find(query, {"_id": 0}).to_list(length=None)
        return assignments
    
    async def get_assignment(self, assignment_id: str) -> Optional[Dict]:
        """Get a single assignment by ID"""
        assignment = await self.db.fee_assignments.find_one({"id": assignment_id}, {"_id": 0})
        return assignment
    
    async def update_assignment_status(self, assignment_id: str) -> Optional[Dict]:
        """Update assignment status based on payments"""
        assignment = await self.get_assignment(assignment_id)
        if not assignment:
            return None
        
        # Determine status
        if assignment["amount_paid"] >= assignment["total_amount"]:
            status = "paid"
        elif assignment["amount_paid"] > 0:
            status = "partial"
        elif assignment.get("due_date"):
            due = datetime.fromisoformat(assignment["due_date"].replace('Z', '+00:00'))
            if datetime.utcnow() > due:
                status = "overdue"
            else:
                status = "unpaid"
        else:
            status = "unpaid"
        
        await self.db.fee_assignments.update_one(
            {"id": assignment_id},
            {"$set": {"status": status}}
        )
        
        assignment["status"] = status
        return assignment
    
    # ==================== PAYMENTS ====================
    
    async def record_payment(
        self,
        assignment_id: str,
        amount: float,
        payment_method: str,
        recorded_by: str,
        transaction_id: str = None,
        payment_date: str = None,
        paid_by: str = None,
        paid_by_name: str = None,
        notes: str = None,
        receipt_url: str = None
    ) -> Dict:
        """Record a payment for a fee assignment"""
        assignment = await self.get_assignment(assignment_id)
        if not assignment:
            raise ValueError(f"Assignment {assignment_id} not found")
        
        payment = {
            "id": str(uuid4()),
            "assignment_id": assignment_id,
            "fee_id": assignment["fee_id"],
            "amount": float(amount),
            "currency": assignment.get("currency", "USD"),
            "payment_method": payment_method,
            "transaction_id": transaction_id,
            "payment_provider": payment_method if payment_method in ["stripe", "paypal", "venmo"] else None,
            "status": "completed",
            "paid_by": paid_by,
            "paid_by_name": paid_by_name,
            "recorded_by": recorded_by,
            "payment_date": payment_date or datetime.utcnow().isoformat(),
            "notes": notes,
            "receipt_url": receipt_url
        }
        
        await self.db.payments.insert_one(payment)
        
        # Update assignment
        new_amount_paid = assignment["amount_paid"] + amount
        new_amount_due = assignment["total_amount"] - new_amount_paid
        new_installments_paid = assignment["installments_paid"] + 1
        
        # Calculate next installment date if payment plan
        next_date = None
        if assignment["is_payment_plan"] and new_installments_paid < assignment["installments_total"]:
            fee = await self.get_fee(assignment["fee_id"])
            if fee:
                freq_days = fee.get("installment_frequency_days", 30)
                next_date = (datetime.utcnow() + timedelta(days=freq_days)).isoformat()
        
        await self.db.fee_assignments.update_one(
            {"id": assignment_id},
            {"$set": {
                "amount_paid": new_amount_paid,
                "amount_due": max(0, new_amount_due),
                "installments_paid": new_installments_paid,
                "next_installment_date": next_date,
                "last_payment_date": payment["payment_date"]
            }}
        )
        
        # Update status
        await self.update_assignment_status(assignment_id)
        
        logger.info(f"Recorded payment {payment['id']} for assignment {assignment_id}")
        return payment
    
    async def get_payments(
        self,
        assignment_id: str = None,
        fee_id: str = None,
        payment_method: str = None
    ) -> List[Dict]:
        """Get payment records"""
        query = {}
        
        if assignment_id:
            query["assignment_id"] = assignment_id
        if fee_id:
            query["fee_id"] = fee_id
        if payment_method:
            query["payment_method"] = payment_method
        
        payments = await self.db.payments.find(query, {"_id": 0}).to_list(length=None)
        return payments
    
    # ==================== PAYMENT CONFIGURATION ====================
    
    async def get_payment_config(self, scope: str = "league", team_id: str = None) -> Dict:
        """Get payment configuration"""
        query = {"scope": scope}
        if team_id:
            query["team_id"] = team_id
        
        config = await self.db.payment_configs.find_one(query, {"_id": 0})
        
        if not config:
            # Return default config
            config = {
                "id": str(uuid4()),
                "scope": scope,
                "team_id": team_id,
                "stripe_enabled": False,
                "paypal_enabled": False,
                "venmo_enabled": False,
                "zelle_enabled": False,
                "cash_enabled": True,
                "check_enabled": True,
                "send_reminders": True,
                "reminder_days_before": [7, 3, 1]
            }
        
        return config
    
    async def update_payment_config(
        self,
        config_data: Dict[str, Any],
        scope: str = "league",
        team_id: str = None,
        updated_by: str = None
    ) -> Dict:
        """Update payment configuration"""
        query = {"scope": scope}
        if team_id:
            query["team_id"] = team_id
        
        existing = await self.db.payment_configs.find_one(query)
        
        config_data["scope"] = scope
        config_data["team_id"] = team_id
        config_data["updated_by"] = updated_by
        config_data["updated_at"] = datetime.utcnow().isoformat()
        
        if existing:
            config_data["id"] = existing.get("id", str(uuid4()))
            await self.db.payment_configs.replace_one(query, config_data)
        else:
            config_data["id"] = str(uuid4())
            await self.db.payment_configs.insert_one(config_data)
        
        config_data.pop("_id", None)
        return config_data
    
    # ==================== REPORTS & SUMMARIES ====================
    
    async def get_fee_summary(self, fee_id: str = None, team_id: str = None) -> Dict:
        """Get summary statistics for fees"""
        query = {}
        if fee_id:
            query["fee_id"] = fee_id
        if team_id:
            query["team_id"] = team_id
        
        assignments = await self.db.fee_assignments.find(query, {"_id": 0}).to_list(length=None)
        
        total_assigned = len(assignments)
        total_amount = sum(a.get("total_amount", 0) for a in assignments)
        total_collected = sum(a.get("amount_paid", 0) for a in assignments)
        total_outstanding = sum(a.get("amount_due", 0) for a in assignments)
        
        status_counts = {
            "paid": len([a for a in assignments if a.get("status") == "paid"]),
            "partial": len([a for a in assignments if a.get("status") == "partial"]),
            "unpaid": len([a for a in assignments if a.get("status") == "unpaid"]),
            "overdue": len([a for a in assignments if a.get("status") == "overdue"]),
            "waived": len([a for a in assignments if a.get("status") == "waived"])
        }
        
        return {
            "total_assigned": total_assigned,
            "total_amount": total_amount,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding,
            "collection_rate": (total_collected / total_amount * 100) if total_amount > 0 else 0,
            "status_counts": status_counts
        }
    
    async def get_player_fees(self, player_id: str) -> Dict:
        """Get all fees for a specific player"""
        assignments = await self.get_assignments(player_id=player_id)
        
        total_due = sum(a.get("amount_due", 0) for a in assignments)
        total_paid = sum(a.get("amount_paid", 0) for a in assignments)
        
        return {
            "player_id": player_id,
            "assignments": assignments,
            "total_due": total_due,
            "total_paid": total_paid,
            "has_outstanding": total_due > 0
        }
    
    async def get_overdue_assignments(self) -> List[Dict]:
        """Get all overdue fee assignments"""
        now = datetime.utcnow().isoformat()
        
        assignments = await self.db.fee_assignments.find({
            "status": {"$in": ["unpaid", "partial"]},
            "due_date": {"$lt": now}
        }, {"_id": 0}).to_list(length=None)
        
        # Update status to overdue
        for assignment in assignments:
            if assignment.get("status") != "overdue":
                await self.db.fee_assignments.update_one(
                    {"id": assignment["id"]},
                    {"$set": {"status": "overdue"}}
                )
                assignment["status"] = "overdue"
        
        return assignments

# Create singleton instance (will be initialized with db in server.py)
fee_service = None
