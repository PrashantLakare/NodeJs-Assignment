const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const LoginStatus = require('../models/LoginStatus');
const { v4: uuidv4 } = require('uuid');

const createRole = async (req, res) => {
    try {
        const { roleId, roleName } = req.body;
        const role = new Role({ roleId, roleName });
        await role.save();
        res.status(201).json(role);
    } catch (err) {
        res.status(500).json({ error: 'Error creating role' });
    }
}

const createUser = async (req, res) => {
    try {
        const { userName, email, password, roleId, user_id } = req.body;

        const userId = user_id || uuidv4();
        const ifUserExists = await User.findOne({ userId: userId });
        if (ifUserExists) return res.status(400).json({ error: 'User already exists with this userId' });

        const ifUserEmailExists = await User.findOne({ email: email });
        if (ifUserEmailExists) return res.status(400).json({ error: 'User already exists with this email' });

        const role = await Role.findOne({ roleId: roleId || 'R3' }); // By default R3 = AccessUser
        if (!role) return res.status(400).json({ error: 'Invalid role' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ userId, userName, email, password: hashedPassword, roleId: role.roleId });
        await user.save();

        res.status(201).json(user);
      } catch (err) {
        res.status(500).json({ error: 'Error creating user', err: err.message });
      }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        // Generate JWT token
        const token = jwt.sign({ id: user.userId, role: user.roleId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // track login status  
        const loginStatus = new LoginStatus({
          loginStatusId: uuidv4(),
          userName: user.userName,
          userId: user._id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
        await loginStatus.save();

        res.json({ token });

    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
}

module.exports = {
  createRole,
  createUser,
  loginUser
};