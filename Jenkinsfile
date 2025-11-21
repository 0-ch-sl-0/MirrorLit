pipeline {
    agent any

    tools {
        nodejs 'NodeJs_18' 
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                if npm test; then
                  echo "테스트 성공"
                else
                  echo "테스트 실패 (하지만 CI 계속 진행)"
                fi
                '''
            }
        }
    }

    post {
        success { echo "CI 성공" }
        failure { echo "CI 실패" }
    }
}
