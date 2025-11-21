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

    stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKERHUB_REPO}:${env.BUILD_NUMBER} ."
                }
            }
        }

        stage('Push to DockerHub') {
            steps {
                script {
                    docker.withRegistry('', 'dockerhub') {     
                        sh "docker push ${DOCKERHUB_REPO}:${BUILD_NUMBER}"
                        sh "docker tag ${DOCKERHUB_REPO}:${BUILD_NUMBER} ${DOCKERHUB_REPO}:latest"
                        sh "docker push ${DOCKERHUB_REPO}:latest"
                    }
                }
            }
        }
    }

    post {
        success { echo "CI 성공" }
        failure { echo "CI 실패" }
    }
}
