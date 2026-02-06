import {Router, Response} from "express";
import type {Request} from "express";
import {prisma} from "../database";
import {authenticateToken} from "../middlewares/auth.middleware";
import {CreateDeckRequest, UpdateDeckRequest} from "../types/deck.types";

export const deckRouter = Router();

/**
 * @swagger
 * /api/decks:
 *   post:
 *     summary: Créer un nouveau deck
 *     description: Crée un deck contenant exactement 10 cartes pour l'utilisateur authentifié
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDeckRequest'
 *     responses:
 *       201:
 *         description: Deck créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example: "deck created successfully :Fire Deck"
 *       400:
 *         description: Champs manquants ou nombre de cartes invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             examples:
 *               missingName:
 *                 value: "Missing deck name"
 *               invalidCards:
 *                 value: "A deck must contain exactly 10 cards"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Create a new deck
 * Creates a new deck for the authenticated user.
 * Requires authentication.
 * @param {CreateDeckRequest} req - Express request object
 * @param {string} req.body.name - Deck name
 * @param {number[]} req.body.cards - Array of exactly 10 card IDs
 * @param {Response} res - Express response object
 * @returns {string} Success message
 * @throws {400} Missing fields or invalid number of cards
 * @throws {500} Internal server error
 */
deckRouter.post("/", authenticateToken, async (req: CreateDeckRequest, res: Response) => {
    try {
        const name = req.body.name;
        const userId = req.user!.userId;
        const cards = req.body.cards;

        if (!name) {
            return res.status(400).json("Missing deck name");
        }

        if (!cards || !Array.isArray(cards) || cards.length !== 10) {
            return res.status(400).json("A deck must contain exactly 10 cards");
        }

        const deck = await prisma.deck.create({
            data: {
                name: name,
                userId: userId,
                cards : {
                    create: cards.map((cardId: number) => ({ cardId }))
                }
            }
        });

        return res.status(201).json("deck created successfully :" + deck.name);
    } catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
});

/**
 * @swagger
 * /api/decks/mine:
 *   get:
 *     summary: Récupérer mes decks
 *     description: Retourne tous les decks appartenant à l'utilisateur authentifié
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des decks récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *             example:
 *               - id: 1
 *                 name: "Fire Deck"
 *               - id: 2
 *                 name: "Water Deck"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Get user's decks
 * Returns all decks belonging to the authenticated user.
 * Requires authentication.
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Array} Array of user's decks (id and name only)
 * @throws {500} Internal server error
 */
deckRouter.get("/mine", authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        const decks = await prisma.deck.findMany({
            where: {userId: userId}
        })
        return res.status(200).json(decks.map(deck => ({
            id: deck.id,
            name: deck.name
        })));
    } catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
});

/**
 * @swagger
 * /api/decks/{id}:
 *   get:
 *     summary: Récupérer un deck par son ID
 *     description: Retourne les détails d'un deck spécifique appartenant à l'utilisateur authentifié
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du deck à récupérer
 *     responses:
 *       200:
 *         description: Deck récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Deck'
 *       400:
 *         description: ID de deck invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example: "Invalid deck ID"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Deck non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Deck not found"
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Get deck by ID
 * Returns a specific deck belonging to the authenticated user.
 * Requires authentication.
 * @param {Request} req - Express request object
 * @param {string} req.params.id - Deck ID
 * @param {Response} res - Express response object
 * @returns {Object} Deck details
 * @throws {400} Invalid deck ID
 * @throws {404} Deck not found
 * @throws {500} Internal server error
 */
deckRouter.get("/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const deckId = parseInt(req.params.id!);

        if (isNaN(deckId)) {
            return res.status(400).json("Invalid deck ID");
        }

        const deck = await prisma.deck.findFirst({
            where: {id: deckId, userId}
        })
        
        if (!deck) {
            return res.status(404).json({error: "Deck not found"});
        }
        
        return res.status(200).json(deck);
    } catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
}
);

/**
 * @swagger
 * /api/decks/{id}:
 *   patch:
 *     summary: Mettre à jour un deck
 *     description: Modifie le nom et/ou les cartes d'un deck appartenant à l'utilisateur authentifié
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du deck à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDeckRequest'
 *     responses:
 *       200:
 *         description: Deck mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example: "Deck updated successfully"
 *       400:
 *         description: ID invalide, champs manquants ou nombre de cartes invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             examples:
 *               invalidId:
 *                 value: "Invalid deck ID"
 *               missingName:
 *                 value: "Missing deck name"
 *               invalidCards:
 *                 value: "A deck must contain exactly 10 cards"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Deck non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Update deck
 * Updates a specific deck belonging to the authenticated user.
 * Requires authentication.
 * @param {UpdateDeckRequest} req - Express request object
 * @param {string} req.params.id - Deck ID
 * @param {string} req.body.name - New deck name
 * @param {number[]} req.body.cards - New array of exactly 10 card IDs
 * @param {Response} res - Express response object
 * @returns {string} Success message
 * @throws {400} Invalid deck ID, missing fields or invalid number of cards
 * @throws {404} Deck not found
 * @throws {500} Internal server error
 */
deckRouter.patch("/:id", authenticateToken, async (req: UpdateDeckRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const deckId = parseInt(req.params.id!);
        const {name, cards} = req.body;

        if (isNaN(deckId)) {
            return res.status(400).json("Invalid deck ID");
        }

        if (!name) {
            return res.status(400).json("Missing deck name");
        }

        if (!cards || !Array.isArray(cards) || cards.length !== 10) {
            return res.status(400).json("A deck must contain exactly 10 cards");
        }

        const deck = await prisma.deck.findFirst({
            where: {userId, id: deckId}
        });

        if (!deck) {
            return res.status(404).json({error: "Deck not found"});
        }

        const updatedDeck = await prisma.deck.update({
            where: {userId, id:deckId},
            data: {
                name: name,
                cards: {
                    deleteMany: {
                        deckId: deckId,
                    },
                        create: cards.map((cardId: number) => ({ cardId })),
                    }
                }
            });
        return res.status(200).json("Deck updated successfully" + updatedDeck);
    } catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
});

/**
 * @swagger
 * /api/decks/{id}:
 *   delete:
 *     summary: Supprimer un deck
 *     description: Supprime un deck appartenant à l'utilisateur authentifié
 *     tags: [Decks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du deck à supprimer
 *     responses:
 *       200:
 *         description: Deck supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example: "Deck deleted successfully"
 *       400:
 *         description: ID de deck invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *             example: "Invalid deck ID"
 *       401:
 *         description: Non authentifié
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Deck non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * Delete deck
 * Deletes a specific deck belonging to the authenticated user.
 * Requires authentication.
 * @param {Request} req - Express request object
 * @param {string} req.params.id - Deck ID
 * @param {Response} res - Express response object
 * @returns {string} Success message
 * @throws {400} Invalid deck ID
 * @throws {404} Deck not found
 * @throws {500} Internal server error
 */
deckRouter.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const deckId = parseInt(req.params.id!);

        if (isNaN(deckId)) {
            return res.status(400).json("Invalid deck ID");
        }

        const deck = await prisma.deck.findFirst({
            where: {userId, id: deckId}
        });

        if (!deck) {
            return res.status(404).json({error: "Deck not found"});
        }

        await prisma.deck.delete({
            where: {userId, id:deckId},
        });
        return res.status(200).json("Deck deleted successfully"); 
    }
    catch (error) {
        return res.status(500).json({error: "Internal server error"});
    }
});

