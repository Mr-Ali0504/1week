@Library('my-shared-library@master') _

pipeline {
    agent any
    
    stages {
        stage('Build') {
            steps {
                echo 'Building...'
                sayHello('Asgar')
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
}
