const io = require('socket.io-client');

// Connect to local server
const socket = io('http://localhost:3001', {
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('✅ Connected to server. Triggering simulation...');

    // Inject 50 travelers
    socket.emit('inject-records', 50);
});

socket.on('dataset-updated', (data) => {
    console.log(`🎉 Success! Dataset now has ${data.dataset.length} records.`);
    console.log('You can now check the Dashboard.');
    process.exit(0);
});

// Timeout if no response
setTimeout(() => {
    console.log('⚠️ Timeout waiting for confirmation, but assuming command sent.');
    process.exit(0);
}, 3000);
