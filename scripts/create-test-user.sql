-- Insérer un utilisateur de test (professeur)
INSERT INTO users (email, password, role) 
VALUES ('teacher@teacher.fr', SHA2('password123', 256), 'professeur')
ON DUPLICATE KEY UPDATE password = SHA2('password123', 256);

-- Récupérer l'ID de l'utilisateur
SET @user_id = LAST_INSERT_ID();

-- Insérer un enseignant associé à cet utilisateur s'il n'existe pas déjà
INSERT INTO teachers (user_id, subject)
SELECT @user_id, 'Mathématiques'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id = @user_id);

-- Insérer un utilisateur de test (admin)
INSERT INTO users (email, password, role) 
VALUES ('admin@admin.fr', SHA2('admin123', 256), 'admin')
ON DUPLICATE KEY UPDATE password = SHA2('admin123', 256);

-- Afficher les utilisateurs créés
SELECT id, email, role FROM users WHERE email IN ('teacher@teacher.fr', 'admin@admin.fr');
