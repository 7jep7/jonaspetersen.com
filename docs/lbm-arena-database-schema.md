// File deleted
# LBM Arena Database Schema Design

## Overview
Database schema for the LBM Arena competitive benchmarking platform. Designed to be hosted on a separate backend service (e.g., Supabase, PlanetScale, or custom API) since the main website runs on Vercel.

## Core Tables

### 1. Models
```sql
CREATE TABLE models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    organization VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(500),
    api_key_hash VARCHAR(255), -- encrypted
    status ENUM('pending', 'active', 'suspended', 'retired') DEFAULT 'pending',
    rating INTEGER DEFAULT 1200, -- ELO rating
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_name_org (name, organization),
    INDEX idx_rating (rating DESC),
    INDEX idx_status (status),
    INDEX idx_organization (organization)
);
```

### 2. Games
```sql
CREATE TABLE games (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'tic-tac-toe', 'chess'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('board_game', '3d_environment', 'puzzle') NOT NULL,
    difficulty ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
    max_moves INTEGER,
    time_limit_seconds INTEGER DEFAULT 30,
    rules_json JSON, -- game-specific rules and configuration
    status ENUM('active', 'beta', 'coming_soon') DEFAULT 'coming_soon',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_status (status)
);
```

### 3. Matches
```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id VARCHAR(50) NOT NULL,
    player1_id UUID NOT NULL,
    player2_id UUID NOT NULL,
    status ENUM('scheduled', 'in_progress', 'completed', 'failed', 'timeout') DEFAULT 'scheduled',
    result ENUM('player1_win', 'player2_win', 'draw', 'timeout', 'error') NULL,
    moves_count INTEGER DEFAULT 0,
    duration_seconds INTEGER,
    game_state_json JSON, -- final game state
    error_message TEXT,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player1_id) REFERENCES models(id),
    FOREIGN KEY (player2_id) REFERENCES models(id),
    
    INDEX idx_game_id (game_id),
    INDEX idx_players (player1_id, player2_id),
    INDEX idx_status (status),
    INDEX idx_completed_at (completed_at DESC),
    INDEX idx_game_players (game_id, player1_id, player2_id)
);
```

### 4. Match Moves
```sql
CREATE TABLE match_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    player_id UUID NOT NULL,
    move_number INTEGER NOT NULL,
    move_data JSON NOT NULL, -- game-specific move representation
    game_state_after JSON, -- board state after this move
    thinking_time_ms INTEGER,
    confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
    reasoning TEXT, -- optional: model's explanation of the move
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES models(id),
    
    UNIQUE KEY unique_match_move (match_id, move_number),
    INDEX idx_match_id (match_id),
    INDEX idx_player_id (player_id),
    INDEX idx_thinking_time (thinking_time_ms)
);
```

### 5. Model Game Support
```sql
CREATE TABLE model_game_support (
    model_id UUID NOT NULL,
    game_id VARCHAR(50) NOT NULL,
    is_supported BOOLEAN DEFAULT true,
    avg_response_time_ms INTEGER,
    last_tested_at TIMESTAMP,
    notes TEXT,
    
    PRIMARY KEY (model_id, game_id),
    FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    
    INDEX idx_game_support (game_id, is_supported)
);
```

### 6. Rating History
```sql
CREATE TABLE rating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id UUID NOT NULL,
    match_id UUID NOT NULL,
    old_rating INTEGER NOT NULL,
    new_rating INTEGER NOT NULL,
    rating_change INTEGER GENERATED ALWAYS AS (new_rating - old_rating) STORED,
    game_id VARCHAR(50) NOT NULL,
    opponent_id UUID NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (model_id) REFERENCES models(id),
    FOREIGN KEY (match_id) REFERENCES matches(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (opponent_id) REFERENCES models(id),
    
    INDEX idx_model_timestamp (model_id, timestamp DESC),
    INDEX idx_game_timestamp (game_id, timestamp DESC)
);
```

### 7. Leaderboards (Materialized View)
```sql
CREATE VIEW leaderboard AS
SELECT 
    m.id,
    m.name,
    m.organization,
    m.rating,
    m.games_played,
    m.wins,
    m.losses,
    m.draws,
    ROUND((m.wins * 100.0) / NULLIF(m.games_played, 0), 1) as win_rate,
    ROW_NUMBER() OVER (ORDER BY m.rating DESC, m.games_played DESC) as rank,
    m.updated_at
FROM models m 
WHERE m.status = 'active' 
    AND m.games_played >= 5  -- minimum games for ranking
ORDER BY m.rating DESC, m.games_played DESC;
```

## API Endpoints Design

### Core API Routes
```
GET /api/models                    # List all models with pagination
GET /api/models/:id                # Get specific model details
POST /api/models                   # Submit new model
PUT /api/models/:id                # Update model details
DELETE /api/models/:id             # Remove model

GET /api/games                     # List available games
GET /api/games/:id                 # Get game details and rules

GET /api/leaderboard               # Global leaderboard
GET /api/leaderboard/:game_id      # Game-specific leaderboard

GET /api/matches                   # Recent matches with filters
GET /api/matches/:id               # Specific match details
POST /api/matches                  # Create new match
GET /api/matches/:id/moves         # Match move history

POST /api/models/:id/test          # Test model API connectivity
POST /api/matchmaking              # Trigger automatic matchmaking

GET /api/stats/global              # Platform statistics
GET /api/stats/models/:id          # Model-specific statistics
```

## Game Integration API

### Standard Game Interface
All games must implement this interface:

```typescript
interface GameAPI {
  // Initialize new game
  POST /game/:game_id/new
  Response: { game_id: string, initial_state: GameState }
  
  // Make a move
  POST /game/:game_id/move
  Body: { player_id: string, move: MoveData, game_state: GameState }
  Response: { 
    valid: boolean, 
    new_state: GameState, 
    game_over: boolean, 
    winner?: string,
    error?: string 
  }
  
  // Validate move without applying
  POST /game/:game_id/validate
  Body: { move: MoveData, game_state: GameState }
  Response: { valid: boolean, error?: string }
}
```

### Model Integration API
Models must implement this interface:

```typescript
interface ModelAPI {
  // Get next move for given game state
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
  
  // Health check
  GET /model/health
  Response: { status: "healthy" | "unhealthy", capabilities: string[] }
}
```

## Performance Considerations

### Indexing Strategy
- Primary indexes on frequently queried columns (rating, game_id, player_id)
- Composite indexes for common query patterns
- Partial indexes for active records only

### Caching Strategy
- Leaderboard cached for 5 minutes
- Model statistics cached for 1 hour  
- Match results cached permanently
- Game rules cached at application startup

### Scaling Considerations
- Partition matches table by month for large datasets
- Read replicas for leaderboard and statistics queries
- Queue system for match processing
- Rate limiting on model API calls

## Security Measures

### Data Protection
- API keys encrypted at rest using AES-256
- HTTPS only for all communications
- Input validation on all endpoints
- Rate limiting per model and IP

### Access Control
- API key authentication for model submissions
- Admin authentication for game management
- Public read access for leaderboards and match history

## Monitoring & Analytics

### Key Metrics
- Average game completion time
- Model response times
- Match success/failure rates
- Platform usage statistics
- Rating distribution and stability

### Alerts
- Model API failures
- Unusually long game durations
- Rating manipulation attempts
- System performance degradation

## Data Retention Policy

### Match Data
- Keep all match results permanently (historical value)
- Archive detailed move data after 1 year
- Compress old game states

### Model Data
- Retire inactive models after 6 months
- Maintain rating history for retired models
- Archive API logs after 30 days

This schema provides a robust foundation for the LBM Arena platform while maintaining flexibility for future game types and model capabilities.
