import yaml from 'js-yaml'
import { readFileSync } from 'fs'
import { join } from 'path'
const loadYaml = (filename: string) => {
    const filePath = join(__dirname, filename)
    const fileContent = readFileSync(filePath, 'utf8')
    return yaml.load(fileContent) as any
}

// Charger la configuration principale
const swaggerConfig = loadYaml('swagger.config.yml')

// Charger les documentations des modules
const authDoc = loadYaml('auth.doc.yml')
const cardDoc = loadYaml('card.doc.yml')
const deckDoc = loadYaml('deck.doc.yml')

// Fusionner tous les paths
export const swaggerDocument = {
    ...swaggerConfig,
    paths: {
        ...authDoc.paths,
        ...cardDoc.paths,
        ...deckDoc.paths,
    },
}
