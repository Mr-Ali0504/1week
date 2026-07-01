@Library('my-shared-library@master') _

pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
                sayHello('Asgar')
                
                // Simulate creating an artifact (like a compiled binary or zip file)
                sh 'echo "This is the compiled app" > my-app-build.txt'
            }
        }
        
        stage('Test') {
            steps {
                echo 'Testing...'
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying...'
            }
        }
    }
    
    post {
        always {
            echo 'Archiving artifacts...'
            // This grabs the file we created and saves it in Jenkins
            archiveArtifacts artifacts: 'my-app-build.txt', fingerprint: true
        }
    }
}
