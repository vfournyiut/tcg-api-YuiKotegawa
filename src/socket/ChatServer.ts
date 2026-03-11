import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from '../env'

// Types simplifiés pour les événements
interface ClientToServerEvents {
    user: () => void
    message: (message: string) => void
}

interface ServerToClientEvents {
    welcome: (message: string) => void
    'user-joined': (message: string) => void
    message: (data: { username: string, message: string }) => void
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

    constructor(httpServer: HTTPServer) {
        this.io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
            cors: { origin: '*' },
        })
        this.setupAuthMiddleware() // Nouveau : ajout de l'authentification
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

            socket.on('user', () => this.handleUser(socket, userData))
            socket.on('message', (message) => this.handleMessage(socket, userData, message))
        })
    }

    private handleUser(socket: TypedSocket, userData: UserData) {
        console.log('Utilisateur connecté:', userData.email)
        socket.broadcast.emit('user-joined', `${userData.email} s'est connecté`)
    }

    private handleMessage(_socket: TypedSocket, userData: UserData, message: string) {
        console.log(`${userData.email}: ${message}`)
        this.io.emit('message', { username: userData.email, message })
    }
}
