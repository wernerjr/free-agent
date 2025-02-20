# Free Agent

<div align="center">

![Free Agent](https://img.shields.io/badge/Free-Agent-7b55ff?style=for-the-badge)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

A versatile AI chat interface supporting multiple language models, featuring real-time streaming responses, document processing, and a beautiful Dracula-themed UI.

[Features](#features) •
[Getting Started](#getting-started) •
[Installation](#installation) •
[Usage](#usage) •
[Contributing](#contributing)

</div>

## ✨ Features

- 🤖 Real-time chat with multiple AI models
- 🔄 Model switching capability
- 📝 Markdown support with syntax highlighting
- 📁 Document upload and processing
- 🔄 Real-time streaming responses
- 🎨 Beautiful Dracula-themed UI
- 💾 Persistent chat history
- 📱 Responsive design
- 🔒 Secure API key management

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16
- npm or yarn
- An API key for your preferred AI model provider

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/free-agent.git
   cd free-agent
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd ../backend
   npm install
   ```

4. Create a `.env` file in the backend directory:
   ```env
   PORT=8000
   CORS_ORIGIN=http://localhost:5173
   ```

## 💻 Usage

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

4. In the settings page:
   - Enter your API key
   - Select your preferred AI model
   - Start chatting!

## 🏗️ Project Structure

```
.
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── types/          # TypeScript type definitions
│   │   └── App.tsx         # Main application component
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── package.json        # Frontend dependencies
│
└── backend/                 # Node.js + Express backend
    ├── src/
    │   ├── config.ts       # Configuration management
    │   └── index.ts        # Main server file
    └── package.json        # Backend dependencies
```

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Tailwind CSS
- Heroicons
- React Markdown
- Axios

### Backend
- Node.js
- Express
- TypeScript
- Multer
- Support for multiple AI model providers

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the [MIT License](./LICENSE) - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- All supported AI model providers for their amazing APIs
- [Dracula Theme](https://draculatheme.com) for the beautiful color scheme
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [React](https://reactjs.org) for the frontend framework

## 📧 Contact

WernerJr - [@wernerjr](https://twitter.com/wernerjr)

Project Link: [https://github.com/wernerjr/free-agent](https://github.com/wernerjr/free-agent)

---

<div align="center">
Made with ❤️ by WernerJr
</div> 