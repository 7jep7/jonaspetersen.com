# Hand Teleop System - Complete Deployment Guide

## 🏗️ Architecture Overview

```
┌─────────────────────┐    API Calls    ┌──────────────────────┐
│   Frontend UI       │◄──────────────►│  Hand Tracking API   │
│  jonaspetersen.com  │   WebSocket     │  hand-teleop-api     │
│  (Vercel)           │   Connection    │  (Render.com)        │
└─────────────────────┘                 └──────────────────────┘
```

## 📋 Microservices Responsibilities

### Frontend Service (Vercel)
**URL:** `https://jonaspetersen.com`

**Responsibilities:**
- ✅ User interface and navigation
- ✅ Robot type selection and configuration
- ✅ Display tracking results and robot status
- ✅ Handle user input (buttons, settings)
- ✅ Portfolio presentation and project showcase

**Does NOT handle:**
- ❌ Camera access or video processing
- ❌ Hand pose detection or computer vision
- ❌ Inverse kinematics calculations
- ❌ 3D robot visualization rendering

### Backend Service (Render.com)
**URL:** `https://hand-teleop-api.onrender.com`

**Responsibilities:**
- ✅ Webcam access and video stream processing
- ✅ Hand pose detection (MediaPipe + WiLoR)
- ✅ Real-time coordinate extraction and tracking
- ✅ Inverse kinematics computation
- ✅ Robot movement calculations and joint angles
- ✅ 3D visualization rendering (Three.js)
- ✅ Serve interactive demo interface
- ✅ WebSocket real-time communication
- ✅ API endpoints for configuration and control

**Does NOT handle:**
- ❌ Portfolio website content
- ❌ User authentication or accounts
- ❌ Database persistence (stateless service)

## 🔗 API Communication

### REST API Endpoints

```bash
# Configuration
GET  /api/health                    # Health check for Render.com
GET  /api/robots                    # List available robot types
POST /api/config/robot              # Set active robot configuration
GET  /api/config                    # Get current configuration

# Hand Tracking
POST /api/track                     # Process single frame
POST /api/tracking/start            # Start tracking session
POST /api/tracking/stop/:sessionId  # Stop tracking session

# Demo Interfaces  
GET  /demo                          # Full interactive interface
GET  /embed                         # Embeddable widget version
```

### WebSocket Communication

```javascript
// Real-time tracking data stream
const ws = new WebSocket('wss://hand-teleop-api.onrender.com/api/tracking/live');

// Message types:
// - config: Initial robot configuration
// - tracking_result: Live hand tracking data
// - config_update: Robot configuration changed
// - ping/pong: Connection health monitoring
```

### Data Flow

1. **User selects robot type** → Frontend calls `POST /api/config/robot`
2. **User starts tracking** → Frontend connects to WebSocket `/api/tracking/live`
3. **Backend processes camera** → MediaPipe extracts hand landmarks
4. **Inverse kinematics** → Backend calculates robot joint angles
5. **Live updates** → WebSocket streams data to frontend
6. **Frontend displays** → Real-time robot control visualization

## 🚀 Deployment Instructions

### Step 1: Deploy Backend to Render.com

1. **Create Render.com account** and connect your GitHub repo
2. **Create new Web Service** from `hand-teleop-system` folder
3. **Configuration:**
   ```yaml
   # render.yaml (already created)
   services:
     - type: web
       name: hand-teleop-api
       env: python
       buildCommand: "pip install -r requirements.txt"
       startCommand: "python render_backend.py"
       plan: free
       envVars:
         - key: PYTHON_VERSION
           value: "3.10.0"
         - key: PORT
           value: "8000"
       healthCheckPath: "/api/health"
   ```

4. **Environment Variables** (optional):
   ```
   CORS_ORIGINS=https://jonaspetersen.com,https://*.vercel.app
   DEBUG_MODE=false
   MAX_SESSIONS=10
   ```

5. **Deploy** and note your Render.com URL: `https://hand-teleop-api.onrender.com`

### Step 2: Update Frontend for Production

1. **Update API configuration** in your Remix app:
   ```typescript
   // app/config/api.ts
   export const API_CONFIG = {
     BACKEND_URL: process.env.NODE_ENV === 'production'
       ? 'https://hand-teleop-api.onrender.com'  // Your actual Render URL
       : 'http://localhost:8000',
     
     WS_URL: process.env.NODE_ENV === 'production'
       ? 'wss://hand-teleop-api.onrender.com'
       : 'ws://localhost:8000'
   };
   ```

2. **Update iframe src** in `projects.hand-teleop.tsx`:
   ```tsx
   <iframe
     src="https://hand-teleop-api.onrender.com/demo"  // Production URL
     className="w-full h-[700px] border-0"
     title="Hand Teleop System - Full Application"
     allow="camera; microphone"
     sandbox="allow-same-origin allow-scripts allow-forms"
   />
   ```

3. **Deploy to Vercel** (automatic if connected to GitHub)

### Step 3: Test Integration

1. **Health Check:**
   ```bash
   curl https://hand-teleop-api.onrender.com/api/health
   ```

2. **Available Robots:**
   ```bash
   curl https://hand-teleop-api.onrender.com/api/robots
   ```

3. **Demo Interface:**
   Visit: `https://hand-teleop-api.onrender.com/demo`

4. **Portfolio Integration:**
   Visit: `https://jonaspetersen.com/projects/hand-teleop`

## 🔧 Development Workflow

### Local Development

1. **Start Backend:**
   ```bash
   # Start from your separate hand-teleop-system repository
   cd /path/to/your/hand-teleop-system
   # Follow backend repo instructions to start server
   # Backend should run on http://localhost:8000
   ```

2. **Start Frontend:**
   ```bash
   cd jonaspetersen.com
   npm run dev
   # Frontend running on http://localhost:3000
   ```

3. **Test Integration:**
   - Frontend iframe points to `http://localhost:8000`
   - API calls go to `http://localhost:8000`
   - WebSocket connects to `ws://localhost:8000`

### Production URLs

- **Portfolio:** `https://jonaspetersen.com/projects/hand-teleop`
- **Backend API:** `https://hand-teleop-api.onrender.com`
- **Demo Interface:** `https://hand-teleop-api.onrender.com/demo`
- **API Docs:** `https://hand-teleop-api.onrender.com/docs` (FastAPI auto-docs)

## 🎯 Integration Patterns

### Pattern 1: Iframe Embedding (Current)
```tsx
// Simple integration - backend handles everything
<iframe src="https://hand-teleop-api.onrender.com/demo" />
```

**Pros:** Simple, complete functionality, self-contained  
**Cons:** Limited customization, separate UI context

### Pattern 2: API Integration (Advanced)
```tsx
// Frontend controls UI, backend provides data
const [robotData, setRobotData] = useState();
const ws = new WebSocket('wss://hand-teleop-api.onrender.com/api/tracking/live');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  setRobotData(data);
  // Update your custom UI
};
```

**Pros:** Full UI control, seamless integration, custom styling  
**Cons:** More complex, requires WebSocket handling

## 🔒 Security Considerations

1. **CORS Configuration:** Backend allows requests from your frontend domain
2. **Rate Limiting:** API endpoints have reasonable rate limits
3. **Input Validation:** All API inputs are validated server-side
4. **HTTPS Only:** Production uses HTTPS for all communication
5. **Camera Permissions:** Handled gracefully with user consent

## 📊 Performance Optimization

1. **WebSocket Throttling:** Limit updates to 30fps maximum
2. **Data Compression:** Minimize payload size for real-time updates
3. **Caching:** Robot configurations and models are cached
4. **CDN:** Static assets served via CDN
5. **Health Monitoring:** Automatic service health checks

## 🐛 Debugging

### Common Issues

1. **CORS Errors:**
   - Check backend CORS configuration
   - Verify frontend domain is allowlisted

2. **WebSocket Connection Failed:**
   - Check Render.com service status
   - Verify WebSocket URL format (wss:// for HTTPS)

3. **Camera Access Denied:**
   - Ensure HTTPS is used (required for camera access)
   - Check browser permissions

4. **API Timeout:**
   - Render.com free tier spins down after inactivity
   - First request may take 30+ seconds to wake up

### Debug Tools

```bash
# Test API health
curl https://hand-teleop-api.onrender.com/api/health

# Check WebSocket connection
wscat -c wss://hand-teleop-api.onrender.com/api/tracking/live

# Monitor Render.com logs
# Via Render.com dashboard → Services → hand-teleop-api → Logs
```

## 🎓 Learning Outcomes

This setup demonstrates:
- ✅ **Microservices Architecture:** Clean separation of concerns
- ✅ **Real-time Communication:** WebSocket integration
- ✅ **Cross-Origin Resource Sharing:** Secure API access
- ✅ **Modern Deployment:** Cloud-native application deployment
- ✅ **Computer Vision Integration:** AI/ML model serving
- ✅ **Full-Stack Development:** Frontend + Backend coordination

Perfect for showcasing your skills to potential employers! 🚀
