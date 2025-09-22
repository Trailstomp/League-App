# Lacrosse League Management System

A comprehensive web application for managing lacrosse leagues, teams, players, events, and media galleries with Google Drive integration.

## Features

- **Team Management**: Create and manage teams with custom styling, logos, and divisions
- **Event Scheduling**: Schedule games, practices, and tournaments with location support
- **Media Galleries**: Upload and organize photos/videos with Google Drive integration
- **User Authentication**: Role-based access control (Admin, Coach, Player)
- **Responsive Design**: Works on desktop and mobile devices
- **Event Ticker**: Scrolling display of upcoming events
- **Statistics Tracking**: Win/loss records and league standings

## Tech Stack

- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **File Storage**: Google Drive API integration
- **Authentication**: JWT-based authentication

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- Python (v3.8+)
- MongoDB
- Google Cloud Console account (for Drive integration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lacrosse-league-system
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   yarn install
   cp .env.example .env
   # Edit .env with your backend URL
   ```

4. **Google Drive Integration Setup**
   - Create a project in Google Cloud Console
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized redirect URIs
   - Configure credentials in the admin panel

### Running the Application

1. **Start the backend**
   ```bash
   cd backend
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

2. **Start the frontend**
   ```bash
   cd frontend
   yarn start
   ```

3. **Access the application**
   - Open http://localhost:3000 in your browser
   - Use the admin panel to configure teams, events, and integrations

## Project Structure

```
/
├── backend/
│   ├── server.py              # Main FastAPI application
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Main pages
│   │   └── scheduling/      # Event management components
│   ├── package.json         # Node.js dependencies
│   └── .env.example        # Environment variables template
└── README.md               # This file
```

## Key Components

### Backend
- **Gallery Management**: CRUD operations for media galleries
- **Google Drive Integration**: OAuth flow and file upload
- **Event Management**: Scheduling and event persistence
- **Team/Player Management**: CRUD operations with role permissions

### Frontend
- **Layout.js**: Main application layout with fixed header and navigation
- **Navigation.js**: Collapsible sidebar navigation
- **GalleryAdminManager.js**: Admin interface for gallery management
- **GoogleDriveUploader.js**: File upload component
- **EventsTicker.js**: Scrolling event display

## Configuration

### Environment Variables

**Backend (.env)**
- `MONGO_URL`: MongoDB connection string
- `DB_NAME`: Database name
- `CORS_ORIGINS`: Allowed CORS origins

**Frontend (.env)**
- `REACT_APP_BACKEND_URL`: Backend API URL

### Google Drive Setup

1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 Client ID credentials
5. Add your domain to authorized redirect URIs
6. Use the admin panel to configure the integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.
