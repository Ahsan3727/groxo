// Socket service – helper to emit events
let io;
const setSocketInstance = (socketInstance) => { io = socketInstance; };

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user_${userId}`).emit(event, data);
};

const emitToRole = (role, event, data) => {
  if (io) io.to(`role_${role}`).emit(event, data);
};

const emitToOrder = (orderId, event, data) => {
  if (io) io.to(`order_${orderId}`).emit(event, data);
};

module.exports = { setSocketInstance, emitToUser, emitToRole, emitToOrder };
