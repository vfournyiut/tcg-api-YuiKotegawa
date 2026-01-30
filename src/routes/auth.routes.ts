import {Router, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {prisma} from "../database";
import {env} from "../env";
import {SignUpRequest, SignInRequest} from "../types/auth.types";

export const authRouter = Router();

authRouter.post("/sign-up", async (req: SignUpRequest, res: Response) => {
    try {
        const {email, username, password} = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({error: "Missing required fields"});
        }

        const existingUser = await prisma.user.findUnique({where: {email}});
        if (existingUser) {
            return res.status(409).json({error: "Email already in use"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {email, username, password: hashedPassword},
        });

        const token = jwt.sign({userId: user.id, email: user.email}, env.JWT_SECRET, {
            expiresIn: "7d",
        });

        return res.status(201).json({
            token,
            user: {id: user.id, email: user.email, username: user.username},
        });
    } catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
});

authRouter.post("/sign-in", async (req: SignInRequest, res: Response) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({error: "Missing required fields"});
        }

        const user = await prisma.user.findUnique({where: {email}});
        if (!user) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({error: "Invalid credentials"});
        }

        const token = jwt.sign({userId: user.id, email: user.email}, env.JWT_SECRET, {
            expiresIn: "7d",
        });

        return res.status(200).json({
            token,
            user: {id: user.id, email: user.email, username: user.username},
        });
    } catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
});


