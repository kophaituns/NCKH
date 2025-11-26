# Phân Tích Sử Dụng Folder `/src/utils`

## 📊 Summary

✅ **Folder `/utils` vẫn được sử dụng** nhưng **chỉ 2 nơi**

| File | Nơi sử dụng | Số lần import |
|------|-----------|--------------|
| `questionTypes.js` | 2 files | 2 |

---

## 📍 Chi Tiết Sử Dụng

### 1️⃣ `questionTypes.js` - **ĐƯỢC SỬ DỤNG** ✅

**File này export:**
```javascript
export const QUESTION_TYPE_LABELS = { ... };
export function getQuestionTypeLabel(question) { ... }
export function getQuestionType(question) { ... }
```

**Được import ở:**

#### ✅ File 1: `Frontend/src/pages/Surveys/Results/index.jsx`
```javascript
// Line 8
import { getQuestionTypeLabel } from '../../../utils/questionTypes';

// Usage: Display question type label in results
<span>{getQuestionTypeLabel(question)}</span>
```

#### ✅ File 2: `Frontend/src/components/UI/QuestionCard.jsx`
```javascript
// Line 5
import { getQuestionTypeLabel, getQuestionType } from '../../utils/questionTypes';

// Usage: Display question type in card
<div>{getQuestionTypeLabel(question)}</div>
```

---

## 📁 Cấu Trúc `/src/utils` Hiện Tại

```
utils/
└── questionTypes.js    ✅ ĐANG DÙNG (2 imports)
```

---

## 🎯 Kết Luận

### Status: ✅ ACTIVE & NECESSARY

| Tiêu chí | Kết quả |
|---------|--------|
| **Folder còn được dùng?** | ✅ YES |
| **File được dùng?** | ✅ YES - `questionTypes.js` |
| **Có thể xóa?** | ❌ NO - 2 files phụ thuộc |
| **Cần refactor?** | ⚠️ Maybe - có thể move vào folder khác |

---

## 🤔 Có Cần Di Chuyển `questionTypes.js` Không?

### Option 1: Keep in `/utils` (Current) ✅ RECOMMENDED
**Pros:**
- Đơn giản
- Utils = constant/helper files
- Dễ tìm

**Cons:**
- Folder chỉ có 1 file
- Có thể merge vào `/constants`

### Option 2: Move to `/constants`
**Pros:**
- Better organization
- Constants belong in `/constants`

**Cons:**
- Need to update imports
- Extra work

### Option 3: Move to `/api/constants` or `/api/types`
**Pros:**
- Grouped with API-related stuff
- Clear that it's for question types

**Cons:**
- Might be overkill
- `/api` is for HTTP, not constants

---

## 📋 Hiện Tại `/src/utils` Chứa Gì?

### Trước (2 files):
```
utils/
├── api.js              ❌ DELETED (deprecated)
└── questionTypes.js    ✅ ACTIVE
```

### Sau cleanup:
```
utils/
└── questionTypes.js    ✅ ACTIVE (ONLY)
```

---

## 💡 Recommendation

**Current state:** ✅ GOOD

Folder `/utils` **vẫn có ích** vì nó chứa:
- ✅ `questionTypes.js` - Helper functions & constants

**Tuy nhiên, bạn có thể cân nhắc:**

1. **Keep as is** - Simple & works
2. **Create `/src/constants`** - Move `questionTypes.js` there if you plan to add more constants

---

## ✅ Conclusion

**Folder `/utils` KHÔNG CẦN XÓA** vì:
- ✅ Still being used (2 active imports)
- ✅ Contains useful utilities
- ✅ Will likely grow with more helpers in future

**Recommendation:** Keep it! It's a good place for:
- Constants (like `questionTypes.js`)
- Helper functions (formatters, validators, etc.)
- Utilities (shared functions)

---

**Status:** ✅ ACTIVE & NECESSARY - No action needed
