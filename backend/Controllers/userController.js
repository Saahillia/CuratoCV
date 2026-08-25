import User from "../Models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Resume from "../Models/Resume.js";

const generateToken = (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {expiresIn: "1h"});
    return token;
}
// Controller for user registration and authentication
// POST : /api/users/register
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if required fields are present.
        if(!name || !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Check if user already exists
        const user = await User.findOne({ email });
        if(user){
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ 
            name, email, password: hashedPassword 
        });
        await newUser.save();

        // return success message
        const token = generateToken(newUser._id);
        newUser.password = undefined; // Remove password from the response
        res.status(201).json({ message: "User created successfully", token, user: newUser})

    } catch (error) {
        return res.status(400).json({ message: "Server error", error: error.message });
    }
}

// Controller for user login
// POST : /api/users/login

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if required fields are present.
        if( !email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Check if user already exists
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Check if password is correct
        if(!user.comparePassword(password)){
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // return success message
        const token = generateToken(user._id);
        user.password = undefined; // Remove password from the response
        res.status(200).json({ message: "User logged in successfully", token, user });

    } catch (error) {
        return res.status(400).json({ message: "Server error", error: error.message });
    }
}

// Controller for getting user by ID
// GET : /api/users/data

export const getUserById = async (req, res) => {
    try {
        
        const userId = req.userId; // Assuming you have a middleware that sets req.userId after verifying the token

        // Check if user already exists
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: "User not found" });
        }
        // return User 
        user.password = undefined; // Remove password from the response
        return res.status(200).json({user});

    } catch (error) {
        return res.status(400).json({ message: "Server error", error: error.message });
    }
}


// Controller for getting user resumes
// GET:/api/users/resumes
export const getUserResumes = async (req, res) => {
    try {
        const userId = req.userId; // Assuming you have a middleware that sets req.userId after verifying the token

        // Return user resumes
        const resumes = await Resume.find({ userId });
        return res.status(200).json({resumes});
    } catch (error) {
        return res.status(400).json({ message: "Server error", error: error.message });
    }
}