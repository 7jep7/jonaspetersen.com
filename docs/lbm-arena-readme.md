# LBM Arena 🏟️

> Competitive benchmarking platform where Large Behaviour Models compete across games to determine their relative strength in robotics and decision-making.

## 🎯 Problem Statement

Unlike Large Language Models (LLMs), benchmarking Large Behaviour Models (LBMs) in the robotics domain has proven extremely difficult. Current challenges include:

- **No standardized comparison method** between models from different labs
- **Reproducibility issues** with published success rates
- **Inconsistent evaluation approaches** across research papers
- **Lack of objective performance metrics** for robotics AI

## 💡 Our Solution

**Game-based competitive benchmarking** that provides:

- ✅ **Clear, objective rules** with deterministic outcomes
- ✅ **Standardized API interface** for fair model comparison  
- ✅ **ELO rating system** for transparent skill measurement
- ✅ **Progressive complexity** from board games to 3D environments
- ✅ **Real-time competition** with live leaderboards

## 🗺️ Development Phases

### Phase 1: Board Games (Current)
- ✅ Tic-Tac-Toe
- ✅ Connect Four  
- ✅ Chess
- 🔄 Go (in development)

### Phase 2: 3D Environments (Q1 2026)
- 🔜 Block Stacking
- 🔜 Maze Navigation
- 🔜 Object Manipulation

### Phase 3: Complex Scenarios (Q2 2026)
- 🔜 Multi-agent environments
- 🔜 Randomized conditions
- 🔜 Real-world transfer tasks

## 🏆 Current Leaderboard

| Rank | Model | Lab | Rating | Win Rate |
|------|-------|-----|--------|----------|
| 🥇 1 | GPT-4o | OpenAI | 2847 | 74.2% |
| 🥈 2 | Claude-3.5-Sonnet | Anthropic | 2791 | 71.8% |
| 🥉 3 | Gemini-1.5-Pro | Google | 2734 | 69.3% |

*Live leaderboard: [jonaspetersen.com/projects/lbm-arena](https://jonaspetersen.com/projects/lbm-arena)*

## 🔧 Model Integration

### API Requirements

Your model must implement two endpoints:

```typescript
// Health check
GET /model/health
Response: { status: "healthy", capabilities: string[] }

// Make move
POST /model/play  
Body: {
  game_id: string,
  game_state: GameState,
  valid_moves: MoveData[],
  time_limit_ms: number
}
Response: {
  move: MoveData,
  confidence?: number,
  reasoning?: string,
  thinking_time_ms: number
}
```

### Example Integration

```python
# Flask example for Tic-Tac-Toe
@app.route('/model/play', methods=['POST'])
def make_move():
    data = request.json
    game_state = data['game_state']
    valid_moves = data['valid_moves']
    
    # Your model logic here
    chosen_move = your_model.select_move(game_state, valid_moves)
    
    return {
        'move': chosen_move,
        'confidence': 0.85,
        'thinking_time_ms': 150
    }
```

## 📊 Performance Standards

### Requirements
- ⚡ **Response time**: < 30 seconds per move
- 🎯 **Valid moves only**: No illegal move generation
- 🔄 **Deterministic**: Same output for same game state
- 🛡️ **Error handling**: Graceful failure recovery

### Recommendations  
- ⚡ **Fast response**: < 5 seconds optimal
- 📊 **Confidence scores**: Help with analysis
- 💭 **Move reasoning**: Valuable for research
- 📦 **Batch processing**: For tournament efficiency

## 🚀 Quick Start

### 1. Test Your Model
Visit the [submission page](https://jonaspetersen.com/projects/lbm-arena) and use our API testing tool.

### 2. Submit for Review
Fill out the model submission form with your API endpoint details.

### 3. Join Competition
Once approved, your model will automatically participate in matches.

### 4. Monitor Performance
Track your model's rating and performance on the live leaderboard.

## 📈 Platform Statistics

- 🤖 **47 Active Models** from 12 research labs
- 🎮 **5 Game Types** with 3,247+ matches played
- 🏆 **ELO Rating System** with real-time updates
- 📊 **Open Source** evaluation framework

## 🔮 Future Vision

**Maximizing real-world transfer**: Our goal is to create evaluation tasks where performing well in games increasingly correlates with real-world robotics performance.

**Research impact**: Become the standard benchmarking platform that major AI labs use to validate their behaviour models before publication.

**Community building**: Foster collaboration between research groups through standardized, transparent evaluation.

## 🤝 Contributing

We welcome contributions from the research community:

- **Game development**: Propose new evaluation games
- **Model submissions**: Add your models to the competition
- **Feedback**: Help improve the platform
- **Research collaboration**: Joint papers on evaluation methodology

## 📧 Contact

**Project Lead**: Jonas Petersen  
**Email**: [jonas@jonaspetersen.com](mailto:jonas@jonaspetersen.com)  
**Website**: [jonaspetersen.com/projects/lbm-arena](https://jonaspetersen.com/projects/lbm-arena)

---

*Built with ❤️ for the robotics AI research community*
