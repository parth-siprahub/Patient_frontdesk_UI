# NeuroAssist v3 - AI-Powered Healthcare Platform

A comprehensive healthcare management system with AI-powered audio transcription, symptom analysis, and appointment booking capabilities.

## 🚀 Features

### Core Functionality
- **Patient Management**: Complete patient registration, authentication, and profile management
- **Appointment Booking**: Schedule appointments with doctors, voice or text symptom submission
- **Audio Consultations**: Record and transcribe patient consultations using AssemblyAI
- **AI Analysis**: Automated symptom analysis and medical specialty detection using Google Gemini
- **SOAP Notes**: AI-generated clinical documentation (Subjective, Objective, Assessment, Plan)
- **Doctor Dashboard**: View appointments, consultations, and patient history
- **Role-Based Access**: Separate interfaces for patients, doctors, and front desk staff

### Technical Highlights
- RESTful API with FastAPI
- JWT-based authentication
- Real-time audio processing
- AI-powered medical insights
- Responsive React frontend

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL
- **ORM**: SQLModel
- **Authentication**: JWT (python-jose)
- **AI Services**:
  - AssemblyAI (audio transcription)
  - Google Gemini (medical analysis)
- **Security**: Bcrypt password hashing

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Routing**: React Router v6
- **HTTP**: Fetch API

## 📋 Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- AssemblyAI API key
- Google Gemini API key

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DB-API_Integrated_NeuroAssist-1
```

### 2. Backend Setup

#### Create Virtual Environment
```bash
python -m venv .venv

# Windows
.\.venv\Scripts\Activate.ps1

# Linux/Mac
source .venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Environment Variables
Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/neuroassistdb

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# AI Services
ASSEMBLYAI_API_KEY=your-assemblyai-api-key
GEMINI_API_KEY=your-google-gemini-api-key

# Application
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:8080
```

#### Initialize Database
```bash
# The database will be automatically initialized on first run
python -m uvicorn app.main:app --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

## 🚀 Running the Application

### Start Backend
```bash
# From project root
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs

### Start Frontend
```bash
# From frontend directory
cd frontend
npm run dev
```

Frontend will be available at: http://localhost:8080

## 📁 Project Structure

```
DB-API_Integrated_NeuroAssist-1/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── appointments.py    # Appointment endpoints
│   │       ├── auth.py           # Authentication
│   │       ├── consultations.py  # Consultation management
│   │       ├── dashboard.py      # Dashboard stats
│   │       └── users.py          # User management
│   ├── core/
│   │   ├── config.py            # Configuration
│   │   ├── db.py                # Database connection
│   │   └── security.py          # Password hashing, JWT
│   ├── models/
│   │   └── base.py              # Database models
│   ├── schemas/
│   │   └── appointment.py       # Pydantic schemas
│   ├── services/
│   │   ├── audio_processing.py  # AssemblyAI integration
│   │   ├── gemini_service.py    # Google Gemini integration
│   │   └── soap_generator.py    # SOAP note generation
│   └── main.py                  # FastAPI application
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── dashboard/
│   │   │   │   ├── BookAppointment.tsx
│   │   │   │   ├── PastConsultations.tsx
│   │   │   │   └── Profile.tsx
│   │   │   ├── Login.tsx
│   │   │   └── SignUp.tsx
│   │   ├── components/ui/       # Reusable components
│   │   ├── contexts/            # React contexts
│   │   └── lib/                 # Utilities
│   └── package.json
│
└── requirements.txt
```

## 🔐 User Roles

The system supports three user roles:

1. **PATIENT**: Book appointments, upload symptoms, view consultation history
2. **DOCTOR**: View appointments, manage consultations, generate SOAP notes
3. **FRONT_DESK**: Administrative access to appointments and users

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

### Appointments
- `POST /api/v1/appointments/` - Create appointment
- `GET /api/v1/appointments/me` - Get user appointments
- `PATCH /api/v1/appointments/{id}/status` - Update appointment status

### Consultations
- `POST /api/v1/consultations/` - Create consultation with audio
- `GET /api/v1/consultations/me` - Get user consultations
- `GET /api/v1/consultations/{id}` - Get specific consultation

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics

## 🧪 Testing

### Backend Tests
```bash
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔧 Configuration

### CORS Settings
CORS is configured in `app/main.py`. By default, it allows requests from `http://localhost:8080`.

To modify allowed origins:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://your-frontend-url"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Database Models
Main models include:
- User (patients, doctors, front desk)
- PatientProfile & DoctorProfile
- Appointment
- Consultation
- AudioFile
- SOAPNote
- AuditLog

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure frontend is running on http://localhost:8080
- Check CORS middleware configuration in `app/main.py`
- Clear browser cache and restart both servers

**Database Connection Errors**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Ensure database exists

**Authentication Issues**
- Verify JWT_SECRET is set in `.env`
- Check token expiration settings
- Ensure user is logged in before accessing protected routes

**Audio Upload Failures**
- Verify AssemblyAI API key is valid
- Check file size limits
- Ensure proper audio format (supported formats: mp3, wav, m4a, aac)

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Contributors Here]

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact: [Your Contact Info]

## 🔄 Recent Updates

### Latest Version (v3.0)
- ✅ Fixed appointment booking CORS issues
- ✅ Improved audio transcription pipeline
- ✅ Enhanced AI-powered symptom analysis
- ✅ Optimized database queries
- ✅ Updated frontend UI/UX

---

**Built with ❤️ for better healthcare management**
