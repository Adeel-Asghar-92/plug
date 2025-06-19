const socketio = require('socket.io');
const Session = require('../models/session'); // Update path based on your folder structure
const session = require('../models/session');

const setupSocket = (server) => {
    const io = socketio(server, {
        cors: {
          origin: ['http://localhost:3000', process.env.FRONTEND_URL], // Allowed origins
          methods: ['GET', 'POST'], // Allowed methods
          credentials: true, // Allow cookies or credentials
        },
      });

  io.on('connection', (socket) => {

    socket.on('attachSession', async (sessionId) => {
      if (!sessionId) {
        console.error('No session ID provided.');
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session || session.status === 'ended') {
        console.error('Session not found or ended.');
        return;
      }

      socket.join(sessionId);
    });

    socket.on('sendMessage', async ({ sessionId, sender, message, timestamp }) => {
      if (!sessionId) {
        console.error('No session ID provided.');
        return;
      }

      const session = await Session.findById(sessionId);
      if (session) {
        session.messages.push({ sender, message });
        await session.save();
      }
      const addedMessage = session.messages[session.messages.length - 1];
      
      io.to(sessionId).emit('receiveMessage', {
        _id: addedMessage._id,
        sender: addedMessage.sender,
        message: addedMessage.message,
        timestamp: addedMessage.timestamp,
        isReadByAdmin: addedMessage.isReadByAdmin,
        isReadByUser: addedMessage.isReadByUser,
        sessionId
      });
    });

    socket.on('reportUser', async ({ sessionId, reportedUserId, reportedBy, reason }) => {
      if (!sessionId || !reportedUserId || !reportedBy || !reason) {
        console.error('Missing required fields for report.');
        return;
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        console.error('Session not found.');
        return;
      }

      // Create a report message
      const reportMessage = {
        sender: 'system', // Use 'system' to indicate automated message
        message: `User ${reportedBy} reported user ${reportedUserId} for: ${reason}`,
        isReadByAdmin: false,
        isReadByUser: true, // Assume user knows they sent the report
        timestamp: new Date(),
      };

      // Add the report message to the session
      session.messages.push(reportMessage);
      await session.save();

      const addedMessage = session.messages[session.messages.length - 1];

      // Broadcast the report message to the session (admin will see it)
      io.to(sessionId).emit('receiveMessage', {
        _id: addedMessage._id,
        sender: addedMessage.sender,
        message: addedMessage.message,
        timestamp: addedMessage.timestamp,
        isReadByAdmin: addedMessage.isReadByAdmin,
        isReadByUser: addedMessage.isReadByUser,
        sessionId,
      });
    });
    
    socket.on('adminReadsMessage', async (sessionId, messageId) => {
        const session = await Session.findById(sessionId);
        if (!session) return console.error('Session not found.');
      
        const message = session.messages.id(messageId);
        if (message && !message.isReadByAdmin) {
          message.isReadByAdmin = true;
          await session.save();
          // Emit the read message to the user
          io.to(sessionId).emit('adminReadMessage', messageId); // This lets the user know the admin has read the message
        }
      });
      
      socket.on('userReadsMessage', async (sessionId, messageId) => {
        const session = await Session.findById(sessionId);
        if (!session) return console.error('Session not found.');
      
        const message = session.messages.id(messageId);
        if (message && !message.isReadByUser) {
          message.isReadByUser = true;
          await session.save();
      
          // Emit the read message to the admin
          io.to(sessionId).emit('userReadMessage', { sessionId, messageId }); // This lets the admin know the user has read the message
        }
      });

      socket.on('newSessionCreated', async(sessionId) => {

        try {
            setTimeout(async() => {
                const session = await Session.findById(sessionId).populate('user').populate('product');
            io.emit('new-session-started', session);
            }, 3000);
        } catch (error) {
        }
      });
      

    socket.on('disconnect', () => {
    });
  });

  return io;
};

module.exports = setupSocket;
