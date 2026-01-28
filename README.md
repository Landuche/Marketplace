<p align="center">
  <a href="https://github.com/Landuche/Marketplace/actions/workflows/tests.yml">
    <img src="https://github.com/Landuche/Marketplace/actions/workflows/tests.yml/badge.svg" alt="Tests Status">
  </a>
  <img src="https://img.shields.io/badge/Sentry-Observed-4527a0?logo=sentry" alt="Sentry">
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
  <img src="https://img.shields.io/badge/Docker-Enabled-2496ED?logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/PostgreSQL-Managed-4169E1?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-Asynchronous-DC382D?logo=redis" alt="Redis">
  <img src="https://img.shields.io/badge/Celery-Distributed--Tasks-37814A?logo=celery" alt="Celery">
  <img src="https://img.shields.io/badge/Stripe-Payments-008CDD?logo=stripe" alt="Stripe"> 
  <img src="https://img.shields.io/badge/Google%20Maps-Geocoding-4285F4?logo=google-maps" alt="Google Maps">
</p>

<p align="center">
  <a href="#en">English</a> • 
  <a href="#pt">Português</a>
</p>

<h1 id="en">Marketplace MVP</h1>

This project is a high-integrity e-commerce platform designed to handle complex financial workflows, real-time stock management, and geographical data validation. It integrates Django Rest Framework and React (Vite/TS), with a focus on preventing race conditions and ensuring data consistency during transactions.

## Project Highlights

- **Financial Data Integrity:** Implements order snapshotting to preserve data at the moment of purchase, ensuring records remain accurate regardless of future updates.
- **Race Condition Prevention:** Uses PostgreSQL `select_for_update` during financial processes to ensure stock and balance consistency.
- **Stock Reservation:** Uses Redis as a volatile storage layer to handle inventory, real-time cache before final database commitment.
- **Asynchronous Tasks:** Uses Celery to automatically manage order expiration, stock reconciliation, and expired inactive users/listings.
- **Infrastructure:** Fully containerized using Docker, orchestrating web, celery worker/beat, database and cache services.
- **Security:** Features JWT token rotation with custom Axios interceptor to handle token refreshing.
- **Adress Validation:** Integrates Google Maps API for normalized shipping address entry.
- **Full-Stack Type Safety:** Shared TypeScript interfaces ensure strict data contracts between the Django backend and the React frontend.
- **CI/CD & Quality Assurance:** Automated GitHub Actions pipeline that executes the pytest suite and performs OpenAPI 3.1 schema validation using drf-spectacular.
- **Real Time Observability:** Integrated Sentry for error and performance tracking across React and Django, featuring Session Replay to visualize UI failures and Distributed Tracing to link frontend crashes with the API.
- **Automated Source Mapping:** Automated Vite build pipeline to upload minified source maps to Sentry, keeping production bundle secure.

## Tech Stack

- **Backend:** Django / Django Rest Framework / Celery / drf-spectacular / Pytest
- **Frontend:** React / TypeScript / Tailwind CSS / Axios
- **Infrastructure:** Docker / Nginx / Gunicorn / Sentry / GitHub Actions
- **Database/Cache:** PostgreSQL / Redis
- **Integrations** : Stripe API / Google Maps API

## Next Steps

- **Frontend Testing:** Implement Playwright to automate user journeys.
- **API Testing:** Implement Postman for endpoint exploration and testing.
- **Production Deployment:** Deploy the MVP to Oracle Cloud using Docker orchestration and Nginx SSL.

<h1 id="pt">Marketplace MVP</h1>

Este projeto é uma plataforma de e-commerce de alta integridade, projetada para gerenciar fluxos financeiros complexos, controle de estoque em tempo real e validação de localização. A aplicação integra Django Rest Framework e React (Vite/TS), com foco na prevenção de race conditions e na garantia da consistência dos dados durante as transações.

## Detalhes do Projeto

- **Integridade Financeira:** Implementação de snapshots em pedidos, para preservar os dados no momento da compra, garantindo que os registros permaneçam precisos.
- **Prevenção de Race Conditions:** Utilização de select_for_update do PostgreSQL durante processos críticos para assegurar a consistência de dados.
- **Reserva de Estoque:** Uso do Redis como armazenamento volátil para gestão de inventário em tempo real antes do envio ao banco de dados.
- **Tarefas Assincronas:** Uso de Celery para automação de expiração de pedidos, reconciliação de estoque e limpezas periódicas de sistema.
- **Infraestrutura:** Ambiente conteinerizado com Docker, orquestrando serviços de aplicação, worker/beat do Celery, banco de dados e cache.
- **Segurança:** Autenticação via JWT com rotação de tokens e interceptor customizado no Axios para gerenciamento de refresh tokens.
- **Validação de Endereços:** Integração com Google Maps API para validação de endereços.
- **Full-Stack Type Safety:** Interfaces TypeScript garantindo comunicação ideal entre backend e frontend.
- **Testes Automatizados:** CI/CD implementado com GitHub Actions.
- **CI/CD & Garantia de Qualidade:** Pipeline automatizado via GitHub Actions que executa testes pytest e realiza a validação de schema OpenAPI 3.1 via drf-spectacular.
- **Monitoramento em Tempo Real:** Integração com Sentry para rastreamento de erros e performance no React e Django, utilizando Session Replay para visualizar falhas na UI e Distributed Tracing para conectar falhas no frontend diretamente a API.
- **Source Maps Automatizados:** Build pipeline no Vite configurado para upload automatico de source maps para o Sentry, garantindo segurança ao bundle de produção.

## Tech Stack

- **Backend:** Django / Django Rest Framework / drf-spectacular / Celery / Pytest
- **Frontend:** React / TypeScript / Tailwind CSS / Axios
- **Infraestrutura:** Docker / Nginx / Gunicorn / Sentry / GitHub Actions
- **Banco de Dados/Cache:** PostgreSQL / Redis
- **Integrações** : Stripe API / Google Maps API

## Proximos Passos

- **Testes Frontend:** Implementar Playwright para automatizar fluxos do usuario.
- **Testes de API:** Implementar Postman para exploração de endpoints e testes de integração;
- **Deploy em Produção:** Realizar o deploy do MVP com Oracle Cloud, utilizando a orquestração Docker. 