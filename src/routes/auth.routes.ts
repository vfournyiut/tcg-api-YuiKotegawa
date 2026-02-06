import {Router, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {prisma} from "../database";
import {env} from "../env";
import {SignUpRequest, SignInRequest} from "../types/auth.types";

export const authRouter = Router();

/**
 * @swagger
 * /api/auth/sign-up:
 *   post:
 *     summary: Créer un nouveau compte utilisateur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignUpRequest'
 *     responses:
 *       201:
 *         description: Compte créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: 1
 *                 email: "blue@example.com"
 *                 username: "blue"
 *       400:
 *         description: Champs requis manquants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing required fields"
 *       409:
 *         description: Email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Email already in use"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
 */
/**
 * User Sign-up
 * Creates a new user and returns a JWT token upon successful registration.
 * @param {SignUpRequest} req - Express request object
 * @param {string} req.body.email - User email
 * @param {string} req.body.username - User username
 * @param {string} req.body.password - User password
 * @param {Response} res - Express response object
 * @returns {Object} JWT token and user info
 * @throws {400} Missing required fields
 * @throws {409} Email already in use
 * @throws {500} Internal server error
 */
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

/**
 * @swagger
 * /api/auth/sign-in:
 *   post:
 *     summary: Se connecter avec un compte existant
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignInRequest'
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: 1
 *                 email: "blue@example.com"
 *                 username: "blue"
 *       400:
 *         description: Champs requis manquants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Missing required fields"
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid credentials"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Internal server error"
 */
/**
 * User Sign-in
 * Authenticates an existing user and returns a JWT token if login is successful.
 * @param {SignInRequest} req - Express request object
 * @param {string} req.body.email - User email
 * @param {string} req.body.password - User password
 * @param {Response} res - Express response object
 * @returns {Object} JWT token and user info
 * @throws {400} Missing required fields
 * @throws {401} Invalid credentials
 * @throws {500} Internal server error
 */
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
