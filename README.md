# Astrix - Divine Vedic Astrology AI 🔮

A sophisticated, AI-powered Vedic and KP Astrology application with a stunning "Divine Interface" aesthetic. Astrix provides personalized astrological readings, chart analysis, and predictions using advanced AI and traditional Vedic astrology principles.

## ✨ Features

- **Intelligent Astrological AI**: Powered by advanced language models with deep knowledge of Vedic & KP astrology
- **Birth Chart Generation**: Calculate and visualize detailed birth charts with planetary positions
- **Voice Interactions**: Talk to Astrix using voice notes and receive audio responses
- **Bilingual Support**: Natural Hinglish (Hindi + English) for text chat, pure English for voice
- **KP System Analysis**: Star Lords, Sub Lords, and precise predictions
- **Dasha Calculations**: Vimshottari Dasha periods and predictions
- **Personalized Daily Horoscope**: Get your daily cosmic insights
- **Conversation Memory**: Maintains context throughout your consultation
- **Divine Interface**: Beautiful, spiritual UI with animated Mandala backgrounds

## 🎨 Design Philosophy

The "Divine Interface" combines modern web aesthetics with spiritual elements:
- Vibrant color palette (Saffron, Gold, Deep Maroon, Void Black)
- Animated Mandala backgrounds
- Elegant typography (Cinzel, Outfit)
- Floating glass elements
- Smooth micro-animations

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Lucide Icons
- Custom Vedic Astrology calculations (Swiss Ephemeris algorithms)

### Backend
- Python 3.12+
- Flask (Web framework)
- Groq API (AI chat, TTS, STT)
- OpenStreetMap Nominatim (Location services)

## 📋 Prerequisites

- Python 3.12 or higher
- Groq API key ([Get one here](https://console.groq.com))
- Modern web browser with JavaScript enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/astrix.git
   cd astrix
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_PRIMARY_MODEL=openai/gpt-oss-120b
   GROQ_FALLBACK_MODEL=llama-3.3-70b-versatile
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open in browser**
   
   Navigate to `http://127.0.0.1:5000`

## 🌐 Deployment

### Vercel Deployment

This app is configured for easy deployment on Vercel:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `GROQ_API_KEY`
   - `GROQ_PRIMARY_MODEL` (optional)
   - `GROQ_FALLBACK_MODEL` (optional)

## 📱 Usage

### Creating Your Birth Chart

1. Click on "Create Birth Chart" or the "Cosmos" icon
2. Enter your birth details:
   - Name
   - Date and time of birth
   - Birth location (searchable)
   - Optional: timezone
3. Submit to generate your chart

### Chat Interface

- **Text Chat**: Type your questions naturally in Hinglish
- **Voice Chat**: Click the microphone icon to record your question
  - Voice responses are audio-only for a seamless experience
- Use quick action chips for common queries (Career, Love, Dasha, Health)

### Features Available

- View your birth chart visualization
- Ask about planetary positions and influences
- Get Dasha period analysis
- Receive daily horoscopes
- Ask specific life questions (career, relationships, health, etc.)

## 🔧 Configuration

### AI Models

The app uses Groq's API with configurable models:
- **Primary Model**: `openai/gpt-oss-120b` (default)
- **Fallback Model**: `llama-3.3-70b-versatile` (default)
- **TTS Model**: `playai-tts` with `Cillian-PlayAI` voice
- **STT Model**: `whisper-large-v3`

### Precision

Astrological calculations use 4 decimal places by default for accuracy.

## 📂 Project Structure

```
astrix/
├── app.py                 # Flask backend
├── static/
│   ├── index.html        # Main HTML file
│   ├── style.css         # Divine Interface styling
│   ├── main.js           # Frontend logic
│   └── astro.js          # Astrological calculations
├── requirements.txt       # Python dependencies
├── vercel.json           # Vercel configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Swiss Ephemeris calculations adapted for JavaScript
- Groq API for powerful AI capabilities
- OpenStreetMap for location services
- The Vedic astrology community for knowledge and wisdom

## ⚠️ Disclaimer

This application is for entertainment and educational purposes only. Astrological readings should not be considered as professional advice for life decisions, medical conditions, or financial matters. Always consult qualified professionals for serious life decisions.

## 📧 Contact

For questions, suggestions, or support, please open an issue on GitHub.

---

**Made with 🌟 and ✨ by combining ancient wisdom with modern technology**
<<<<<<< HEAD
# Astrix - Divine Vedic Astrology AI 🔮

A sophisticated, AI-powered Vedic and KP Astrology application with a stunning "Divine Interface" aesthetic. Astrix provides personalized astrological readings, chart analysis, and predictions using advanced AI and traditional Vedic astrology principles.

## ✨ Features

- **Intelligent Astrological AI**: Powered by advanced language models with deep knowledge of Vedic & KP astrology
- **Birth Chart Generation**: Calculate and visualize detailed birth charts with planetary positions
- **Voice Interactions**: Talk to Astrix using voice notes and receive audio responses
- **Bilingual Support**: Natural Hinglish (Hindi + English) for text chat, pure English for voice
- **KP System Analysis**: Star Lords, Sub Lords, and precise predictions
- **Dasha Calculations**: Vimshottari Dasha periods and predictions
- **Personalized Daily Horoscope**: Get your daily cosmic insights
- **Conversation Memory**: Maintains context throughout your consultation
- **Divine Interface**: Beautiful, spiritual UI with animated Mandala backgrounds

## 🎨 Design Philosophy

The "Divine Interface" combines modern web aesthetics with spiritual elements:
- Vibrant color palette (Saffron, Gold, Deep Maroon, Void Black)
- Animated Mandala backgrounds
- Elegant typography (Cinzel, Outfit)
- Floating glass elements
- Smooth micro-animations

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Lucide Icons
- Custom Vedic Astrology calculations (Swiss Ephemeris algorithms)

### Backend
- Python 3.12+
- Flask (Web framework)
- Groq API (AI chat, TTS, STT)
- OpenStreetMap Nominatim (Location services)

## 📋 Prerequisites

- Python 3.12 or higher
- Groq API key ([Get one here](https://console.groq.com))
- Modern web browser with JavaScript enabled

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/astrix.git
   cd astrix
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_PRIMARY_MODEL=openai/gpt-oss-120b
   GROQ_FALLBACK_MODEL=llama-3.3-70b-versatile
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Open in browser**
   
   Navigate to `http://127.0.0.1:5000`

## 🌐 Deployment

### Vercel Deployment

This app is configured for easy deployment on Vercel:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**
   - `GROQ_API_KEY`
   - `GROQ_PRIMARY_MODEL` (optional)
   - `GROQ_FALLBACK_MODEL` (optional)

## 📱 Usage

### Creating Your Birth Chart

1. Click on "Create Birth Chart" or the "Cosmos" icon
2. Enter your birth details:
   - Name
   - Date and time of birth
   - Birth location (searchable)
   - Optional: timezone
3. Submit to generate your chart

### Chat Interface

- **Text Chat**: Type your questions naturally in Hinglish
- **Voice Chat**: Click the microphone icon to record your question
  - Voice responses are audio-only for a seamless experience
- Use quick action chips for common queries (Career, Love, Dasha, Health)

### Features Available

- View your birth chart visualization
- Ask about planetary positions and influences
- Get Dasha period analysis
- Receive daily horoscopes
- Ask specific life questions (career, relationships, health, etc.)

## 🔧 Configuration

### AI Models

The app uses Groq's API with configurable models:
- **Primary Model**: `openai/gpt-oss-120b` (default)
- **Fallback Model**: `llama-3.3-70b-versatile` (default)
- **TTS Model**: `playai-tts` with `Cillian-PlayAI` voice
- **STT Model**: `whisper-large-v3`

### Precision

Astrological calculations use 4 decimal places by default for accuracy.

## 📂 Project Structure

```
astrix/
├── app.py                 # Flask backend
├── static/
│   ├── index.html        # Main HTML file
│   ├── style.css         # Divine Interface styling
│   ├── main.js           # Frontend logic
│   └── astro.js          # Astrological calculations
├── requirements.txt       # Python dependencies
├── vercel.json           # Vercel configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Swiss Ephemeris calculations adapted for JavaScript
- Groq API for powerful AI capabilities
- OpenStreetMap for location services
- The Vedic astrology community for knowledge and wisdom

## ⚠️ Disclaimer

This application is for entertainment and educational purposes only. Astrological readings should not be considered as professional advice for life decisions, medical conditions, or financial matters. Always consult qualified professionals for serious life decisions.

## 📧 Contact

For questions, suggestions, or support, please open an issue on GitHub.

---

**Made with 🌟 and ✨ by combining ancient wisdom with modern technology**
=======
# astrix
This is an most perfect AI astrologer at current moment.
>>>>>>> origin/main
