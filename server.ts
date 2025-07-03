import express, { Request, Response, NextFunction } from 'express';
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'MISSING');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/login-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
} as mongoose.ConnectOptions)
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// User Schema & Model
interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    resetToken?: string;
    resetTokenExpiry?: Date;
}

const userSchema = new Schema<IUser>({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@gmail\.com$/, 'Email must end with @gmail.com']
    },
    password: {
        type: String,
        required: true
    },
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model<IUser>('User', userSchema);

// Register handler
const registerHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            res.status(400).json({ message: 'Email must end with @gmail.com' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters long' });
            return;
        }
        // Check for uppercase, lowercase, numbers, and symbols
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
            res.status(400).json({ 
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol' 
            });
            return;
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'Email already registered' });
            return;
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login handler
const loginHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ message: 'Email and password are required' });
            return;
        }
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            res.status(400).json({ message: 'Email must end with @gmail.com' });
            return;
        }
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Incorrect password' });
            return;
        }
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Forgot password handler
const forgotPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            res.status(400).json({ message: 'Email must end with @gmail.com' });
            return;
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            res.status(404).json({ message: 'User not found with this email' });
            return;
        }

        // Generate reset token
        const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save reset token to user
        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        // Send email with reset link
        const resetUrl = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset for your account.</p>
                   <p>Click the link below to reset your password:</p>
                   <a href="${resetUrl}">${resetUrl}</a>
                   <p>If you did not request this, you can ignore this email.</p>`
        };
        await transporter.sendMail(mailOptions);

        res.json({ 
            message: 'Password reset link sent to your email.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Reset password handler
const resetPasswordHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            res.status(400).json({ message: 'Token and new password are required' });
            return;
        }

        // Find user with valid reset token
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }

        // Validate new password
        if (newPassword.length < 8) {
            res.status(400).json({ message: 'Password must be at least 8 characters long' });
            return;
        }

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSymbols) {
            res.status(400).json({ 
                message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol' 
            });
            return;
        }

        // Hash new password and update user
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

passport.use(new GoogleStrategy({
  clientID: '288412442942-s12q2jpoojml7pg39fa8mlasvnhpcoqh.apps.googleusercontent.com',
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user as any);
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/index.html' }),
  (req, res) => {
    res.redirect('/welcome.html');
  }
);

// Routes
app.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/index.html');
});

app.post('/api/register', registerHandler);
app.post('/api/login', loginHandler);
app.post('/api/forgot-password', forgotPasswordHandler);
app.post('/api/reset-password', resetPasswordHandler);

app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}`);
}); 
