pipeline {
    agent { label 'agent-1' }

    tools {
        nodejs 'node-20'
    }

    environment {
        AZURE_CLIENT_ID       = credentials('AZURE_CLIENT_ID')
        AZURE_CLIENT_SECRET   = credentials('AZURE_CLIENT_SECRET')
        AZURE_TENANT_ID       = credentials('AZURE_TENANT_ID')
        AZURE_SUBSCRIPTION_ID = credentials('AZURE_SUBSCRIPTION_ID')
        ACR_LOGIN_SERVER      = 'levelup.azurecr.io'
        AKS_CLUSTER           = 'levelup'
        RESOURCE_GROUP        = 'level-up'
        IMAGE_TAG             = "${BUILD_NUMBER}"
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
                dir('backend') {
                    sh 'npm install'
                }
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Azure Login') {
            steps {
                sh '''
                    az login --service-principal \
                        --username $AZURE_CLIENT_ID \
                        --password $AZURE_CLIENT_SECRET \
                        --tenant $AZURE_TENANT_ID
                    az account set --subscription $AZURE_SUBSCRIPTION_ID
                '''
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                    # Build backend
                    docker build -t $ACR_LOGIN_SERVER/backend:$IMAGE_TAG ./backend

                    # Build frontend
                    docker build -t $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG ./frontend
                '''
            }
        }

        stage('Scan Docker Images') {
            steps {
                sh '''
                    # Scan backend image with Trivy
                    # Exits with an error if HIGH or CRITICAL vulnerabilities are found
                    trivy image --severity HIGH,CRITICAL --exit-code 1 --no-progress $ACR_LOGIN_SERVER/backend:$IMAGE_TAG

                    # Scan frontend image with Trivy
                    trivy image --severity HIGH,CRITICAL --exit-code 1 --no-progress $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG
                '''
            }
        }

        stage('Push Docker Images') {
            steps {
                sh '''
                    # Login to ACR
                    az acr login --name levelup

                    # Push backend
                    docker push $ACR_LOGIN_SERVER/backend:$IMAGE_TAG
                    docker tag $ACR_LOGIN_SERVER/backend:$IMAGE_TAG $ACR_LOGIN_SERVER/backend:latest
                    docker push $ACR_LOGIN_SERVER/backend:latest

                    # Push frontend
                    docker push $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG
                    docker tag $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG $ACR_LOGIN_SERVER/frontend:latest
                    docker push $ACR_LOGIN_SERVER/frontend:latest
                '''
            }
        }

        stage('Deploy to AKS') {
            steps {
                sh '''
                    # Get AKS credentials
                    az aks get-credentials \
                        --resource-group $RESOURCE_GROUP \
                        --name $AKS_CLUSTER \
                        --overwrite-existing

                    # Apply manifests
                    kubectl apply -f k8s/namespace.yaml
                    kubectl apply -f k8s/database-deployment.yaml
                    kubectl apply -f k8s/backend-deployment.yaml
                    kubectl apply -f k8s/frontend-deployment.yaml

                    # Update images with new tag
                    kubectl set image deployment/backend \
                        backend=$ACR_LOGIN_SERVER/backend:$IMAGE_TAG \
                        -n devops-practice

                    kubectl set image deployment/frontend \
                        frontend=$ACR_LOGIN_SERVER/frontend:$IMAGE_TAG \
                        -n devops-practice

                    # Wait for rollout
                    kubectl rollout status deployment/backend -n devops-practice
                    kubectl rollout status deployment/frontend -n devops-practice

                    # Get external IP
                    kubectl get service frontend -n devops-practice
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment to AKS successful!'
            sh 'kubectl get service frontend -n devops-practice'
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
        }
    }
}