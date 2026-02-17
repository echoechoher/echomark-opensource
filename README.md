# EchoMark

> 🎧 A podcast note-taking tool with voice marking support

EchoMark helps you quickly mark interesting moments while listening to podcasts, especially when your hands are busy (cooking, running, etc.). It automatically transcribes audio, captures context around marked timestamps, and lets you add personal thoughts.

## Features

- **Podcast Import** - Import podcasts via URL (currently supports 小宇宙/Xiaoyuzhou)
- **Auto Transcription** - Powered by Alibaba Cloud Tingwu (通义听悟)
- **Smart Context** - Automatically captures 2 sentences before and after each mark
- **Siri Integration** - Mark moments with "Hey Siri" voice commands on iOS
- **Flomo-style UI** - Mark library as homepage, focusing on accumulated knowledge
- **PWA Support** - Install as a native-like app on mobile devices

## Screenshots

<!-- Add your screenshots here -->

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI Components
- Supabase Auth

### Backend
- Python 3.12+
- FastAPI
- SQLAlchemy (async)
- PostgreSQL (Supabase)

### Services
- **Database & Auth**: Supabase
- **Transcription**: Alibaba Cloud Tingwu (通义听悟)
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Railway

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- Supabase account
- Alibaba Cloud account (for Tingwu API)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/echomark-opensource.git
cd echomark-opensource
```

### 2. Set up the backend

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the server
uvicorn main:app --reload
```

### 3. Set up the frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the dev server
npm run dev
```

### 4. Open http://localhost:3000

## Environment Variables

### Backend (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `TINGWU_ACCESS_KEY_ID` | Alibaba Cloud Access Key ID |
| `TINGWU_ACCESS_KEY_SECRET` | Alibaba Cloud Access Key Secret |
| `TINGWU_APP_KEY` | Tingwu App Key |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_API_BASE` | Backend API URL |

## Deployment

### Backend (Railway)

1. Create a new project on Railway
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy

### Frontend (Vercel)

1. Import project to Vercel
2. Set environment variables
3. Deploy

## Project Structure

```
echomark-opensource/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── contexts/   # React contexts
│   │   ├── services/   # API services
│   │   └── lib/        # Utilities
│   └── package.json
│
├── server/             # FastAPI backend
│   ├── routers/        # API routes
│   ├── services/       # Business logic
│   ├── models.py       # Database models
│   └── main.py         # App entry point
│
├── LICENSE
└── README.md
```

## iOS Siri Integration

EchoMark supports voice marking through iOS Shortcuts:

1. Open the Settings page in the app
2. Follow the guide to set up Siri Shortcuts
3. Use "Hey Siri, mark" to quickly mark moments
4. Use "Hey Siri, mark thought" to mark with voice input

## Roadmap

- [ ] Playback speed control
- [ ] Support more podcast platforms (Apple Podcasts, Spotify)
- [ ] Mark sharing
- [ ] AI-powered summaries
- [ ] Multi-language support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Supabase](https://supabase.com) - Backend as a Service
- [Alibaba Cloud Tingwu](https://tingwu.aliyun.com) - AI Transcription
- [Vercel](https://vercel.com) & [Railway](https://railway.app) - Hosting platforms
- [Flomo](https://flomoapp.com) - UI/UX inspiration
