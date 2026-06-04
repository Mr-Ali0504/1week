pipeline {
    agent { label 'agent-1' }

    tools {
        nodejs 'node-20'
    }

    environment {
        APP_SERVER = '13.63.176.189'
        APP_USER = 'ubuntu'
        APP_DIR = '/home/ubuntu/devops-practice-app'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Cloning repository...'
                checkout scm
            }
        }

        stage('Install Backend Dependencies') {
            steps {
                echo 'Installing backend dependencies...'
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                echo 'Installing frontend dependencies...'
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                echo 'Building React frontend...'
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy to App Server') {
            steps {
                echo 'Deploying to App Server...'
                sshagent(['app-server-key']) {
                    sh """
                        # Create app directory on server
                        ssh -o StrictHostKeyChecking=no ${APP_USER}@${APP_SERVER} 'mkdir -p ${APP_DIR}'

                        # Copy backend files
                        scp -o StrictHostKeyChecking=no -r backend/ ${APP_USER}@${APP_SERVER}:${APP_DIR}/

                        # Copy frontend build
                        scp -o StrictHostKeyChecking=no -r frontend/dist/ ${APP_USER}@${APP_SERVER}:${APP_DIR}/frontend-dist/

                        # Copy nginx config
                        scp -o StrictHostKeyChecking=no nginx.conf ${APP_USER}@${APP_SERVER}:${APP_DIR}/

                        # Install backend deps and restart with PM2
                        ssh -o StrictHostKeyChecking=no ${APP_USER}@${APP_SERVER} '
                            cd ${APP_DIR}/backend &&
                            npm install --production &&
                            pm2 stop task-manager-backend || true &&
                            pm2 start index.js --name task-manager-backend &&
                            pm2 save
                        '

                        # Configure Nginx
                        ssh -o StrictHostKeyChecking=no ${APP_USER}@${APP_SERVER} '
                            sudo cp ${APP_DIR}/nginx.conf /etc/nginx/sites-available/devops-practice-app &&
                            sudo ln -sf /etc/nginx/sites-available/devops-practice-app /etc/nginx/sites-enabled/ &&
                            sudo rm -f /etc/nginx/sites-enabled/default &&
                            sudo nginx -t &&
                            sudo systemctl reload nginx
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful! App is live at http://13.63.176.189'
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
        }
    }
}