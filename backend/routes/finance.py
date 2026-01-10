"""
Finance Router - Handles income/expense tracking for teams and league
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

# Create router
finance_router = APIRouter(prefix="/finance", tags=["finance"])

# This will be set from server.py
db = None

def set_db(database):
    global db
    db = database

# Predefined categories for income and expenses
FINANCE_CATEGORIES = {
    "income": [
        "Registration Fees",
        "Sponsorship",
        "Donations",
        "Merchandise Sales",
        "Tournament Fees",
        "Fundraising",
        "Dues",
        "Other Income"
    ],
    "expense": [
        "Equipment",
        "Uniforms",
        "Field Rental",
        "Tournament Entry",
        "Referee Fees",
        "Travel",
        "Insurance",
        "Marketing",
        "Admin & Office",
        "Coaching Fees",
        "League Fees",
        "Awards & Trophies",
        "Other Expense"
    ]
}

@finance_router.get("/categories")
async def get_finance_categories():
    """Get predefined finance categories"""
    return FINANCE_CATEGORIES

@finance_router.get("/transactions")
async def get_finance_transactions(
    scope: str = "team",
    scope_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None
):
    """
    Get finance transactions
    - scope: 'team' or 'league'
    - scope_id: team_id if scope is 'team'
    - start_date/end_date: Optional date filters (YYYY-MM-DD)
    - type: 'income' or 'expense' filter
    """
    try:
        query = {}
        
        if scope == "team" and scope_id:
            query["team_id"] = scope_id
        elif scope == "league":
            query["scope"] = "league"
        
        if type:
            query["type"] = type
            
        if start_date:
            query["date"] = {"$gte": start_date}
        if end_date:
            if "date" in query:
                query["date"]["$lte"] = end_date
            else:
                query["date"] = {"$lte": end_date}
        
        transactions = await db.finance_transactions.find(query).sort("date", -1).to_list(length=None)
        
        # Remove _id from results
        for t in transactions:
            t.pop("_id", None)
        
        # Calculate summary
        total_income = sum(t.get("amount", 0) for t in transactions if t.get("type") == "income")
        total_expense = sum(t.get("amount", 0) for t in transactions if t.get("type") == "expense")
        balance = total_income - total_expense
        
        return {
            "transactions": transactions,
            "summary": {
                "total_income": total_income,
                "total_expense": total_expense,
                "balance": balance,
                "transaction_count": len(transactions)
            }
        }
    except Exception as e:
        logger.error(f"Error fetching finance transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@finance_router.post("/transactions")
async def create_finance_transaction(transaction: Dict[str, Any]):
    """Create a new finance transaction"""
    try:
        # Validate required fields
        required_fields = ["type", "amount", "category", "date"]
        for field in required_fields:
            if field not in transaction:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        if transaction["type"] not in ["income", "expense"]:
            raise HTTPException(status_code=400, detail="Type must be 'income' or 'expense'")
        
        # Generate ID
        transaction_id = str(uuid.uuid4())
        
        # Build transaction document
        doc = {
            "id": transaction_id,
            "type": transaction["type"],
            "amount": float(transaction["amount"]),
            "category": transaction["category"],
            "date": transaction["date"],
            "description": transaction.get("description", ""),
            "team_id": transaction.get("team_id"),
            "scope": transaction.get("scope", "team"),
            "created_by": transaction.get("created_by"),
            "created_by_name": transaction.get("created_by_name"),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.finance_transactions.insert_one(doc)
        doc.pop("_id", None)
        
        logger.info(f"✅ Finance transaction created: {transaction_id} - {transaction['type']} ${transaction['amount']}")
        
        return {
            "status": "success",
            "transaction": doc
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating finance transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@finance_router.put("/transactions/{transaction_id}")
async def update_finance_transaction(transaction_id: str, transaction: Dict[str, Any]):
    """Update a finance transaction"""
    try:
        # Check if transaction exists
        existing = await db.finance_transactions.find_one({"id": transaction_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Build update document
        update_data = {
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update allowed fields
        allowed_fields = ["type", "amount", "category", "date", "description"]
        for field in allowed_fields:
            if field in transaction:
                if field == "amount":
                    update_data[field] = float(transaction[field])
                else:
                    update_data[field] = transaction[field]
        
        await db.finance_transactions.update_one(
            {"id": transaction_id},
            {"$set": update_data}
        )
        
        # Fetch updated document
        updated = await db.finance_transactions.find_one({"id": transaction_id})
        updated.pop("_id", None)
        
        logger.info(f"✅ Finance transaction updated: {transaction_id}")
        
        return {
            "status": "success",
            "transaction": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating finance transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@finance_router.delete("/transactions/{transaction_id}")
async def delete_finance_transaction(transaction_id: str):
    """Delete a finance transaction"""
    try:
        result = await db.finance_transactions.delete_one({"id": transaction_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        logger.info(f"✅ Finance transaction deleted: {transaction_id}")
        
        return {
            "status": "success",
            "message": "Transaction deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting finance transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@finance_router.get("/team/{team_id}/summary")
async def get_team_finance_summary(team_id: str):
    """Get finance summary for a specific team"""
    try:
        transactions = await db.finance_transactions.find({"team_id": team_id}).to_list(length=None)
        
        total_income = sum(t.get("amount", 0) for t in transactions if t.get("type") == "income")
        total_expense = sum(t.get("amount", 0) for t in transactions if t.get("type") == "expense")
        
        # Group by category
        income_by_category = {}
        expense_by_category = {}
        
        for t in transactions:
            category = t.get("category", "Other")
            amount = t.get("amount", 0)
            if t.get("type") == "income":
                income_by_category[category] = income_by_category.get(category, 0) + amount
            else:
                expense_by_category[category] = expense_by_category.get(category, 0) + amount
        
        return {
            "team_id": team_id,
            "total_income": total_income,
            "total_expense": total_expense,
            "balance": total_income - total_expense,
            "transaction_count": len(transactions),
            "income_by_category": income_by_category,
            "expense_by_category": expense_by_category
        }
    except Exception as e:
        logger.error(f"Error fetching team finance summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@finance_router.get("/league/summary")
async def get_league_finance_summary():
    """Get finance summary for the entire league (all teams)"""
    try:
        # Get all transactions
        all_transactions = await db.finance_transactions.find().to_list(length=None)
        
        # Get league-level transactions
        league_transactions = [t for t in all_transactions if t.get("scope") == "league"]
        
        # Group by team
        team_summaries = {}
        for t in all_transactions:
            team_id = t.get("team_id")
            if not team_id:
                continue
                
            if team_id not in team_summaries:
                team_summaries[team_id] = {
                    "team_id": team_id,
                    "total_income": 0,
                    "total_expense": 0,
                    "transaction_count": 0
                }
            
            if t.get("type") == "income":
                team_summaries[team_id]["total_income"] += t.get("amount", 0)
            else:
                team_summaries[team_id]["total_expense"] += t.get("amount", 0)
            team_summaries[team_id]["transaction_count"] += 1
        
        # Calculate balances
        for team_id in team_summaries:
            team_summaries[team_id]["balance"] = team_summaries[team_id]["total_income"] - team_summaries[team_id]["total_expense"]
        
        # League totals
        league_income = sum(t.get("amount", 0) for t in league_transactions if t.get("type") == "income")
        league_expense = sum(t.get("amount", 0) for t in league_transactions if t.get("type") == "expense")
        
        total_income = sum(t.get("amount", 0) for t in all_transactions if t.get("type") == "income")
        total_expense = sum(t.get("amount", 0) for t in all_transactions if t.get("type") == "expense")
        
        return {
            "league_income": league_income,
            "league_expense": league_expense,
            "league_balance": league_income - league_expense,
            "total_income": total_income,
            "total_expense": total_expense,
            "total_balance": total_income - total_expense,
            "team_summaries": list(team_summaries.values()),
            "total_transactions": len(all_transactions)
        }
    except Exception as e:
        logger.error(f"Error fetching league finance summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
