const express = require('express');
const bcrypt = require('bcrypt');
const admin = require('firebase-admin'); // Firebase Admin SDK
const User = require('../models/user');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Register new user (both email and Google login)
router.post('/register', upload.none(), async (req, res) => {
  try {
    const { email, firebaseUid, fullName, authProvider, password, companyName, website, phoneNumber, referCode } = req.body;
    console.log("authProvider",authProvider)
    // Handle Google login
    if (authProvider === 'google' || authProvider === "twitter") {
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        // Update existing user
        user.lastLogin = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.cookie('user', token, {
          httpOnly: true,   
          secure: true,
          maxAge: 24 * 60 * 60 * 1000 ,
          sameSite: 'strict',  
        });
        return res.json({ token, user });
      }

      // Create new user for Google auth
      user = new User({
        email,
        firebaseUid,
        fullName,
        authProvider: authProvider,
      });
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.cookie('user', token, {
        httpOnly: true,   
        secure: true,
        maxAge: 24 * 60 * 60 * 1000 ,
        sameSite: 'strict',  
      });
      console.log(referCode);
      if(referCode){
        console.log(referCode);
        const referUser = await User.findOne({email:referCode});
        if(referUser){
          referUser.balance+=100;
          await referUser.save();
        }
      }
      return res.status(201).json({ token, user });
    }

    // Rest of your existing email registration code...
    if (authProvider === 'email' && password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      const newUser = new User({
        email,
        fullName,
        authProvider: 'email',
        password: hashedPassword,
        companyName,
        phoneNumber,
        website
      });

      await newUser.save();
      
      const token = jwt.sign(
        { id: newUser._id, email: newUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.cookie('user', token, {
        httpOnly: true,   
        secure: true,
        maxAge: 24 * 60 * 60 * 1000 ,
        sameSite: 'strict',  
      });
      if(referCode){
        const referUser = await User.findOne({email:referCode});
        if(referUser){
          referUser.balance+=100;
          await referUser.save();
        }
      }
      return res.status(201).json({ token, user: newUser });
    }

    return res.status(400).json({ error: 'Invalid authentication provider' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', upload.none(), async (req, res) => {
  const { email, password, rememberMe } = req.body;

  console.log(email, password, rememberMe);
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '24h' }
    );
    console.log("test")

    user.lastLogin = new Date();
    // await user.save();

    res.cookie('user', token, {
      httpOnly: true,       
      secure: true, 
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, 
      sameSite: 'strict',     
    });
    res.status(200).json({
      token,
      user: {
        email: user.email,
        fullName: user.fullName,
        subscription: user.subscription,
        visitCount: user.visitCount,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'something went wrong', error: err.message });
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('user');
  res.status(200).json({ message: 'Logout successful' });
});

router.get('/verify-token', async (req, res) => {
  // const token = req.headers.authorization?.split(' ')[1];
  // if (!token) return res.status(401).json({ message: 'No token provided' });

  const token = req.cookies.user;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user.isBlocked) return res.status(403).json({ message: 'User is blocked' });
    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.put('/user/profile', async (req, res) => {
  try {
    const { email, fullName, companyName, phoneNumber, website } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { fullName, companyName, phoneNumber, website },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});


// Reset password routes

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email' });
    }

    // Check if 10 minutes have passed since last request
    if (user.lastPasswordResetRequest) {
      const timeDiff = Date.now() - user.lastPasswordResetRequest.getTime();
      const minutesPassed = Math.floor(timeDiff / 60000);
      
      if (minutesPassed < 10) {
        return res.status(429).json({ 
          message: `Please wait ${10 - minutesPassed} minutes before requesting another reset`,
          nextAvailableReset: new Date(user.lastPasswordResetRequest.getTime() + 600000)
        });
      }
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    user.lastPasswordResetRequest = new Date();
    await user.save();

    // Send email with reset link
    const transporter = nodemailer.createTransport({
      // Configure your email service here
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    await transporter.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a>`
    });


    res.json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending reset email' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router;
