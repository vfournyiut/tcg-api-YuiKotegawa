import {Router, Response} from "express";
import {prisma} from "../database";
import {AllCardRequest} from "../types/card.types";

export const cardRouter = Router();

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
