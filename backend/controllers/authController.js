module.exports = {
  login: (req, res) => res.json({ token: 'dummy-jwt-token' }),
  signup: (req, res) => res.json({ message: 'Signup placeholder' })
};
