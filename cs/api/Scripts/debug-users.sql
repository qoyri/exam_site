-- Vérifier la structure de la table Users
DESCRIBE users;

-- Afficher tous les utilisateurs
SELECT * FROM users;

-- Rechercher spécifiquement l'utilisateur teacher@teacher.fr
SELECT * FROM users WHERE email = 'teacher@teacher.fr';

-- Rechercher l'utilisateur dans d'autres colonnes potentielles
SELECT * FROM users WHERE 
    id = 'teacher@teacher.fr' OR
    CONVERT(id, CHAR) = 'teacher@teacher.fr';

-- Afficher les colonnes de la table users pour comprendre sa structure
SHOW COLUMNS FROM users;

-- Vérifier si l'utilisateur existe avec une recherche plus large
SELECT * FROM users WHERE 
    email LIKE '%teacher%' OR 
    CONVERT(id, CHAR) LIKE '%teacher%';
