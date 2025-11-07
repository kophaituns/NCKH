# ALLMTAGS Frontend Implementation Guide
**Complete System Architecture & Implementation Plan**

## 🎯 System Overview

**Status:** Backend Complete (9 modules, 53+ endpoints) | Frontend: In Progress
**Goal:** Full end-to-end functional survey management system with AI capabilities

---

## 📁 Project Structure

```
Frontend/src/
├── api/
│   └── services/          # ✅ COMPLETED
│       ├── auth.service.js
│       ├── user.service.js
│       ├── template.service.js
│       ├── survey.service.js
│       ├── collector.service.js
│       ├── response.service.js
│       ├── analytics.service.js
│       ├── export.service.js
│       └── llm.service.js
│
├── components/
│   ├── common/           # ✅ Core components ready
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Loader/
│   │   └── Pagination/
│   │
│   ├── layout/           # 🔄 TO IMPLEMENT
│   │   ├── Navbar/
│   │   ├── Sidebar/
│   │   └── ProtectedRoute/
│   │
│   └── features/         # 🔄 TO IMPLEMENT
│       ├── auth/
│       ├── dashboard/
│       ├── users/
│       ├── templates/
│       ├── surveys/
│       ├── collectors/
│       ├── responses/
│       ├── analytics/
│       └── llm/
│
├── contexts/             # ✅ COMPLETED
│   ├── AuthContext.jsx
│   └── ToastContext.jsx
│
├── pages/                # 🔄 TO IMPLEMENT
│   ├── Auth/
│   ├── Dashboard/
│   ├── Admin/
│   ├── Templates/
│   ├── Surveys/
│   ├── Collectors/
│   ├── Analytics/
│   └── LLM/
│
└── routes/               # ✅ COMPLETED
    └── index.jsx
```

---

## 🔐 1. Authentication Module (Priority 1)

### Pages
- `/login` - Login form
- `/register` - Registration form

### Components
- `LoginForm` - Email/username + password
- `RegisterForm` - Full registration with role selection
- `RoleSelector` - Admin/Creator/Student selector

### API Integration
```javascript
import AuthService from '../api/services/auth.service';

// Login
const handleLogin = async (identifier, password) => {
  const response = await AuthService.login(identifier, password);
  // Stored in localStorage by service
  // Redirect based on role
  redirectByRole(response.data.user.role);
};

// Role-based redirect
const redirectByRole = (role) => {
  switch(role) {
    case 'admin':
      navigate('/admin/dashboard');
      break;
    case 'creator':
      navigate('/creator/dashboard');
      break;
    case 'student':
    case 'responder':
      navigate('/surveys/public');
      break;
    default:
      navigate('/');
  }
};
```

### Files to Create
1. `src/pages/Auth/Login/index.jsx` - Login page wrapper
2. `src/pages/Auth/Register/index.jsx` - Registration page wrapper
3. `src/components/features/auth/LoginForm.jsx` - Login form component
4. `src/components/features/auth/RegisterForm.jsx` - Registration form component

---

## 📊 2. Dashboard Module (Priority 2)

### Admin Dashboard (`/admin/dashboard`)
**Metrics Cards:**
- Total Users
- Total Surveys
- Total Responses
- Active Surveys

**Charts:**
- Response trend (Line chart)
- Survey status distribution (Pie chart)
- User role distribution (Doughnut chart)

**API Calls:**
```javascript
const data = await AnalyticsService.getDashboardStats();
// Returns: { users, surveys, responses, activeCollectors }
```

### Creator Dashboard (`/creator/dashboard`)
**Metrics:**
- My Surveys Count
- Total Responses
- Active Collectors
- Pending Analysis

**Recent Activity:**
- Latest responses
- Recent surveys
- Collector performance

**API Calls:**
```javascript
const surveys = await SurveyService.getAllSurveys({ creator_id: userId });
const stats = await AnalyticsService.getDashboardStats();
```

### Implementation
```javascript
// Chart.js setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);
```

---

## 👥 3. User Management (Priority 3 - Admin Only)

### Page: `/admin/users`

**Features:**
- User list with pagination
- Search by name/email
- Filter by role
- Edit user role
- Delete user (with confirmation)

**Table Columns:**
- Avatar
- Name
- Email
- Role (with badge)
- Created Date
- Actions (Edit, Delete)

**API Integration:**
```javascript
// Get all users
const users = await UserService.getAllUsers({ page, limit, role, search });

// Update role
await UserService.updateUserRole(userId, newRole);

// Delete user
await UserService.deleteUser(userId);
```

**Components:**
- `UserList.jsx` - Main list component
- `UserTable.jsx` - Table with sorting
- `UserModal.jsx` - Edit modal
- `DeleteConfirmModal.jsx` - Reusable confirmation

---

## 📝 4. Template Management (Priority 4)

### Pages
- `/templates` - List all templates
- `/templates/create` - Create new template
- `/templates/:id` - View/Edit template

### Template Structure
```javascript
{
  id: 1,
  name: "Customer Satisfaction Survey",
  description: "...",
  category: "satisfaction",
  questions: [
    {
      id: 1,
      text: "How satisfied are you?",
      type: "multiple_choice", // text, multiple_choice, checkbox, rating, scale
      required: true,
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      order: 1
    }
  ]
}
```

### Question Builder Component
```jsx
<QuestionEditor
  question={question}
  onUpdate={(updated) => handleUpdateQuestion(updated)}
  onDelete={() => handleDeleteQuestion(question.id)}
/>

// Question types
- Text (short/long answer)
- Multiple Choice (single select)
- Checkbox (multi select)
- Rating (1-5 stars)
- Scale (1-10)
- Date
- Yes/No
```

### API Integration
```javascript
// Create template
const template = await TemplateService.createTemplate({
  name,
  description,
  category
});

// Add questions
for (const question of questions) {
  await TemplateService.addQuestion(template.id, question);
}

// Get question types
const types = await TemplateService.getQuestionTypes();
```

---

## 📋 5. Survey Management (Priority 5)

### Status Machine
```
draft → active → closed → analyzed
  ↓       ↓
delete   close
```

### Pages
- `/surveys` - List with filters (draft/active/closed)
- `/surveys/create` - Create from template
- `/surveys/:id` - View/Edit survey

### Survey Object
```javascript
{
  id: 1,
  title: "Q4 Customer Feedback",
  description: "...",
  template_id: 5,
  status: "active", // draft, active, closed, analyzed
  start_date: "2025-11-01",
  end_date: "2025-11-30",
  created_by: 2,
  response_count: 145,
  collectors: [...]
}
```

### Actions
```javascript
// Publish (draft → active)
await SurveyService.publishSurvey(surveyId);

// Close (active → closed)
await SurveyService.closeSurvey(surveyId);

// Update status
await SurveyService.updateStatus(surveyId, 'closed');

// Get stats
const stats = await SurveyService.getSurveyStats(surveyId);
```

### UI Features
- **Countdown Timer:** Days remaining until end_date
- **Status Badge:** Color-coded (draft=gray, active=green, closed=red)
- **Quick Actions:** Publish, Close, View Analytics, Export
- **Filter Tabs:** All | Draft | Active | Closed

---

## 🔗 6. Collector Management (Priority 6)

### Page: `/surveys/:surveyId/collectors`

**Collector Object:**
```javascript
{
  id: 1,
  survey_id: 5,
  name: "Email Campaign",
  type: "link", // link, qr, email
  token: "abc123def456...", // 64-char hex
  public_url: "https://example.com/collect/abc123def456",
  status: "active",
  response_count: 45,
  created_at: "2025-11-01T10:00:00Z"
}
```

### Features
1. **Generate Collector**
   ```javascript
   const collector = await CollectorService.createCollector({
     survey_id: surveyId,
     name: "Main Link",
     type: "link"
   });
   ```

2. **Display Public URL**
   ```javascript
   const publicUrl = CollectorService.getPublicURL(collector.token);
   // Returns: http://localhost:3000/collect/{token}
   ```

3. **Generate QR Code**
   ```jsx
   import QRCode from 'qrcode.react';
   
   <QRCode 
     value={publicUrl}
     size={256}
     level="H"
     includeMargin={true}
   />
   ```

4. **Copy to Clipboard**
   ```javascript
   const handleCopyLink = () => {
     navigator.clipboard.writeText(publicUrl);
     showSuccess('Link copied to clipboard!');
   };
   ```

5. **Toggle Active/Inactive**
   ```javascript
   await CollectorService.updateCollector(collectorId, {
     status: collector.status === 'active' ? 'inactive' : 'active'
   });
   ```

---

## 📝 7. Public Response Page (Priority 7)

### Route: `/collect/:token`

**Flow:**
1. Load survey by token
2. Validate token & survey status
3. Check for duplicate submissions (by IP/session)
4. Render dynamic form
5. Submit responses

### Implementation
```javascript
// Load survey
const { survey, collector } = await CollectorService.getCollectorByToken(token);

if (survey.status !== 'active') {
  return <SurveyClosed />;
}

// Check duplicate
const hasSubmitted = localStorage.getItem(`survey_${survey.id}_submitted`);
if (hasSubmitted) {
  return <AlreadySubmitted />;
}

// Render questions
const renderQuestion = (question) => {
  switch (question.type) {
    case 'text':
      return <TextInput question={question} />;
    case 'multiple_choice':
      return <RadioGroup question={question} />;
    case 'checkbox':
      return <CheckboxGroup question={question} />;
    case 'rating':
      return <StarRating question={question} />;
    case 'scale':
      return <ScaleSlider question={question} />;
    default:
      return null;
  }
};

// Submit
const handleSubmit = async (answers) => {
  const response = await ResponseService.submitPublicResponse(token, {
    answers: answers
  });
  
  localStorage.setItem(`survey_${survey.id}_submitted`, 'true');
  navigate('/collect/success');
};
```

### Validation
```javascript
// Client-side validation
const validateAnswers = (questions, answers) => {
  const errors = {};
  
  questions.forEach(question => {
    if (question.required && !answers[question.id]) {
      errors[question.id] = 'This field is required';
    }
  });
  
  return errors;
};
```

---

## 📊 8. Analytics & Reporting (Priority 8)

### Page: `/analytics/survey/:surveyId`

**API Calls:**
```javascript
// Summary stats
const summary = await AnalyticsService.getSurveySummary(surveyId);
// Returns: { total_responses, completion_rate, avg_time, ... }

// Question analytics
const questionData = await AnalyticsService.getQuestionAnalytics(surveyId, questionId);
// Returns: { question, statistics, distribution, ... }

// All questions
const allQuestions = await AnalyticsService.getAllQuestionsAnalytics(surveyId);
```

### Visualizations

**Multiple Choice / Checkbox:**
```jsx
import { Bar, Pie } from 'react-chartjs-2';

const data = {
  labels: ['Option 1', 'Option 2', 'Option 3'],
  datasets: [{
    data: [45, 30, 25],
    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
  }]
};

<Pie data={data} options={options} />
```

**Rating / Scale:**
```jsx
<Bar 
  data={{
    labels: ['1', '2', '3', '4', '5'],
    datasets: [{
      label: 'Response Count',
      data: [5, 12, 28, 45, 35],
      backgroundColor: '#10b981'
    }]
  }}
/>
```

**Time Series:**
```jsx
<Line 
  data={{
    labels: dateLabels,
    datasets: [{
      label: 'Responses per Day',
      data: responseCounts,
      borderColor: '#10b981',
      fill: false
    }]
  }}
/>
```

**Export CSV:**
```javascript
const handleExport = async () => {
  await ExportService.exportToCSV(surveyId);
  // Triggers browser download
};
```

---

## 🤖 9. LLM / AI Features (Priority 9)

### Pages
- `/llm/generate` - Generate survey questions
- `/llm/analyze` - Analyze response sentiment

### Generate Survey
```jsx
const GenerateSurvey = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    const response = await LLMService.generateSurvey({
      prompt: prompt,
      num_questions: 10,
      category: 'satisfaction'
    });
    
    setResult(response.data.survey);
  };

  return (
    <div>
      <textarea 
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the survey you want to create..."
      />
      <button onClick={handleGenerate}>Generate</button>
      
      {result && <GeneratedQuestionsPreview questions={result.questions} />}
    </div>
  );
};
```

### Analyze Responses
```javascript
const handleAnalyze = async () => {
  const analysis = await LLMService.analyzeSurveyResponses(surveyId);
  
  // Display:
  // - Sentiment distribution
  // - Key themes
  // - Word cloud
  // - Recommendations
};
```

---

## 🎨 Layout Components

### Navbar
```jsx
<Navbar>
  <Logo />
  <NavLinks role={user.role}>
    {role === 'admin' && <Link to="/admin">Admin</Link>}
    {role === 'creator' && <Link to="/templates">Templates</Link>}
    <Link to="/surveys">Surveys</Link>
  </NavLinks>
  <UserMenu>
    <Avatar user={user} />
    <Dropdown>
      <Link to="/profile">Profile</Link>
      <Link to="/settings">Settings</Link>
      <button onClick={logout}>Logout</button>
    </Dropdown>
  </UserMenu>
</Navbar>
```

### Sidebar (Admin/Creator)
```jsx
<Sidebar role={user.role}>
  <SidebarItem icon={faHome} to="/dashboard">Dashboard</SidebarItem>
  
  {role === 'admin' && (
    <>
      <SidebarItem icon={faUsers} to="/admin/users">Users</SidebarItem>
      <SidebarItem icon={faChartBar} to="/admin/analytics">Analytics</SidebarItem>
    </>
  )}
  
  {role === 'creator' && (
    <>
      <SidebarItem icon={faFileAlt} to="/templates">Templates</SidebarItem>
      <SidebarItem icon={faPoll} to="/surveys">Surveys</SidebarItem>
      <SidebarItem icon={faLink} to="/collectors">Collectors</SidebarItem>
      <SidebarItem icon={faRobot} to="/llm">AI Tools</SidebarItem>
    </>
  )}
</Sidebar>
```

### ProtectedRoute
```jsx
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { state } = useAuth();
  
  if (!state.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(state.user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

---

## 🔧 Utility Hooks

### useForm
```javascript
const useForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validate) {
      const fieldErrors = validate({ ...values });
      setErrors(fieldErrors);
    }
  };

  const handleSubmit = (onSubmit) => async (e) => {
    e.preventDefault();
    
    const validationErrors = validate ? validate(values) : {};
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length === 0) {
      await onSubmit(values);
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors
  };
};
```

### useDebounce
```javascript
const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

---

## 📦 Component Library Summary

### Common Components (✅ Implemented)
- `Modal` - Reusable modal dialog
- `Toast` - Notification system
- `Loader` - Loading spinner
- `Pagination` - Table pagination

### Layout Components (🔄 To Implement)
- `Navbar` - Top navigation
- `Sidebar` - Side navigation
- `ProtectedRoute` - Auth guard
- `ErrorBoundary` - Error handling

### Feature Components (🔄 To Implement)
- `LoginForm`, `RegisterForm`
- `DashboardCard`, `StatCard`
- `UserTable`, `UserModal`
- `QuestionBuilder`, `QuestionEditor`
- `SurveyCard`, `SurveyList`
- `CollectorCard`, `QRCodeModal`
- `ResponseForm`, `QuestionRenderer`
- `ChartWidget`, `ExportButton`
- `PromptInput`, `AIResult`

---

## 🚀 Implementation Priority

### Phase 1: Core (Week 1)
1. ✅ Common components (Modal, Toast, Loader, Pagination)
2. 🔄 Authentication (Login/Register)
3. 🔄 Layout (Navbar, Sidebar, ProtectedRoute)
4. 🔄 Dashboard (Admin/Creator views)

### Phase 2: Features (Week 2)
5. 🔄 User Management (Admin)
6. 🔄 Template Builder
7. 🔄 Survey Management
8. 🔄 Collector Generation

### Phase 3: Public & Analytics (Week 3)
9. 🔄 Public Response Page
10. 🔄 Analytics Dashboard
11. 🔄 Export Functionality

### Phase 4: AI & Polish (Week 4)
12. 🔄 LLM Features
13. 🔄 UI/UX Polish
14. 🔄 Testing & Bug Fixes

---

## 📝 Development Checklist

### Per Feature Module
- [ ] Create page components
- [ ] Create feature-specific components
- [ ] Implement API integration
- [ ] Add error handling
- [ ] Add loading states
- [ ] Add validation
- [ ] Create SCSS modules
- [ ] Add responsive design
- [ ] Test with backend
- [ ] Document usage

### Quality Checks
- [ ] ESLint passes
- [ ] Build succeeds with no warnings
- [ ] All routes accessible
- [ ] API calls work
- [ ] Error boundaries catch errors
- [ ] Toast notifications work
- [ ] Loading states display
- [ ] Mobile responsive
- [ ] Role-based access works
- [ ] Authentication flow complete

---

## 🎯 Success Criteria

1. ✅ **Authentication:** Login/Logout/Register working
2. ✅ **Role-Based Access:** Admin/Creator/User routes protected
3. ✅ **Dashboard:** Metrics and charts displaying
4. ✅ **Templates:** CRUD operations functional
5. ✅ **Surveys:** Full lifecycle (draft→active→closed)
6. ✅ **Collectors:** Generate & share public links
7. ✅ **Responses:** Public submission working
8. ✅ **Analytics:** Charts and export functional
9. ✅ **AI:** Generate and analyze features working
10. ✅ **Build:** Production build passes cleanly

---

**Next Step:** Begin systematic implementation of each module following this guide.

**Priority Order:** Authentication → Layout → Dashboard → Templates → Surveys → Collectors → Responses → Analytics → LLM

---

*This guide serves as the complete blueprint for the ALLMTAGS frontend implementation.*
