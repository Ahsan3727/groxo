module.exports = {
  getUsers: (req, res) => res.json({ message: 'User list' }),
  getUser: (req, res) => res.json({ message: 'User detail' }),
  updateUser: (req, res) => res.json({ message: 'User updated' }),
  deleteUser: (req, res) => res.json({ message: 'User deleted' })
};
