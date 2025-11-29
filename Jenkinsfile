pipeline {
    agent any

    tools {
        nodejs 'NodeJs_18' 
    }

    environment {
        DOCKERHUB_REPO = "chsl123/mirrorlit"
        PROJECT_ID = 'eastern-surface-478607-i2'
        CLUSTER_NAME = 'k8s'
        LOCATION = 'asia-northeast3-a'
        CREDENTIALS_ID = '726d76ec-e505-48e0-b5b5-0226ecc2d0aa'
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

           stage('Deploy to GKE') {
            when {
                branch 'develop'
            }
            steps {

                // 안전한 방식으로 이미지 태그 교체
                sh "sed -i \"s|image:.*|image: ${DOCKERHUB_REPO}:${BUILD_NUMBER}|g\" deployment.yaml"

                // verifyDeployments = false (검증은 rollout status로 직접 처리)
                step([
                    $class: 'KubernetesEngineBuilder',
                    projectId: env.PROJECT_ID,
                    clusterName: env.CLUSTER_NAME,
                    location: env.LOCATION,
                    manifestPattern: 'deployment.yaml',
                    credentialsId: env.CREDENTIALS_ID,
                    verifyDeployments: false
                ])

                // 롤아웃 정상 확인 (이게 진짜 중요!)
                sh "kubectl rollout status deployment/mirrorlit-deploy --timeout=60s"
            }
        }
    }

    post {
        success { echo "CI 성공" }
        failure { echo "CI 실패" }
    }
}