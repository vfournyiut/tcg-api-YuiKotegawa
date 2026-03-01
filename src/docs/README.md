# Documentation Swagger API

## 📖 Description

Cette API utilise OpenAPI 3.1.0 avec Swagger UI pour fournir une documentation interactive et testable.

## 🚀 Accès à la documentation

Une fois le serveur démarré (`npm run dev`), accédez à :

**http://localhost:3001/api-docs**

## 📁 Organisation

La documentation est organisée de manière modulaire :

```
src/docs/
├── index.ts              # Agrégation des modules
├── swagger.config.yml    # Configuration principale (schémas, sécurité, tags)
├── auth.doc.yml          # Documentation des routes d'authentification
├── card.doc.yml          # Documentation des routes de cartes
└── deck.doc.yml          # Documentation des routes de decks
```

## 🔐 Authentification

### Obtenir un token JWT

1. **S'inscrire** via `/api/auth/sign-up`
2. **Se connecter** via `/api/auth/sign-in`
3. Récupérer le `token` dans la réponse

### Utiliser le token dans Swagger UI

1. Cliquez sur le bouton **"Authorize" 🔓** en haut à droite
2. Entrez votre token dans le champ "Value" (sans le préfixe "Bearer")
3. Cliquez sur **"Authorize"** puis **"Close"**
4. Toutes les requêtes suivantes incluront automatiquement votre token

## 📊 Schémas réutilisables

Les schémas suivants sont définis dans `swagger.config.yml` :

- **User** : Structure d'un utilisateur (id, email, username)
- **Card** : Structure d'une carte Pokémon (id, name, hp, attack, type, etc.)
- **Deck** : Structure d'un deck (id, name, userId)
- **DeckWithCards** : Deck avec la liste complète des cartes
- **DeckSummary** : Résumé d'un deck (id, name uniquement)
- **AuthResponse** : Réponse d'authentification (token, user)
- **Error** : Structure d'erreur standard

## 🎯 Endpoints par module

### Authentication (`/api/auth`)

- `POST /api/auth/sign-up` - Créer un compte
- `POST /api/auth/sign-in` - Se connecter

**Authentification requise :** ❌

### Cards (`/api/cards`)

- `GET /api/cards` - Liste toutes les cartes Pokémon

**Authentification requise :** ✅

### Decks (`/api/decks`)

- `POST /api/decks` - Créer un nouveau deck
- `GET /api/decks/mine` - Récupérer mes decks
- `GET /api/decks/:id` - Récupérer un deck par ID
- `PATCH /api/decks/:id` - Modifier un deck
- `DELETE /api/decks/:id` - Supprimer un deck

**Authentification requise :** ✅ (toutes les routes)

## 🧪 Tester les endpoints

1. **Endpoints publics** (auth) :
   - Cliquez sur l'endpoint
   - Cliquez sur "Try it out"
   - Remplissez le corps de la requête
   - Cliquez sur "Execute"

2. **Endpoints protégés** (cards, decks) :
   - Authentifiez-vous d'abord (bouton "Authorize")
   - Suivez les mêmes étapes que pour les endpoints publics

## 🛠️ Modifier la documentation

### Ajouter un nouvel endpoint

1. Ouvrez le fichier YAML correspondant au module (`auth.doc.yml`, `card.doc.yml`, ou `deck.doc.yml`)
2. Ajoutez votre endpoint sous `paths:`
3. Documentez les paramètres, le corps de requête et les réponses

Exemple :

```yaml
paths:
  /api/votre-endpoint:
    get:
      tags:
        - VotreModule
      summary: Description courte
      description: Description détaillée
      operationId: votreOperation
      security:
        - bearerAuth: []  # Si authentification requise
      responses:
        '200':
          description: Succès
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VotreSchema'
```

### Ajouter un nouveau schéma

1. Ouvrez `swagger.config.yml`
2. Ajoutez votre schéma sous `components.schemas:`

```yaml
components:
  schemas:
    VotreSchema:
      type: object
      required:
        - champObligatoire
      properties:
        champObligatoire:
          type: string
          example: "exemple"
```

3. Réutilisez-le avec `$ref: '#/components/schemas/VotreSchema'`

## ✅ Bonnes pratiques

- ✅ **Schémas réutilisables** : Définir une fois, utiliser partout avec `$ref`
- ✅ **Organisation modulaire** : Un fichier par module métier
- ✅ **Exemples concrets** : Fournir des exemples pour chaque schéma et réponse
- ✅ **Descriptions détaillées** : Expliquer les règles de validation et le comportement
- ✅ **Sécurité explicite** : Marquer clairement les routes protégées avec `security: [bearerAuth]`
- ✅ **Codes HTTP corrects** : Documenter tous les codes de réponse possibles (200, 400, 401, 404, 500, etc.)

## 🔄 Build et déploiement

Les fichiers YAML sont automatiquement copiés dans `dist/docs/` lors du build :

```bash
npm run build
```

Cela permet d'exécuter l'application compilée avec :

```bash
npm start
```

## 📚 Ressources

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.0)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [JSON Schema](https://json-schema.org/)
