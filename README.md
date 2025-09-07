# MemoryStream

Universal AI Memory & Context Management Platform

## 🧠 What is MemoryStream?

MemoryStream is the foundational infrastructure layer that provides persistent, cross-platform AI memory and context management. We solve the fragmentation problem where every AI interaction starts from zero by creating a secure, user-controlled memory vault that any AI service can access.

## 🚀 Features

- **Universal Memory**: Connect all your AI interactions across platforms
- **Intelligent Search**: Semantic search across all your memories
- **Privacy First**: End-to-end encryption with user-controlled keys
- **Cross-Platform**: Works with ChatGPT, Claude, and any AI service
- **Real-time Sync**: Access your memory from anywhere

## 🏗️ Architecture

- **Backend**: Node.js/Express API with JWT authentication
- **Frontend**: React with Tailwind CSS
- **Database**: In-memory (demo) / MongoDB (production)
- **Security**: RSA encryption, bcrypt password hashing
- **Deployment**: Vercel serverless functions

## 📦 Deployment

### Backend (API)
1. Deploy to Vercel: `vercel --prod` in `/backend`
2. Set environment variables in Vercel dashboard
3. API will be available at `https://your-api.vercel.app`

### Frontend
1. Update API URL in frontend code
2. Deploy to Vercel: `vercel --prod` in `/frontend`
3. App will be available at `https://your-app.vercel.app`

## 🔧 Development

### Backend
```bash
cd backend
npm install
npm run dev
