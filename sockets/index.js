export function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    socket.on('join', (address) => {
      if (typeof address !== 'string' || !address.includes('@')) return;
      socket.join(roomFor(address));
    });

    socket.on('leave', (address) => {
      if (typeof address !== 'string') return;
      socket.leave(roomFor(address));
    });
  });
}

function roomFor(address) {
  return `inbox:${address.toLowerCase()}`;
}

export function emitNewMail(io, address, email) {
  io.to(roomFor(address)).emit('new_mail', email);
}
