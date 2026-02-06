import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TCG API Documentation',
            version: '1.0.0',
            description: 'API pour la gestion de cartes et decks de Trading Card Game',
            contact: {
                name: 'API Support',
                email: 'support@tcg-api.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Serveur de développement'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Entrez votre token JWT obtenu lors de l\'authentification'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID unique de l\'utilisateur',
                            example: 1
                        },
                        username: {
                            type: 'string',
                            description: 'Nom d\'utilisateur',
                            example: 'blue'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Adresse email de l\'utilisateur',
                            example: 'blue@example.com'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date de création du compte'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Date de dernière modification'
                        }
                    }
                },
                Card: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID unique de la carte',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            description: 'Nom du Pokémon',
                            example: 'Bulbasaur'
                        },
                        hp: {
                            type: 'integer',
                            description: 'Points de vie',
                            example: 45
                        },
                        attack: {
                            type: 'integer',
                            description: 'Points d\'attaque',
                            example: 49
                        },
                        type: {
                            type: 'string',
                            enum: ['Grass', 'Fire', 'Water', 'Electric', 'Psychic', 'Fighting', 'Colorless', 'Darkness', 'Metal', 'Fairy', 'Dragon'],
                            description: 'Type du Pokémon',
                            example: 'Grass'
                        },
                        pokedexNumber: {
                            type: 'integer',
                            description: 'Numéro dans le Pokédex',
                            example: 1
                        },
                        imgUrl: {
                            type: 'string',
                            nullable: true,
                            description: 'URL de l\'image de la carte',
                            example: null
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                Deck: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID unique du deck',
                            example: 1
                        },
                        name: {
                            type: 'string',
                            description: 'Nom du deck',
                            example: 'Fire Deck'
                        },
                        userId: {
                            type: 'integer',
                            description: 'ID du propriétaire du deck',
                            example: 1
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        cards: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Card'
                            },
                            description: 'Liste des cartes du deck (10 cartes exactement)'
                        }
                    }
                },
                SignUpRequest: {
                    type: 'object',
                    required: ['username', 'email', 'password'],
                    properties: {
                        username: {
                            type: 'string',
                            description: 'Nom d\'utilisateur',
                            example: 'blue'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Adresse email',
                            example: 'blue@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            description: 'Mot de passe',
                            example: 'password123'
                        }
                    }
                },
                SignInRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            description: 'Adresse email',
                            example: 'blue@example.com'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            description: 'Mot de passe',
                            example: 'password123'
                        }
                    }
                },
                AuthResponse: {
                    type: 'object',
                    properties: {
                        token: {
                            type: 'string',
                            description: 'Token JWT pour l\'authentification',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        },
                        user: {
                            $ref: '#/components/schemas/User'
                        }
                    }
                },
                CreateDeckRequest: {
                    type: 'object',
                    required: ['name', 'cards'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Nom du deck',
                            example: 'Fire Deck'
                        },
                        cards: {
                            type: 'array',
                            items: {
                                type: 'integer'
                            },
                            minItems: 10,
                            maxItems: 10,
                            description: 'Tableau contenant exactement 10 IDs de cartes',
                            example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                        }
                    }
                },
                UpdateDeckRequest: {
                    type: 'object',
                    required: ['name', 'cards'],
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Nouveau nom du deck',
                            example: 'Updated Fire Deck'
                        },
                        cards: {
                            type: 'array',
                            items: {
                                type: 'integer'
                            },
                            minItems: 10,
                            maxItems: 10,
                            description: 'Nouveau tableau contenant exactement 10 IDs de cartes',
                            example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Message d\'erreur',
                            example: 'Invalid credentials'
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Authentication',
                description: 'Endpoints pour l\'authentification des utilisateurs'
            },
            {
                name: 'Cards',
                description: 'Endpoints pour la gestion des cartes'
            },
            {
                name: 'Decks',
                description: 'Endpoints pour la gestion des decks'
            }
        ]
    },
    apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
