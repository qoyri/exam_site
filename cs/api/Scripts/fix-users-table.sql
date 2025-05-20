-- Vérifier la structure de la table Users
DESCRIBE users;

-- Vérifier si l'utilisateur existe et dans quelle colonne
SELECT * FROM users WHERE 
    email = 'teacher@teacher.fr' OR 
    username = 'teacher@teacher.fr' OR
    CONVERT(id, CHAR) = 'teacher@teacher.fr';

-- Si l'utilisateur existe mais pas dans la colonne email, mettre à jour
UPDATE users 
SET email = 'teacher@teacher.fr' 
WHERE username = 'teacher@teacher.fr' AND (email IS NULL OR email != 'teacher@teacher.fr');

-- Si la colonne username n'existe pas, l'ajouter
-- Décommentez cette ligne si nécessaire
-- ALTER TABLE users ADD COLUMN username VARCHAR(100) AFTER email;

-- Si vous avez besoin de copier l'email dans username
-- UPDATE users SET username = email WHERE username IS NULL;
