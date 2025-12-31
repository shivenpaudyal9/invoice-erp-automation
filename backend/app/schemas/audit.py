from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Any, Dict


class AuditLogResponse(BaseModel):
    id: str
    invoice_id: str
    timestamp: datetime
    action: str
    user_id: Optional[str]
    user_email: Optional[str]
    changes: Optional[Dict[str, Any]]
    ai_model: Optional[str]
    ai_model_version: Optional[str]
    extra_data: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    logs: List[AuditLogResponse]
    total: int
