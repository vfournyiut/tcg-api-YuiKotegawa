import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../env'
import { prisma } from '../database'

// Interface pour les game rooms
interface GameRoom {
    roomId: number
    hostSocketId: string
    hostUserId: number
    hostUsername: string
    hostDeckId: number
    status: 'waiting' | 'playing'
    createdAt: Date
}

// Types pour les événements du matchmaking
interface ClientToServerEvents {
    getRooms: () => void
    createRoom: (data: { deckId: number }) => void
    joinRoom: (data: { roomId: number, deckId: number }) => void
}

interface ServerToClientEvents {
    welcome: (message: string) => void
    error: (message: string) => void
    rooms: (roomList: Array<{roomId: number, hostUsername: string, createdAt: Date}>) => void
    roomCreated: (room: {roomId: number, hostUsername: string}) => void
    roomsListUpdated: (roomList: Array<{roomId: number, hostUsername: string, createdAt: Date}>) => void
    gameStarted: (gameState: any) => void
}


// Données stockées après authentification (correspond au JWT)
interface UserData {
    userId: number
    email: string
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>

export class ChatServer {
    private io: TypedServer
    private gameRooms: Map<number, GameRoom>
    private nextRoomId: number = 1

    constructor(httpServer: HTTPServer) {
        this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
            cors: { origin: '*' },
        })

        this.gameRooms = new Map()
        this.setupAuthMiddleware()
        this.initializeSocket()
    }

    // Nouveau : middleware d'authentification
    private setupAuthMiddleware() {
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token

            if (!token) {
                return next(new Error('Token manquant'))
            }

            try {
                const decoded = jwt.verify(token, env.JWT_SECRET) as UserData
                socket.data = decoded
                next()
            } catch (error) {
                next(new Error('Token invalide ou expiré'))
            }
        })
    }

    private initializeSocket() {
        this.io.on('connection', (socket) => {
            // Récupérer les données de l'utilisateur authentifié
            const userData = socket.data as UserData
            console.log('Nouvelle connexion:', socket.id, `(${userData.email})`)
            socket.emit('welcome', `Bienvenue ${userData.email}!`)

            // Listeners des événements de matchmaking
            socket.on('getRooms', () => this.handleGetRooms(socket))
            socket.on('createRoom', (data) => this.handleCreateRoom(socket, userData, data))
            socket.on('joinRoom', (data) => this.handleJoinGameRoom(socket, userData, data))
            socket.on('disconnect', () => this.handleDisconnect(socket, userData))
        })
    }

    private handleGetRooms(socket: TypedSocket) {
        // Retourne uniquement les rooms en attente
        const availableRooms = Array.from(this.gameRooms.values())
            .filter(room => room.status === 'waiting')
            .map(room => ({
                roomId: room.roomId,
                hostUsername: room.hostUsername,
                createdAt: room.createdAt
            }))
        
        socket.emit('rooms', availableRooms)
    }

    private async handleCreateRoom(socket: TypedSocket, userData: UserData, data: { deckId: number }): Promise<void> {
        try {
            // Problème rencontré lors de la récupération du deckId : il arrive parfois comme string, 
            // j'applique donc cette conversion ici et un peu plus bas pour éviter les erreurs
            const deckId = typeof data.deckId === 'string' ? parseInt(data.deckId) : data.deckId
            
            if (isNaN(deckId)) {
                socket.emit('error', "Deck ID invalide")
                return
            }
            // Vérification du deck de l'host
            const deck = await prisma.deck.findUnique({
                where: { id: deckId },
                include: {
                    cards: true,
                    user: {
                        select: { id: true, username: true }
                    }
                }
            })

            if (!deck) {
                socket.emit('error', "Deck inexistant")
                return
            }

            if (deck.userId !== userData.userId) {
                socket.emit('error', "Ce deck ne vous appartient pas")
                return
            }

            if (deck.cards.length !== 10) {
                socket.emit('error', "Le deck doit contenir exactement 10 cartes")
                return
            }

            // Création de la room
            const roomId = this.nextRoomId++
            const gameRoom: GameRoom = {
                roomId,
                hostSocketId: socket.id,
                hostUserId: userData.userId,
                hostUsername: deck.user.username,
                hostDeckId: deckId,
                status: 'waiting',
                createdAt: new Date()
            }

            this.gameRooms.set(roomId, gameRoom)
            socket.join(`game-${roomId}`)

            // Confirmer à l'host
            socket.emit('roomCreated', {
                roomId: gameRoom.roomId,
                hostUsername: gameRoom.hostUsername
            })

            // Broadcast la liste mise à jour pour inclure la nouvelle room
            this.broadcastRoomsList()

            console.log(`🎮 Room ${roomId} créée par ${deck.user.username} avec le deck ${data.deckId}`)
        } catch (error) {
            console.error('Erreur lors de la création de la room:', error)
            socket.emit('error', "Erreur lors de la création de la room")
        }
    }

    private async handleJoinGameRoom(socket: TypedSocket, userData: UserData, data: { roomId: number, deckId: number }): Promise<void> {
        try {
            const roomId = typeof data.roomId === 'string' ? parseInt(data.roomId) : data.roomId
            const deckId = typeof data.deckId === 'string' ? parseInt(data.deckId) : data.deckId
            
            if (isNaN(roomId) || isNaN(deckId)) {
                socket.emit('error', "Room ID ou Deck ID invalide")
                return
            }

            const gameRoom = this.gameRooms.get(roomId)

            if (!gameRoom) {
                socket.emit('error', "Room inexistante")
                return
            }

            if (gameRoom.status !== 'waiting') {
                socket.emit('error', "Cette room est déjà complète")
                return
            }

            // Vérification du deck du joueur qui rejoint
            const deck = await prisma.deck.findUnique({
                where: { id: deckId },
                include: {
                    cards: {
                        include: {
                            card: true // Infos complètes des cartes
                        }
                    },
                    user: {
                        select: { id: true, username: true }
                    }
                }
            })

            if (!deck) {
                socket.emit('error', "Deck inexistant")
                return
            }

            if (deck.userId !== userData.userId) {
                socket.emit('error', "Ce deck ne vous appartient pas")
                return
            }

            if (deck.cards.length !== 10) {
                socket.emit('error', "Le deck doit contenir exactement 10 cartes")
                return
            }

            // Récupérer le deck de l'host
            const hostDeck = await prisma.deck.findUnique({
                where: { id: gameRoom.hostDeckId },
                include: {
                    cards: {
                        include: {
                            card: true
                        }
                    }
                }
            })

            if (!hostDeck) {
                socket.emit('error', "Erreur: deck du host introuvable")
                return
            }

            // Rejoindre la room
            socket.join(`game-${roomId}`)
            gameRoom.status = 'playing'

            // Définir les états initiaux
            const hostDeckCards = hostDeck.cards.map(dc => dc.card)
            const guestDeckCards = deck.cards.map(dc => dc.card)

            // État pour l'host
            const hostGameState = {
                roomId: roomId,
                you: {
                    socketId: gameRoom.hostSocketId,
                    userId: gameRoom.hostUserId,
                    username: gameRoom.hostUsername,
                    deckCount: hostDeckCards.length,
                    hand: [],
                    activeCard: null,
                    score: 0
                },
                opponent: {
                    socketId: socket.id,
                    userId: userData.userId,
                    username: deck.user.username,
                    deckCount: guestDeckCards.length,
                    hand: [],
                    activeCard: null,
                    score: 0
                },
                currentPlayerSocketId: gameRoom.hostSocketId,
                isYourTurn: true
            }

            // État pour le guest
            const guestGameState = {
                roomId: roomId,
                you: {
                    socketId: socket.id,
                    userId: userData.userId,
                    username: deck.user.username,
                    deckCount: guestDeckCards.length,
                    hand: [],
                    activeCard: null,
                    score: 0
                },
                opponent: {
                    socketId: gameRoom.hostSocketId,
                    userId: gameRoom.hostUserId,
                    username: gameRoom.hostUsername,
                    deckCount: hostDeckCards.length,
                    hand: [],
                    activeCard: null,
                    score: 0
                },
                currentPlayerSocketId: gameRoom.hostSocketId,
                isYourTurn: false
            }

            // Émettre les états de jeu initiaux à chaque joueur
            this.io.to(gameRoom.hostSocketId).emit('gameStarted', hostGameState)
            this.io.to(socket.id).emit('gameStarted', guestGameState)

            // Broadcast la liste mise à jour pour retirer la room des rooms disponibles
            this.broadcastRoomsList()

            console.log(`Partie démarrée dans la room ${roomId}:`, gameRoom.hostUsername, 'vs', deck.user.username)
        } catch (error) {
            console.error('Erreur lors de la jonction à la room:', error)
            socket.emit('error', "Erreur lors de la jonction à la room")
        }
    }

    private handleDisconnect(socket: TypedSocket, userData: UserData) {
        // Gérer les game rooms en attente
        this.gameRooms.forEach((gameRoom, roomId) => {
            if (gameRoom.hostSocketId === socket.id) {
                // Le host s'est déconnecté, supprimer la room
                this.gameRooms.delete(roomId)
                this.broadcastRoomsList()
                console.log(`🎮 Room ${roomId} supprimée (host déconnecté)`)
            }
        })
        
        console.log('Déconnexion:', socket.id, `(${userData.email})`)
    }

    private broadcastRoomsList(): void {
        const availableRooms = Array.from(this.gameRooms.values())
            .filter(room => room.status === 'waiting')
            .map(room => ({
                roomId: room.roomId,
                hostUsername: room.hostUsername,
                createdAt: room.createdAt
            }))
        
        this.io.emit('roomsListUpdated', availableRooms)
    }
}
