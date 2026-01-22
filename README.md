<p align="center"> 
    <img src="https://img.shields.io/badge/Python-3.13-blue" alt="Python 3.13"> 
    <img src="https://img.shields.io/badge/Django-5.1%2B-brightgreen" alt="Django 5.1"> 
    <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19"> 
    <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript" alt="TypeScript"> 
    <img src="https://img.shields.io/badge/Redis-Asynchronous-DC382D?logo=redis" alt="Redis"> 
    <img src="https://img.shields.io/badge/Stripe-Payments-008CDD?logo=stripe" alt="Stripe"> 
    <img src="https://img.shields.io/badge/code%20style-black-000000" alt="Black"> 
    <img src="https://img.shields.io/badge/Status-Work%20In%20Progress-yellow" alt="Status WIP">
</p>

# Marketplace MVP

[GitHub Repo Link](https://github.com/Landuche/Marketplace)

This project is a high-integrity e-commerce platform designed to handle complex financial workflows, real-time stock management, and geographical data validation. It integrates Django Rest Framework and React (Vite/TS), with a focus on preventing race conditions and ensuring data consistency during transactions.

## Project Highlights

- **Financial Data Integrity:** Implements order snapshotting to preserve data at the moment of purchase, ensuring records remain accurate regardless of future updates.
- **Race Condition Prevention:** Uses PostgreSQL `select_for_update` during financial processes to ensure stock and balance consistency.
- **Stock Reservation:** Uses Redis as a volatile storage layer to handle inventory, real-time cache before final database commitment.
- **Asynchronous Tasks:** Uses Celery to automatically manage order expiration, stock reconciliation, and expired inactive users/listings.
- **Security:** Features JWT token rotation with custom Axios interceptor to handle token refreshing.
- **Adress Validation:** Integrates Google Maps API for normalized shipping address entry.
- **Full-Stack Type Safety:** Shared TypeScript interfaces ensure strict data contracts between the Django backend and the React frontend.

## Tech Stack

- **Backend:** Django 5.x / Django Rest Framework / Celery
- **Frontend:** React 19 / TypeScript / Tailwind CSS / Axios
- **Database/Cache:** PostgreSQL 18 / Redis
- **Integrations** : Stripe API / Google Maps API

## Next Steps

- **Dockerization:** Full containerization using docker.
- **Testing:** Implementing 90%+ test coverage for all routes.
- **Live Demo:** Deploy the MVP to a production environment.