CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description, status) VALUES 
('Setup NGINX', 'Configure NGINX as a reverse proxy for the application', 'pending'),
('Deploy to Azure', 'Wrap backend into Azure Functions and deploy frontend', 'pending'),
('Containerize', 'Write Dockerfiles for frontend and backend', 'pending');
