CREATE TABLE roles (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

INSERT INTO roles (Id, name) VALUES
(1, 'admin'),
(2, 'user');

CREATE TABLE users (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL DEFAULT 2,
    FOREIGN KEY (role_id) REFERENCES roles(Id)
);