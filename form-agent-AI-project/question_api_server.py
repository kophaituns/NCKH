#!/usr/bin/env python3
"""
Question Generation API Server
FastAPI server để serve question generation model
"""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
import pickle
import os
import sys
from datetime import datetime

# Windows DLL loading fix for torch
if os.name == 'nt':
    # Try multiple possible paths for torch/lib
    possible_paths = [
        os.path.join(sys.prefix, 'Lib', 'site-packages', 'torch', 'lib'),
        os.path.join(os.path.dirname(sys.executable), 'Lib', 'site-packages', 'torch', 'lib'),
        r"D:\NCKH\form-agent-AI-project\.venv\Lib\site-packages\torch\lib" # Absolute fallback
    ]
    for p in possible_paths:
        if os.path.exists(p):
            try:
                os.add_dll_directory(p)
            except Exception:
                pass

import logging
import re
import json
import re

# Import ChromaDB AI
from chroma_question_ai import ChromaQuestionAI

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# KEYWORD VALIDATION MODULE - Semantic Keyword Validator
# ============================================================================

class KeywordValidationResult:
    """Result of keyword validation"""
    def __init__(self, is_valid: bool, reason: str = "", cleaned_keyword: str = ""):
        self.is_valid = is_valid
        self.reason = reason
        self.cleaned_keyword = cleaned_keyword


class SemanticKeywordValidator:
    """
    Validator để kiểm tra từ khóa có ngữ nghĩa hay không.
    Ngăn chặn các đầu vào rác, ký tự đặc biệt, spam.
    """
    
    # Danh sách stop words tiếng Việt và tiếng Anh (các từ không có nghĩa riêng)
    STOP_WORDS = {
        'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
        'và', 'hoặc', 'hay', 'nhưng', 'mà', 'thì', 'là', 'của', 'cho', 'với',
        'trong', 'ngoài', 'trên', 'dưới', 'bên', 'cạnh', 'về', 'tới', 'đến',
        'từ', 'khi', 'nếu', 'thế', 'như', 'vậy', 'được', 'bị', 'làm', 'có',
        'không', 'chưa', 'đã', 'sẽ', 'đang', 'rất', 'lắm', 'quá', 'hơn'
    }
    
    # Regex patterns cho các loại input không hợp lệ
    GARBAGE_PATTERNS = [
        r'^[\W\d_]+$',                    # Chỉ chứa ký tự đặc biệt và số
        r'^(.)\1{3,}$',                   # Lặp lại 1 ký tự nhiều lần (aaaa, 1111)
        r'^[!@#$%^&*()_+=\[\]{}|\\:";\'<>?,./`~\-]+$',  # Chỉ ký tự đặc biệt
        r'^\d+$',                         # Chỉ số
        r'^[\s]+$',                       # Chỉ khoảng trắng
        r'^([a-z]\s+){3,}[a-z]?$',        # Các ký tự đơn lặp lại (a b c d) - fixed pattern
        r'^[a-z]{1,2}$',                  # Từ quá ngắn (1-2 ký tự)
        r'^(test|asdf|qwerty|abc|xyz|123|111|aaa|bbb)\s*\d*$',  # Test patterns
    ]
    
    # Minimum requirements
    MIN_KEYWORD_LENGTH = 2
    MAX_KEYWORD_LENGTH = 200
    MIN_MEANINGFUL_WORDS = 1
    
    # Danh sách các danh từ/từ có nghĩa phổ biến (để validation nhanh)
    KNOWN_MEANINGFUL_PATTERNS = [
        r'\b(marketing|sale|sales|it|technology|software|hardware|computer)\b',
        r'\b(business|finance|economics|investment|stock|crypto|blockchain)\b',
        r'\b(ai|machine learning|deep learning|data|analytics|cloud)\b',
        r'\b(seo|social media|digital|advertising|branding|campaign)\b',
        r'\b(brand awareness|brand|awareness|lead generation|customer retention)\b',
        r'\b(product|service|customer|client|user|market|strategy)\b',
        r'\b(python|javascript|java|react|nodejs|database|api)\b',
        r'\b(security|network|system|server|devops|kubernetes|docker)\b',
        r'\b(phần mềm|công nghệ|kinh doanh|tiếp thị|bán hàng|đầu tư)\b',
        r'\b(khách hàng|sản phẩm|dịch vụ|thị trường|chiến lược)\b',
        r'\b(trí tuệ nhân tạo|máy học|dữ liệu|phân tích|điện toán đám mây)\b',
    ]
    
    @classmethod
    def is_semantic_keyword(cls, text: str) -> KeywordValidationResult:
        """
        Kiểm tra xem từ khóa có ngữ nghĩa hay không.
        
        Args:
            text: Từ khóa cần kiểm tra
            
        Returns:
            KeywordValidationResult với is_valid, reason, và cleaned_keyword
        """
        
        if not text:
            return KeywordValidationResult(False, "Từ khóa không được để trống")
        
        # Clean và normalize
        cleaned = text.strip()
        cleaned_lower = cleaned.lower()
        
        # ================================================================
        # PRIORITY CHECK: Block @ and # characters immediately
        # ================================================================
        blocked_chars = []
        if '@' in cleaned:
            blocked_chars.append('@')
        if '#' in cleaned:
            blocked_chars.append('#')
        
        if blocked_chars:
            return KeywordValidationResult(
                False,
                f"Ký tự không được phép: {', '.join(blocked_chars)}. Vui lòng không sử dụng @ hoặc #",
                cleaned
            )
        
        # Check length
        if len(cleaned) < cls.MIN_KEYWORD_LENGTH:
            return KeywordValidationResult(
                False, 
                f"Từ khóa quá ngắn (tối thiểu {cls.MIN_KEYWORD_LENGTH} ký tự)",
                cleaned
            )
        
        if len(cleaned) > cls.MAX_KEYWORD_LENGTH:
            return KeywordValidationResult(
                False,
                f"Từ khóa quá dài (tối đa {cls.MAX_KEYWORD_LENGTH} ký tự)",
                cleaned
            )
        
        # Check garbage patterns
        for pattern in cls.GARBAGE_PATTERNS:
            if re.match(pattern, cleaned_lower, re.IGNORECASE):
                return KeywordValidationResult(
                    False,
                    "Từ khóa không hợp lệ: chứa ký tự rác hoặc không có nghĩa",
                    cleaned
                )
        
        # Check if contains at least some alphabetic characters
        alpha_chars = sum(1 for c in cleaned if c.isalpha())
        if alpha_chars < 2:
            return KeywordValidationResult(
                False,
                "Từ khóa phải chứa ít nhất 2 ký tự chữ cái",
                cleaned
            )
        
        # Extract words
        words = re.findall(r'\b\w+\b', cleaned_lower)
        
        if not words:
            return KeywordValidationResult(
                False,
                "Không tìm thấy từ có nghĩa trong từ khóa",
                cleaned
            )
        
        # Filter out stop words and very short words
        meaningful_words = [
            w for w in words 
            if w not in cls.STOP_WORDS and len(w) >= 2
        ]
        
        if len(meaningful_words) < cls.MIN_MEANINGFUL_WORDS:
            return KeywordValidationResult(
                False,
                "Từ khóa phải chứa ít nhất một từ có nghĩa (không phải stop word)",
                cleaned
            )
        
        # Bonus check: Look for known meaningful patterns
        has_known_pattern = False
        for pattern in cls.KNOWN_MEANINGFUL_PATTERNS:
            if re.search(pattern, cleaned_lower, re.IGNORECASE):
                has_known_pattern = True
                break
        
        # Check for excessive special characters ratio
        special_char_count = sum(1 for c in cleaned if not c.isalnum() and not c.isspace())
        if len(cleaned) > 0 and special_char_count / len(cleaned) > 0.5:
            return KeywordValidationResult(
                False,
                "Từ khóa chứa quá nhiều ký tự đặc biệt",
                cleaned
            )
        
        # Check for repeated patterns (spam detection)
        if cls._has_spam_pattern(cleaned_lower):
            return KeywordValidationResult(
                False,
                "Từ khóa có dấu hiệu spam hoặc lặp lại không tự nhiên",
                cleaned
            )
        
        return KeywordValidationResult(True, "Từ khóa hợp lệ", cleaned)
    
    @classmethod
    def _has_spam_pattern(cls, text: str) -> bool:
        """Kiểm tra xem text có pattern spam không"""
        
        # Check for character repetition
        for i in range(len(text) - 3):
            if text[i] == text[i+1] == text[i+2] == text[i+3]:
                return True
        
        # Check for word repetition
        words = text.split()
        if len(words) >= 3:
            word_counts = {}
            for word in words:
                word_counts[word] = word_counts.get(word, 0) + 1
            
            # If any word appears more than 50% of total words
            for count in word_counts.values():
                if count > len(words) * 0.5 and count >= 3:
                    return True
        
        return False


# ============================================================================
# AUDIT LOGGING MODULE - Track invalid keyword attempts
# ============================================================================

class AuditLogger:
    """Logger để ghi lại các hành vi người dùng vào audit_logs"""
    
    AUDIT_LOG_FILE = "logs/keyword_audit.log"
    
    @classmethod
    def ensure_log_dir(cls):
        """Đảm bảo thư mục logs tồn tại"""
        os.makedirs("logs", exist_ok=True)
    
    @classmethod
    def log_invalid_keyword(
        cls,
        keyword: str,
        reason: str,
        endpoint: str,
        ip_address: str = "unknown",
        user_agent: str = "unknown",
        additional_data: Dict = None
    ):
        """
        Ghi log khi phát hiện từ khóa không hợp lệ.
        
        Args:
            keyword: Từ khóa không hợp lệ
            reason: Lý do từ chối
            endpoint: API endpoint được gọi
            ip_address: IP của client
            user_agent: User agent của client
            additional_data: Dữ liệu bổ sung
        """
        
        cls.ensure_log_dir()
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event_type": "INVALID_KEYWORD_ATTEMPT",
            "keyword": keyword[:100] if keyword else "",  # Truncate for safety
            "reason": reason,
            "endpoint": endpoint,
            "ip_address": ip_address,
            "user_agent": user_agent[:200] if user_agent else "",  # Truncate
            "additional_data": additional_data or {}
        }
        
        # Log to file
        try:
            with open(cls.AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
        
        # Also log to main logger
        logger.warning(
            f"AUDIT: Invalid keyword attempt | "
            f"Keyword: '{keyword[:50]}...' | "
            f"Reason: {reason} | "
            f"Endpoint: {endpoint} | "
            f"IP: {ip_address}"
        )
    
    @classmethod
    def log_category_rejection(
        cls,
        keyword: str,
        predicted_category: str,
        confidence: float,
        endpoint: str,
        ip_address: str = "unknown"
    ):
        """
        Ghi log khi category prediction là N/A hoặc Unknown.
        """
        
        cls.ensure_log_dir()
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "event_type": "CATEGORY_REJECTION",
            "keyword": keyword[:100] if keyword else "",
            "predicted_category": predicted_category,
            "confidence": confidence,
            "endpoint": endpoint,
            "ip_address": ip_address,
            "reason": f"Category prediction returned invalid: {predicted_category}"
        }
        
        try:
            with open(cls.AUDIT_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
        except Exception as e:
            logger.error(f"Failed to write audit log: {e}")
        
        logger.warning(
            f"AUDIT: Category rejection | "
            f"Keyword: '{keyword[:50]}' | "
            f"Category: {predicted_category} | "
            f"Confidence: {confidence:.3f}"
        )


# ============================================================================
# VALIDATION MIDDLEWARE & DEPENDENCY
# ============================================================================

async def get_client_info(request: Request) -> Dict[str, str]:
    """Extract client info from request for audit logging"""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown")
    }


def validate_keyword_semantic(keyword: str, endpoint: str, client_info: Dict[str, str]) -> str:
    """
    Validate keyword và log nếu không hợp lệ.
    
    Args:
        keyword: Từ khóa cần validate
        endpoint: Tên endpoint đang gọi
        client_info: Thông tin client (IP, user agent)
        
    Returns:
        Cleaned keyword nếu hợp lệ
        
    Raises:
        HTTPException 400 nếu không hợp lệ
    """
    
    result = SemanticKeywordValidator.is_semantic_keyword(keyword)
    
    if not result.is_valid:
        # Log to audit
        AuditLogger.log_invalid_keyword(
            keyword=keyword,
            reason=result.reason,
            endpoint=endpoint,
            ip_address=client_info.get("ip_address", "unknown"),
            user_agent=client_info.get("user_agent", "unknown")
        )
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_KEYWORD",
                "message": result.reason,
                "suggestion": "Vui lòng nhập từ khóa có nghĩa, ví dụ: 'machine learning', 'digital marketing', 'bán hàng online'"
            }
        )
    
    return result.cleaned_keyword


def validate_category_result(
    keyword: str,
    category: str,
    confidence: float,
    endpoint: str,
    client_info: Dict[str, str]
) -> bool:
    """
    Validate category prediction result.
    
    Args:
        keyword: Từ khóa đã dự đoán
        category: Category được dự đoán
        confidence: Độ tin cậy
        endpoint: Tên endpoint
        client_info: Thông tin client
        
    Returns:
        True nếu category hợp lệ
        
    Raises:
        HTTPException 400 nếu category là N/A hoặc Unknown
    """
    
    invalid_categories = {'n/a', 'unknown', 'none', 'null', '', 'undefined'}
    
    if category.lower().strip() in invalid_categories or confidence < 0.1:
        # Log rejection
        AuditLogger.log_category_rejection(
            keyword=keyword,
            predicted_category=category,
            confidence=confidence,
            endpoint=endpoint,
            ip_address=client_info.get("ip_address", "unknown")
        )
        
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_CATEGORY",
                "message": "Không thể xác định danh mục cho từ khóa này",
                "predicted_category": category,
                "confidence": confidence,
                "suggestion": "Từ khóa không đủ rõ ràng để phân loại. Vui lòng thử từ khóa cụ thể hơn."
            }
        )
    
    return True

# Initialize FastAPI app
app = FastAPI(
    title="Question Generation AI API",
    description="API để tự động tạo câu hỏi từ keywords cho 3 lĩnh vực: IT, Economics, Marketing",
    version="1.0.0"
)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
question_ai = None
chroma_ai = None

# Request/Response models
class QuestionRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=200, description="Keyword để tạo câu hỏi")
    num_questions: int = Field(5, ge=1, le=20, description="Số câu hỏi cần tạo (1-20)")
    category_hint: Optional[str] = Field(None, description="Gợi ý category (it, economics, marketing, hoặc null)")
    offset: int = Field(0, ge=0, description="Bỏ qua N câu hỏi đầu (dùng cho regenerate)")

class SuggestedFormType(BaseModel):
    form_type: str
    confidence: float
    reason: str

class QuestionMetadata(BaseModel):
    keyword: str
    category: str
    category_confidence: float
    suggested_form_type: SuggestedFormType
    total_available: int
    can_regenerate: bool
    current_offset: int

class QuestionResponse(BaseModel):
    keyword: str
    category: str
    confidence: float
    questions: List[Dict[str, Any]]
    generated_at: str
    total_questions: int
    metadata: Optional[QuestionMetadata] = None

class CategoryPrediction(BaseModel):
    keyword: str
    predicted_category: str
    confidence: float
    all_probabilities: Dict[str, float]

class HealthResponse(BaseModel):
    status: str
    timestamp: str
    is_model_loaded: bool
    api_version: str

# Load model on startup
@app.on_event("startup")
async def load_model():
    """Load AI model on startup"""
    global question_ai, chroma_ai
    
    logger.info("Starting Question Generation API...")
    
    try:
        # Import after FastAPI starts to avoid issues
        from simple_question_trainer import SimpleQuestionAI
        from advanced_question_ai import AdvancedQuestionAI
        from real_data_trainer import RealDataQuestionTrainer
        
        # Try loading RealDataQuestionTrainer first (208MB model, most complete)
        try:
            real_trainer = RealDataQuestionTrainer()
            if real_trainer.load_trained_model():
                question_ai = real_trainer
                logger.info("Real Data model loaded successfully! (208MB - Full trained)")
            else:
                raise Exception("Real data model not found or failed to load")
        except Exception as e:
            logger.warning(f"Real data model failed: {e}")
            
            # Fallback to Advanced model
            try:
                question_ai = AdvancedQuestionAI()
                if question_ai.load_advanced_model():
                    logger.info("Advanced ML model loaded as fallback")
                else:
                    raise Exception("Advanced model file not found or corrupted")
            except Exception as e2:
                logger.warning(f"Advanced model also failed: {e2}")
                # Final fallback to simple model
                try:
                    from simple_question_trainer import SimpleQuestionAI
                    question_ai = SimpleQuestionAI()
                    if question_ai.load_model():
                        logger.info("Simple model loaded as final fallback")
                    else:
                        logger.warning("No models found. Using templates only.")
                except Exception as e3:
                    logger.warning(f"Simple model import/load failed: {e3}")
        
        if question_ai:
            logger.info("Question Generation API ready!")
        else:
            logger.error("No AI models could be loaded. Server will run in degraded mode.")
            
        # Initialize ChromaDB AI
        try:
            chroma_ai = ChromaQuestionAI()
            if chroma_ai.collection:
                logger.info("ChromaDB Semantic search enabled!")
            else:
                logger.warning("ChromaDB collection not found. Vector search disabled.")
        except Exception as ce:
            logger.error(f"Failed to initialize ChromaDB: {ce}")
            chroma_ai = None
        
    except Exception as e:
        logger.error(f"Error in load_model: {e}")
        question_ai = None

# API Endpoints

@app.get("/", response_class=JSONResponse)
async def root():
    """Root endpoint"""
    return {
        "message": "Question Generation AI API",
        "version": "1.0.0",
        "description": "Tự động tạo câu hỏi từ keywords cho IT, Economics, Marketing",
        "endpoints": {
            "generate": "/api/generate-questions",
            "predict": "/api/predict-category", 
            "health": "/health",
            "docs": "/docs"
        },
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if question_ai else "unhealthy",
        timestamp=datetime.now().isoformat(),
        is_model_loaded=question_ai is not None,
        api_version="1.0.0"
    )

@app.post("/api/generate-questions", response_model=QuestionResponse)
async def generate_questions(request: QuestionRequest, req: Request):
    """Generate questions từ keyword với validation ngữ nghĩa"""
    
    if not question_ai:
        raise HTTPException(status_code=503, detail="AI model not available")
    
    # Get client info for audit logging
    client_info = {
        "ip_address": req.client.host if req.client else "unknown",
        "user_agent": req.headers.get("user-agent", "unknown")
    }
    
    # ================================================================
    # STEP 1: Validate keyword semantically
    # ================================================================
    validated_keyword = validate_keyword_semantic(
        keyword=request.keyword,
        endpoint="/api/generate-questions",
        client_info=client_info
    )
    
    try:
        logger.info(f"Generating questions for: '{validated_keyword}'")
        
        # ================================================================
        # STEP 2: Predict category first to validate
        # ================================================================
        category, confidence = question_ai.predict_category(validated_keyword)
        
        # Validate category result - reject if N/A or Unknown
        validate_category_result(
            keyword=validated_keyword,
            category=category,
            confidence=confidence,
            endpoint="/api/generate-questions",
            client_info=client_info
        )
        
        # ================================================================
        # STEP 3: Generate questions using ChromaDB (Semantic Search) first
        # ================================================================
        result = None
        questions = []
        metadata = None
        
        # Try ChromaDB first
        if chroma_ai and chroma_ai.collection:
            logger.info(f"Using ChromaDB for semantic search: '{validated_keyword}'")
            questions = chroma_ai.query_questions(
                keyword=validated_keyword,
                num_results=request.num_questions,
                offset=request.offset,
                categories=[category] if category != 'unknown' else None
            )
            
            if questions:
                # Add source keyword and match type for metadata
                metadata = {
                    'keyword': validated_keyword,
                    'category': category,
                    'category_confidence': confidence,
                    'total_available': len(questions) + 100, # Approximate
                    'can_regenerate': True,
                    'current_offset': request.offset,
                    'method': 'chroma_semantic_search'
                }
        
        # Fallback to ML models if Chroma failed or returned nothing
        if not questions:
            if hasattr(question_ai, 'generate_questions_from_real_data'):
                # RealDataQuestionTrainer - uses real training data with offset support
                result = question_ai.generate_questions_from_real_data(
                    keyword=validated_keyword,
                    num_questions=request.num_questions,
                    offset=request.offset
                )
                # New format returns dict with questions and metadata
                if isinstance(result, dict):
                    questions = result.get('questions', [])
                    metadata = result.get('metadata', {})
                else:
                    questions = result
            elif hasattr(question_ai, 'generate_questions_ml'):
                # AdvancedQuestionAI - uses ML model
                result = question_ai.generate_questions_ml(
                    keyword=validated_keyword,
                    num_questions=request.num_questions,
                    category_hint=request.category_hint
                )
                # ML output can be a dict or a list directly
                if isinstance(result, dict):
                    questions = result.get('questions', [])
                    metadata = result.get('metadata', result)  # Falls back to result dict itself for tier info
                else:
                    questions = result
            else:
                # Fallback to simple generation
                questions = question_ai.generate_questions(
                    keyword=validated_keyword,
                    num_questions=request.num_questions
                )
        
        # Final safety check: if still no questions after all models, use a basic template fallback
        if not questions:
            logger.warning(f"All AI models returned 0 questions for '{validated_keyword}'. Using manual fallback.")
            questions = [
                {"question": f"What is {validated_keyword}?", "category": "general", "confidence": 0.5, "method": "manual_fallback"},
                {"question": f"How does {validated_keyword} impact your field?", "category": "general", "confidence": 0.5, "method": "manual_fallback"},
                {"question": f"What are the primary benefits of {validated_keyword}?", "category": "general", "confidence": 0.5, "method": "manual_fallback"},
                {"question": f"How do you rate your experience with {validated_keyword}?", "category": "general", "confidence": 0.5, "method": "manual_fallback"},
                {"question": f"What improvements would you suggest for {validated_keyword}?", "category": "general", "confidence": 0.5, "method": "manual_fallback"}
            ]
        
        if not questions:
            raise HTTPException(status_code=400, detail="Could not generate or fallback for this keyword")
        
        # Filter out any None values if they somehow got in
        questions = [q for q in questions if q is not None]
        
        if not questions:
            raise HTTPException(status_code=400, detail="Resulting questions list is empty after filtering")
        
        # Extract info from first question safely
        first_q = questions[0]
        category = first_q.get('category', 'general')
        confidence = first_q.get('confidence', 0.5)
        
        # Format response with full metadata
        formatted_questions = []
        for i, q in enumerate(questions, 1):
            formatted_questions.append({
                "id": i,
                "question": q.get('question', q.get('question_text', 'No question text')),
                "category": q.get('category', 'general'),
                "confidence": round(float(q.get('confidence', 0.5)), 6),  # Round for cleaner display
                "question_type": q.get('question_type', 'open_ended'),  # Form type matching DB
                "semantic_type": q.get('semantic_type', 'general'),  # Original semantic type
                "method": q.get('method', 'unknown'),  # How question was generated
                "source_keyword": q.get('source_keyword', validated_keyword),  # Source keyword
                "similarity_score": round(q.get('similarity_score', 1.0), 4) if q.get('similarity_score') else None,
                "suggested_form_type": q.get('suggested_form_type')  # Survey type suggestion
            })
        
        # Build metadata for response
        response_metadata = None
        if metadata:
            response_metadata = {
                "keyword": metadata.get('keyword', validated_keyword),
                "category": metadata.get('category', category),
                "category_confidence": metadata.get('category_confidence', confidence),
                "suggested_form_type": metadata.get('suggested_form_type', {}),
                "total_available": metadata.get('total_available', len(questions)),
                "can_regenerate": metadata.get('can_regenerate', False),
                "current_offset": metadata.get('current_offset', 0)
            }
        
        response = QuestionResponse(
            keyword=request.keyword,
            category=category,
            confidence=round(confidence, 6),
            questions=formatted_questions,
            generated_at=datetime.now().isoformat(),
            total_questions=len(questions),
            metadata=response_metadata
        )
        
        logger.info(f"Generated {len(questions)} questions successfully (offset={request.offset})")
        return response
        
    except HTTPException as he:
        # Re-raise HTTP exceptions to keep their status codes
        raise he
    except Exception as e:
        logger.error(f"Error generating questions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

class CategoryRequest(BaseModel):
    keyword: str = Field(..., min_length=1, max_length=200, description="Keyword để predict category")

@app.post("/api/predict-category", response_model=CategoryPrediction)
async def predict_category_endpoint(request: CategoryRequest, req: Request):
    """Predict category từ keyword với validation ngữ nghĩa"""
    
    if not question_ai:
        raise HTTPException(status_code=503, detail="AI model not available")
    
    # Get client info for audit logging
    client_info = {
        "ip_address": req.client.host if req.client else "unknown",
        "user_agent": req.headers.get("user-agent", "unknown")
    }
    
    # ================================================================
    # STEP 1: Validate keyword semantically
    # ================================================================
    validated_keyword = validate_keyword_semantic(
        keyword=request.keyword,
        endpoint="/api/predict-category",
        client_info=client_info
    )
    
    try:
        logger.info(f"Predicting category for: '{validated_keyword}'")
        
        category, confidence = question_ai.predict_category(validated_keyword)
        
        # ================================================================
        # STEP 2: Check if category is valid (not N/A or Unknown)
        # ================================================================
        invalid_categories = {'n/a', 'unknown', 'none', 'null', '', 'undefined'}
        is_valid_category = category.lower().strip() not in invalid_categories and confidence >= 0.1
        
        # Log if invalid (but still return the result for transparency)
        if not is_valid_category:
            AuditLogger.log_category_rejection(
                keyword=validated_keyword,
                predicted_category=category,
                confidence=confidence,
                endpoint="/api/predict-category",
                ip_address=client_info.get("ip_address", "unknown")
            )
        
        # Create probabilities
        all_probs = {
            "it": 0.33,
            "economics": 0.33, 
            "marketing": 0.34
        }
        all_probs[category] = confidence
        
        response = CategoryPrediction(
            keyword=validated_keyword,
            predicted_category=category,
            confidence=confidence,
            all_probabilities=all_probs
        )
        
        # Add warning if category is not valid
        if not is_valid_category:
            logger.warning(f"Category prediction unclear for: '{validated_keyword}' -> {category} ({confidence:.3f})")
        else:
            logger.info(f"Predicted category: {category} ({confidence:.3f})")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting category: {e}")
        raise HTTPException(status_code=500, detail=f"Error predicting category: {str(e)}")

@app.get("/api/categories")
async def get_categories():
    """Get available categories"""
    return {
        "categories": [
            {
                "id": "it", 
                "name": "Information Technology",
                "description": "Software development, cloud computing, AI, cybersecurity"
            },
            {
                "id": "economics",
                "name": "Economics & Finance", 
                "description": "Investment, financial planning, market analysis"
            },
            {
                "id": "marketing",
                "name": "Marketing & Advertising",
                "description": "Digital marketing, campaigns, brand management"
            },
            {
                "id": "sale",
                "name": "Sales & Commerce",
                "description": "B2B/B2C sales, pricing strategies, customer acquisition, discounts"
            }
        ]
    }

@app.get("/api/templates")
async def get_question_templates():
    """Get question templates for reference"""
    
    if not question_ai:
        raise HTTPException(status_code=503, detail="AI model not available")
    
    return {
        "templates": question_ai.question_templates,
        "total_templates": sum(len(templates) for templates in question_ai.question_templates.values()),
        "categories": list(question_ai.question_templates.keys())
    }

@app.get("/api/stats")
async def get_api_stats():
    """Get API statistics"""
    
    # In production, this would track real usage stats
    return {
        "total_requests": 0,
        "questions_generated": 0,
        "categories_predicted": 0,
        "uptime": "Just started",
        "model_status": "loaded" if question_ai else "not_loaded",
        "last_updated": datetime.now().isoformat()
    }


# ============================================================================
# NEW VALIDATION & AUDIT ENDPOINTS
# ============================================================================

class KeywordValidationRequest(BaseModel):
    """Request model for keyword validation"""
    keyword: str = Field(..., min_length=1, max_length=200, description="Keyword cần validate")


class KeywordValidationResponse(BaseModel):
    """Response model for keyword validation"""
    keyword: str
    is_valid: bool
    reason: str
    cleaned_keyword: str
    can_generate_questions: bool


@app.post("/api/validate-keyword", response_model=KeywordValidationResponse)
async def validate_keyword_endpoint(request: KeywordValidationRequest, req: Request):
    """
    Validate keyword trước khi gọi API tạo câu hỏi.
    
    Kiểm tra:
    - Từ khóa có ngữ nghĩa hay không
    - Có chứa ký tự rác/spam không
    - Có đủ từ có nghĩa không
    
    Returns:
        KeywordValidationResponse với is_valid và reason
    """
    
    # Get client info
    client_info = {
        "ip_address": req.client.host if req.client else "unknown",
        "user_agent": req.headers.get("user-agent", "unknown")
    }
    
    # Validate using SemanticKeywordValidator
    result = SemanticKeywordValidator.is_semantic_keyword(request.keyword)
    
    # If invalid, log to audit
    if not result.is_valid:
        AuditLogger.log_invalid_keyword(
            keyword=request.keyword,
            reason=result.reason,
            endpoint="/api/validate-keyword",
            ip_address=client_info.get("ip_address", "unknown"),
            user_agent=client_info.get("user_agent", "unknown")
        )
    
    # Check if can generate questions (valid keyword + model available)
    can_generate = result.is_valid and question_ai is not None
    
    return KeywordValidationResponse(
        keyword=request.keyword,
        is_valid=result.is_valid,
        reason=result.reason,
        cleaned_keyword=result.cleaned_keyword,
        can_generate_questions=can_generate
    )


@app.post("/api/validate-and-predict")
async def validate_and_predict(request: KeywordValidationRequest, req: Request):
    """
    Validate keyword và predict category trong một lần gọi.
    
    Flow:
    1. Validate keyword semantically
    2. Nếu valid -> predict category
    3. Nếu category là N/A/Unknown -> không cho phép generate
    
    Returns:
        Combined validation và prediction result
    """
    
    if not question_ai:
        raise HTTPException(status_code=503, detail="AI model not available")
    
    # Get client info
    client_info = {
        "ip_address": req.client.host if req.client else "unknown",
        "user_agent": req.headers.get("user-agent", "unknown")
    }
    
    # Step 1: Validate keyword
    validation_result = SemanticKeywordValidator.is_semantic_keyword(request.keyword)
    
    if not validation_result.is_valid:
        # Log invalid attempt
        AuditLogger.log_invalid_keyword(
            keyword=request.keyword,
            reason=validation_result.reason,
            endpoint="/api/validate-and-predict",
            ip_address=client_info.get("ip_address", "unknown"),
            user_agent=client_info.get("user_agent", "unknown")
        )
        
        return {
            "keyword": request.keyword,
            "validation": {
                "is_valid": False,
                "reason": validation_result.reason,
                "cleaned_keyword": validation_result.cleaned_keyword
            },
            "prediction": None,
            "can_generate_questions": False,
            "message": validation_result.reason
        }
    
    # Step 2: Predict category
    try:
        category, confidence = question_ai.predict_category(validation_result.cleaned_keyword)
        
        # Check if category is valid
        invalid_categories = {'n/a', 'unknown', 'none', 'null', '', 'undefined'}
        is_valid_category = category.lower().strip() not in invalid_categories and confidence >= 0.1
        
        # Log if category is invalid
        if not is_valid_category:
            AuditLogger.log_category_rejection(
                keyword=validation_result.cleaned_keyword,
                predicted_category=category,
                confidence=confidence,
                endpoint="/api/validate-and-predict",
                ip_address=client_info.get("ip_address", "unknown")
            )
        
        return {
            "keyword": request.keyword,
            "validation": {
                "is_valid": True,
                "reason": validation_result.reason,
                "cleaned_keyword": validation_result.cleaned_keyword
            },
            "prediction": {
                "category": category,
                "confidence": confidence,
                "is_valid_category": is_valid_category
            },
            "can_generate_questions": is_valid_category,
            "message": "Keyword hợp lệ và có thể tạo câu hỏi" if is_valid_category 
                      else f"Không thể xác định danh mục rõ ràng (confidence: {confidence:.2f})"
        }
        
    except Exception as e:
        logger.error(f"Error in validate_and_predict: {e}")
        return {
            "keyword": request.keyword,
            "validation": {
                "is_valid": True,
                "reason": validation_result.reason,
                "cleaned_keyword": validation_result.cleaned_keyword
            },
            "prediction": None,
            "can_generate_questions": False,
            "message": f"Lỗi khi dự đoán danh mục: {str(e)}"
        }


@app.get("/api/audit-logs")
async def get_audit_logs(
    limit: int = 100,
    event_type: Optional[str] = None
):
    """
    Xem audit logs (chỉ dành cho admin).
    
    Args:
        limit: Số lượng log entries tối đa (default 100)
        event_type: Filter theo loại event (INVALID_KEYWORD_ATTEMPT, CATEGORY_REJECTION)
    
    Returns:
        List of audit log entries
    """
    
    logs = []
    log_file = AuditLogger.AUDIT_LOG_FILE
    
    if not os.path.exists(log_file):
        return {
            "logs": [],
            "total": 0,
            "message": "No audit logs found"
        }
    
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        # Parse logs (newest first)
        for line in reversed(lines):
            if len(logs) >= limit:
                break
            
            try:
                log_entry = json.loads(line.strip())
                
                # Filter by event_type if specified
                if event_type and log_entry.get("event_type") != event_type:
                    continue
                
                logs.append(log_entry)
            except json.JSONDecodeError:
                continue
        
        return {
            "logs": logs,
            "total": len(logs),
            "available_event_types": ["INVALID_KEYWORD_ATTEMPT", "CATEGORY_REJECTION"]
        }
        
    except Exception as e:
        logger.error(f"Error reading audit logs: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading audit logs: {str(e)}")

# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"error": "Invalid input", "detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": "An unexpected error occurred"}
    )

# Additional utility endpoints
@app.post("/api/batch-generate")
async def batch_generate_questions(keywords: List[str], num_questions: int = 3):
    """Generate questions cho nhiều keywords cùng lúc"""
    
    if not question_ai:
        raise HTTPException(status_code=503, detail="AI model not available")
    
    if len(keywords) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 keywords allowed")
    
    results = []
    
    for keyword in keywords:
        try:
            questions = question_ai.generate_questions(keyword, num_questions)
            
            if questions:
                results.append({
                    "keyword": keyword,
                    "category": questions[0]['category'],
                    "confidence": questions[0]['confidence'],
                    "questions": [q['question'] for q in questions],
                    "status": "success"
                })
            else:
                results.append({
                    "keyword": keyword,
                    "status": "failed",
                    "error": "Could not generate questions"
                })
                
        except Exception as e:
            results.append({
                "keyword": keyword,
                "status": "error",
                "error": str(e)
            })
    
    return {
        "results": results,
        "total_keywords": len(keywords),
        "successful": len([r for r in results if r.get("status") == "success"]),
        "failed": len([r for r in results if r.get("status") != "success"])
    }

if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting Question Generation API Server...")
    print("📖 API Documentation: http://localhost:9000/docs")
    print("🔍 Health Check: http://localhost:9000/health")
    
    uvicorn.run(
        "question_api_server:app",
        host="0.0.0.0",
        port=9000,
        reload=True,
        log_level="info"
    )
