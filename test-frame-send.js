import WebSocket from 'ws';

// Create a small test image (1x1 pixel white JPEG)
const smallImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';

async function testFrameSending() {
  const ws = new WebSocket('wss://hand-teleop-api.onrender.com/api/tracking/live');
  
  ws.on('open', () => {
    console.log('✅ Connected to WebSocket');
    
    // Send a frame message like our frontend
    const message = {
      type: 'track', // Backend expects 'track'
      data: { 
        image: smallImageData // Backend expects image nested in data
      }
    };
    
    console.log('📤 Sending frame message...');
    ws.send(JSON.stringify(message));
    
    // Wait for response
    setTimeout(() => {
      console.log('⏰ No response after 5 seconds, sending ping...');
      ws.ping();
    }, 5000);
    
    // Auto-close after 10 seconds
    setTimeout(() => {
      console.log('🔚 Closing connection');
      ws.close();
    }, 10000);
  });
  
  ws.on('message', (data) => {
    console.log('📨 Received message:', data.toString());
  });
  
  ws.on('pong', () => {
    console.log('🏓 Received pong');
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed: ${code} - ${reason.toString()}`);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
}

testFrameSending();
