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
        stage('Analysis & Test Prep') {
            parallel {
                stage('Backend Prep') {
                    steps {
                        dir('backend') {
                            sh 'npm ci'
                            sh 'npm test --if-present || true'
                        }
                    }
                }
                stage('Frontend Prep') {
                    steps {
                        dir('frontend') {
                            sh 'npm ci'
                            sh 'npm run test --if-present || true'
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    // Resolve the sonar-scanner executable from global tools configuration
                    def scannerHome = tool name: 'sonar-scanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                    
                    withSonarQubeEnv('sonarqube') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner \\
                                -Dsonar.projectKey=devops-practice-app \\
                                -Dsonar.sources=. \\
                                -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/.git/**,**/coverage/** \\
                                -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Azure Login') {
            steps {
                sh '''
                    az login --service-principal \\
                        --username $AZURE_CLIENT_ID \\
                        --password $AZURE_CLIENT_SECRET \\
                        --tenant $AZURE_TENANT_ID
                    az account set --subscription $AZURE_SUBSCRIPTION_ID
                '''
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Backend') {
                    steps {
                        sh 'docker build -t $ACR_LOGIN_SERVER/backend:$IMAGE_TAG ./backend'
                    }
                }
                stage('Build Frontend') {
                    steps {
                        sh 'docker build -t $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG ./frontend'
                    }
                }
            }
        }

        stage('Scan Docker Images') {
            stages {
                stage('Download Trivy DB') {
                    steps {
                        sh 'docker run --rm -v trivy-cache:/root/.cache/ aquasec/trivy image --download-db-only --no-progress'
                    }
                }
                stage('Run Parallel Scans') {
                    parallel {
                        stage('Scan Backend') {
                            steps {
                                sh '''
                                    docker save $ACR_LOGIN_SERVER/backend:$IMAGE_TAG -o backend.tar
                                    docker run --rm -v $(pwd):/workspace -w /workspace -v trivy-cache:/root/.cache/ aquasec/trivy image --skip-db-update --input backend.tar --severity HIGH,CRITICAL --exit-code 1 --no-progress --skip-dirs /usr/local/lib/node_modules/npm
                                '''
                            }
                        }
                        stage('Scan Frontend') {
                            steps {
                                sh '''
                                    docker save $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG -o frontend.tar
                                    docker run --rm -v $(pwd):/workspace -w /workspace -v trivy-cache:/root/.cache/ aquasec/trivy image --skip-db-update --input frontend.tar --severity HIGH,CRITICAL --exit-code 1 --no-progress --skip-dirs /usr/local/lib/node_modules/npm
                                '''
                            }
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            stages {
                stage('Login to ACR') {
                    steps {
                        sh 'az acr login --name levelup'
                    }
                }
                stage('Push to ACR') {
                    parallel {
                        stage('Push Backend') {
                            steps {
                                sh 'docker push $ACR_LOGIN_SERVER/backend:$IMAGE_TAG'
                            }
                        }
                        stage('Push Frontend') {
                            steps {
                                sh 'docker push $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG'
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to AKS') {
            steps {
                sh '''
                    # Get AKS credentials
                    az aks get-credentials \\
                        --resource-group $RESOURCE_GROUP \\
                        --name $AKS_CLUSTER \\
                        --overwrite-existing

                    # Update image tags in manifests using sed
                    sed -i "s|__IMAGE_TAG__|$IMAGE_TAG|g" k8s/backend-deployment.yaml
                    sed -i "s|__IMAGE_TAG__|$IMAGE_TAG|g" k8s/frontend-deployment.yaml

                    # Apply manifests
                    kubectl apply -f k8s/namespace.yaml
                    kubectl apply -f k8s/database-deployment.yaml
                    kubectl apply -f k8s/backend-deployment.yaml
                    kubectl apply -f k8s/frontend-deployment.yaml

                    # Wait for rollout with automatic rollback on failure
                    kubectl rollout status deployment/backend -n devops-practice --timeout=2m || \\
                        (kubectl rollout undo deployment/backend -n devops-practice && exit 1)
                        
                    kubectl rollout status deployment/frontend -n devops-practice --timeout=2m || \\
                        (kubectl rollout undo deployment/frontend -n devops-practice && exit 1)
                '''
            }
        }
    }

    post {
        always {
            echo 'Cleaning up local Docker images and tarballs to free space...'
            sh '''
                rm -f backend.tar frontend.tar
                docker rmi $ACR_LOGIN_SERVER/backend:$IMAGE_TAG || true
                docker rmi $ACR_LOGIN_SERVER/frontend:$IMAGE_TAG || true
            '''
        }
        success {
            echo 'Deployment to AKS successful!'
            // Production environments should notify a Slack channel or email.
            // slackSend(channel: '#deployments', color: 'good', message: "Deployment successful for $IMAGE_TAG")
            sh 'kubectl get service frontend -n devops-practice'
        }
        failure {
            echo 'Pipeline failed! Check the logs above.'
            // slackSend(channel: '#deployments', color: 'danger', message: "Deployment FAILED for $IMAGE_TAG")
        }
    }
}