import {Router, Response} from "express";
import {prisma} from "../database";
import {AllCardRequest} from "../types/card.types";

export const cardRouter = Router();

/**
 * @swagger
 * /api/cards:
 *   get:
 *     summary: Récupérer toutes les cartes
 *     description: Retourne la liste complète de toutes les cartes disponibles, triées par numéro Pokédex croissant
 *     tags: [Cards]
 *     responses:
 *       200:
 *         description: Liste des cartes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *             example:
 *               - id: 1
 *                 name: "Bulbasaur"
 *                 hp: 45
 *                 attack: 49
 *                 type: "Grass"
 *                 pokedexNumber: 1
 *                 imgUrl: null
 *               - id: 4
 *                 name: "Charmander"
 *                 hp: 39
 *                 attack: 52
 *                 type: "Fire"
 *                 pokedexNumber: 4
 *                 imgUrl: null
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
 * Get all cards
 * Returns a list of all cards ordered by their pokedex number ascending.
 * No authentication required.
 * @param {AllCardRequest} _req - Express request object
 * @param {Response} res - Express response object
 * @returns {Array} Array of all cards
 * @throws {500} Internal server error
 */
cardRouter.get("/", async (_req: AllCardRequest, res: Response) => {
    try {
        const cards = await prisma.card.findMany({
            orderBy: {
                pokedexNumber: 'asc'
            }
        });
        
        res.status(200).json(cards);
    } catch (error) {
        res.status(500).json({error: "Internal server error"});
    }
});
