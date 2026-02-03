<p align="center">
  <a href="https://github.com/Landuche/Marketplace/actions/workflows/tests.yml">
    <img src="https://github.com/Landuche/Marketplace/actions/workflows/tests.yml/badge.svg" alt="Tests Status">
  </a>
  <img src="https://img.shields.io/badge/OpenAPI-3.1-6BA539?logo=openapiinitiative" alt="OpenAPI 3.1">
  <img src="https://img.shields.io/badge/Documentation-Swagger-85EA2D?logo=swagger" alt="Swagger">
  <img src="https://img.shields.io/badge/Playwright-E2E%20Tested-45ba4b?logo=playwright" alt="Playwright">
  <img src="https://img.shields.io/badge/Sentry-Observed-4527a0?logo=sentry" alt="Sentry">
  <img src="https://img.shields.io/badge/Monitoring-Prometheus-E6522C?logo=prometheus&logoColor=white" alt="Prometheus">
  <img src="https://img.shields.io/badge/Dashboards-Grafana-F46800?logo=grafana&logoColor=white" alt="Grafana">
  <img src="https://img.shields.io/badge/code%20style-black-000000" alt="Black">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License MIT">
  <img src="https://img.shields.io/badge/Status-Work%20In%20Progress-yellow" alt="Status WIP">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.13-blue" alt="Python 3.13"> 
  <img src="https://img.shields.io/badge/Django-5.1%2B-brightgreen" alt="Django 5.1"> 
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19"> 
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript" alt="TypeScript"> 
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Containerized-Docker-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Static%20Files-WhiteNoise-blue?logo=python&logoColor=white" alt="WhiteNoise">
  <img src="https://img.shields.io/badge/Deployment-AWS%20EC2-FF9900?logo=amazonec2" alt="AWS EC2">
  <img src="https://img.shields.io/badge/Storage-AWS%20S3-569A31?logo=amazons3&logoColor=white" alt="AWS S3">
  <img src="https://img.shields.io/badge/Registry-GHCR-444444?logo=github" alt="GHCR">
  <img src="https://img.shields.io/badge/PostgreSQL-Managed-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-Asynchronous-DC382D?logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/Celery-Distributed--Tasks-37814A?logo=celery" alt="Celery">
  <img src="https://img.shields.io/badge/SSL-Certbot-003D69?logo=certbot&logoColor=white" alt="Certbot">
  <img src="https://img.shields.io/badge/Stripe-Payments-008CDD?logo=stripe" alt="Stripe"> 
  <img src="https://img.shields.io/badge/Google%20Maps-Geocoding-4285F4?logo=google-maps" alt="Google Maps">
</p>

<p align="center">
  <a href="#en">English</a> • 
  <a href="#pt">Português</a>
</p>

<p align="center">
  <a href="https://marketplace-landuche.duckdns.org/api/docs/">Swagger API Documentation</a> • 
  <a href="https://marketplace-landuche.duckdns.org/grafana/">Grafana Prometheus Dashboards</a>
</p>

<h1 id="pt">Marketplace MVP</h1>

Este projeto é uma base para plataformas de e-commerce, focada em integridade, com o uso de API Stripe para pagamentos, API do Google Maps para normalização geografica, cache volatil Redis, backups automaticos em bucket dedicado AWS S3, e reconciliação de estoque assincrona com Celery. Stack Django/React com API Rest Framework documentada com Swagger, e monitorada com Sentry, Prometheus e Grafana, configurada para deploy em servidor AWS EC2 com criptografia HTTPS.

## Detalhes do Projeto

### Confiabilidade e Integridade de Dados
  * **Integridade Financeira:** Implementação de snapshots em pedidos para preservar os dados no momento da compra, garantindo que os registros permaneçam precisos.
  * **Prevenção de Race Conditions:** Utilização do select_for_update do PostgreSQL durante atualizações de estoque para assegurar a consistencia de dados.
  * **Pagamentos:** Implementação da API Stripe, usando arquitetura baseada em webhooks para lidar com confirmação de pagamento e reembolso assincronas.
  * **Reserva de Estoque:** Uso do Redis como camada volatil de cache para gerenciar o inventario em tempo real antes da confirmação final no banco de dados.
  * **Tarefas Assincronas:** Uso de Celery para gerenciar ciclos em segundo plano, incluindo expiração de pedidos, reconciliação de estoque e remoção de entidades inativas ou expiradas.

### Arquitetura da API
  * **Documentação Completa da API:** Integração com Swagger, incluindo schemas personalizados individualmente para todos os endpoints, exemplos detalhados de request/response para cenarios de sucesso ou erro, e mapeamento customizado para multipart/form-data.
  * **Validação de Endereços:** Integração com Google Maps API para validação e normalização de endereços.
  * **Segurança:** Autenticação via JWT com rotação de tokens e interceptor customizado no Axios para gerenciamento de refresh tokens em segundo plano.

### DevOps e Nuvem
  * **Infraestrutura:** Totalmente conteinerizado com Docker.
  * **Infraestrutura Stateless:** Armazenamento de midia e backups automatizados do banco de dados em buckets individuais AWS S3, prevenindo perda de dados.
  * **Preparado Para AWS EC2:** Implementado com sucesso em um servidor Ubuntu AWS, com testes em tempo real, validando funcionamento de APIs externas, cache Redis, e execução de tarefas com Celery.
  * **Otimização:** Otimizado para instancias de baixa performance usando `compressedManifestStaticFilesStorage` do WhiteNoise para garantir alta performance na entrega de arquivos, pacotes GHCR para diminuir uso de memória e processamento, e Linux swap space para garantir maior estabilidade.
  * **CI/CD Orquestrado:** Pipeline no GitHub Actions que roda a stack Dockerizada e executa validação em multiplas camadas, incluindo testes end-to-end com Playwright no sistema em execuçao e APIs externas, Pytest para a lógica do backend e detecção de schema drift do OpenAPI 3.1 comparando com a especificação gerada em tempo real.
  * **Monitoramento em Tempo Real:** Integração com Sentry para distributed tracing e session replay, alem de Prometheus e Grafana para métricas em tempo real de performance do servidor, trafego da API e tarefas do Celery.
  * **Criptografia Automatica:** Uso do Certbot para geração e renovação automatica de SSL Let's Encrypt, integrado diretamente ao Docker.

## Tech Stack

- **Backend:** Django / Django Rest Framework / JWT / Celery / OpenAPI / Swagger
- **Frontend:** React / TypeScript / Tailwind CSS / Axios
- **Banco de Dados/Cache:** PostgreSQL / Redis
- **Testes:** Playwright / Pytest / Validação de Schema OpenAPI
- **DevOps:** Docker / Docker Compose / Nginx / Gunicorn / GitHub Actions / GHCR / WhiteNoise
- **Monitoramento:** Sentry, Prometheus, Grafana
- **Nuvem:** AWS S3, EC2, IAM
- **Integrações** : Stripe API / Google Maps API


<h1 id="en">Marketplace MVP</h1>

This project is a foundation for e-commerce platforms focused on integrity, utilizing Stripe API for payments, Google Maps API for geographical normalization, Redis for volatile caching, automated backups in a dedicated AWS S3 bucket, and asynchronous stock reconciliation via Celery. It features a Django/React stack with Swagger documentation, monitored by Sentry, Prometheus, and Grafana, configured for AWS EC2 deployment with HTTPS encryption.

## Project Highlights

### Reliability & Data Integrity
  * **Financial Data Integrity:** Implements order snapshotting to preserve data at the moment of purchase, ensuring records remain accurate regardless of future updates.
  * **Race Condition Prevention:** Uses PostgreSQL `select_for_update` during inventory updates to ensure stock consistency under high concurrency.
  * **Payment Orchestration:** Integrated Stripe API using webhook based architecture to handle asynchronous payment and refund confirmation.
  * **Distributed Stock Reservation:** Uses Redis as a volatile storage layer to handle inventory in real-time cache before final database commitment.
  * **Asynchronous Tasks:** Uses Celery to manage background lifecycles, including automated order expiration, stock reconciliation, and cleanup of inactive entities.

### API Architecture
  * **Comprehensive API Documentation:** Integrated Swagger with manual schema overrides for every endpoint. Features high-fidelity request/response examples for all success and error states and custom mapping or multipart/form-data manifests.
  * **Address Validation:** Integrates Google Maps API for validation and normalized address entry.
  * **Security:** Features JWT token rotation with custom Axios interceptor to handle background token refreshing.

### DevOps & Cloud
  * **Infrastructure:** Fully containerized using Docker.
  * **Stateless Infrastructure:** Media and automated database backups stored in individual AWS S3 buckets, preventing data loss.
  * **AWS EC2 Ready:** Successfully deployed and validated on an Ubuntu AWS instance, including live verification of external APIs, Redis cache and Celery task execution.
  * **Performance Optimization:** Optimized for low tier environments using WhiteNoise `compressedManifestStaticFilesStorage` to ensure high-performance file serving, with GHCR images and Linux swap space management to ensure stability.
  * **Orchestrated CI/CD:** GitHub Actions pipeline spins up the full Dockerized stack and executes layered validation with Playwright end-to-end tests against the live system and external APIs, Pytest for backend logic, and OpenAPI 3.1 schema drift detection against the generated spec.
  * **Full Stack Observability:** Integrated Sentry for distributed tracing and session replays alongside Prometheus and Grafana for real-time server performance metrics, API traffic, and Celery tasks.
  * **Automatic Encryption:** Features Certbot for automated Let's Encrypt SSL, integrated directly into the Docker orchestration. 

## Tech Stack

- **Backend:** Django / Django Rest Framework / JWT / Celery / OpenAPI / Swagger
- **Frontend:** React / TypeScript / Tailwind CSS / Axios
- **Database/Cache:** PostgreSQL / Redis
- **Testing:** Playwright / Pytest / OpenAPI Schema Validation
- **Integrations** : Stripe API / Google Maps API
- **DevOps:** Docker / Docker Compose / Nginx / Gunicorn / GitHub Actions / GHCR / WhiteNoise / Certbot (Let's Encrypt SSL)
- **Monitoring:** Sentry, Prometheus, Grafana
- **Cloud:** AWS S3, EC2, IAM