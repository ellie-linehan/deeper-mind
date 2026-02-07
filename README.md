# Deeper Mind

A real-time neurofeedback application that uses EEG brainwave data to guide users into deep flow states through AI coaching, adaptive audio, and live visualization.

## 🧠 Features

- **Real-time EEG Processing**: Connects to BrainBit Flex headset via Web Bluetooth
- **AI Coaching**: Google Gemini provides personalized guidance based on your brainwave patterns
- **Adaptive Audio Engine**: Binaural beats (40Hz Gamma) and ambient soundscapes that respond to your mental state
- **Live Visualization**: 
  - Real-time 4-channel EEG waveform graph
  - Detailed brainwave metrics (Alpha, Beta, Theta, Gamma)
  - Signal quality monitoring
- **Demo Mode**: Full simulation for testing without hardware
- **Neurofeedback Protocol**: 7-minute guided session (Calibration → Alpha Induction → Gamma Flow)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- BrainBit Flex headset (optional - Demo Mode works without it)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd deeper-mind

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Configuration

Add your Gemini API key to `.env.local`:

```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### With Hardware

1. Click **"Connect Device"**
2. Select your BrainBit headset from the browser dialog
3. Adjust electrode placement until all signals are green
4. Click **"Analyze Current State"** for AI pre-session calibration
5. Click **"Start Deep Flow Session"** to begin

### Demo Mode (No Hardware)

1. Click **"Try Demo"** to enable simulation
2. All features work exactly as with real hardware
3. Perfect for presentations or testing

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router), React 19
- **Styling**: Tailwind CSS
- **AI**: Google Gemini 2.0 Flash
- **Hardware**: BrainBit Flex (web-neurosdk-brainbit)
- **Signal Processing**: FFT.js for frequency analysis
- **APIs**: Web Bluetooth, Web Audio, Web Speech

## 📊 How It Works

1. **Signal Acquisition**: 4-channel EEG data (T3, T4, O1, O2) at 250Hz
2. **Processing**: FFT-based frequency band extraction (Alpha: 8-13Hz, Beta: 13-30Hz, Theta: 4-8Hz, Gamma: 30-100Hz)
3. **Feedback Loop**: 
   - Audio engine adjusts binaural beats based on current state
   - AI coach provides verbal guidance every 30 seconds
   - Visual feedback shows real-time metrics
4. **Protocol**: Guides user through optimal brainwave progression for flow state

## 🔒 Privacy

- All processing happens locally in your browser
- API calls only to Google Gemini for AI coaching
- No brainwave data is stored or transmitted

## 📝 License

MIT

## 🙏 Acknowledgments

Built for [Hackathon Name] using cutting-edge neurotechnology and AI.
