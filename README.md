# Leptons: Transformer Thermal Inspection System

[](https://opensource.org/licenses/MIT)
[](https://www.google.com/search?q=https://github.com/your-username/thermoscan)
[](https://www.google.com/search?q=%23features-for-phase-1)

A full-stack web application designed to automate and digitize the thermal inspection workflow for power distribution transformers. This system provides a centralized platform for managing transformer data, analyzing thermal images, and generating maintenance records.

## Table of Contents

  - [Project Overview](#project-overview)
  - [Features (Phase 1)](#features-for-phase-1-)
  - [Architecture](#architecture-️)
  - [Technology Stack](#technology-stack-)
  - [Database Schema](#databas)
  - [API Endpoints](#api-endpoints)
  - [Getting Started](#getting-started-)
      - [Prerequisites](#prerequisites)
      - [Supabase Setup](#1-supabase-setup)
      - [Backend Setup (Spring Boot)](#2-backend-setup-spring-boot)
      - [Frontend Setup (React)](#3-frontend-setup-react)
  - [Usage](#usage-️)
  - [Contributing](#contributing)

-----

## Project Overview

Power utilities conduct routine thermal inspections of distribution transformers to proactively identify potential failures such as overheating, load imbalances, or insulation degradation. The current process relies heavily on manual comparison of thermal images, which is time-consuming, subjective, and prone to human error.

**ThermoScan** aims to solve this by providing a robust software solution that automates anomaly detection, digitizes record-keeping, and ensures traceability. The system allows administrators to manage a database of transformers, upload baseline and maintenance thermal images, and (in future phases) leverage computer vision to automatically flag potential issues. This streamlines the entire inspection workflow, leading to increased efficiency, accuracy, and reliability.

-----

## Features for Phase 1 🎯

This initial phase focuses on establishing the foundational data management capabilities of the system.

  * **Transformer Management (FR1.1):**

      * A full CRUD (Create, Read, Update, Delete) interface for managing transformer records.
      * Each transformer is defined by a unique ID, physical location, and power capacity.

  * **Thermal Image Management (FR1.2):**

      * Ability to upload thermal images and associate them with specific transformer records.
      * Images are tagged as either **Baseline** (a reference image under normal conditions) or **Maintenance** (a new image from a routine inspection).
      * Image metadata (upload timestamp, uploader info) is automatically recorded.

  * **Environmental Tagging (FR1.3):**

      * Baseline images must be categorized by the environmental conditions at the time of capture: **Sunny**, **Cloudy**, or **Rainy**. This is crucial for accurate comparisons in later phases.

-----

## Architecture 🏗️

The application is built on a modern, decoupled three-tier architecture, ensuring scalability and maintainability.

1.  **Frontend (Client-Side):** A responsive and interactive user interface built with **React**. It handles all user interactions and communicates with the backend via a REST API. It does not contain any business logic.

2.  **Backend (Server-Side):** A robust RESTful API developed with **Java Spring Boot**. It is responsible for all business logic, data processing, and validation. It serves as the intermediary between the frontend and the database.

3.  **Database & Storage:** We use **Supabase**, a Backend-as-a-Service platform.

      * **Database:** A relational **PostgreSQL** database hosts all structured data, such as transformer details and image metadata.
      * **Storage:** Thermal images are uploaded directly to a Supabase **S3-compatible Storage bucket**. The database stores the URL (link) to each image, not the image itself, which is efficient and scalable.

### Data Flow for Image Upload:

1.  User selects an image to upload in the React UI.
2.  The frontend makes a request to the Spring Boot backend with the image and associated metadata (e.g., transformer ID, image type).
3.  The backend authenticates the request, uploads the image file to the Supabase S3 bucket, and receives a public URL in return.
4.  The backend then saves this URL along with other metadata into the PostgreSQL database.
5.  A success response is sent back to the frontend.

-----

## Technology Stack 💻

  * **Frontend:** React, Axios (for API calls), CSS/Sass
  * **Backend:** Java, Spring Boot, Spring Data JPA
  * **Database:** Supabase (PostgreSQL)
  * **File Storage:** Supabase Storage (S3)
  * **Build Tools:** Maven (Backend), npm / Vite (Frontend)

-----

## Database Schema

For Phase 1, the core database schema consists of two primary tables:

#### `transformers`

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the transformer |
| `location` | `TEXT` | Not Null | Physical address or coordinates |
| `capacity_kva`| `INTEGER` | Not Null | Power capacity in kVA |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Timestamp of record creation |

#### `thermal_images`

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique identifier for the image record |
| `transformer_id`| `UUID` | Foreign Key (`transformers.id`) | Links the image to a transformer |
| `image_url` | `TEXT` | Not Null | Public URL of the image in S3 storage |
| `image_type` | `VARCHAR(20)`| Not Null | 'BASELINE' or 'MAINTENANCE' |
| `env_condition` | `VARCHAR(20)`| Nullable | 'SUNNY', 'CLOUDY', 'RAINY' (for BASELINE only) |
| `uploader_id` | `TEXT` | Not Null | ID or name of the admin who uploaded it |
| `uploaded_at` | `TIMESTAMPTZ`| Default `now()`| Timestamp of the upload |

-----

## API Endpoints

The Spring Boot backend exposes the following RESTful endpoints for Phase 1.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/transformers` | Fetches a list of all transformers. |
| `POST` | `/api/transformers` | Creates a new transformer record. |
| `GET` | `/api/transformers/{id}` | Retrieves a single transformer by its ID. |
| `PUT` | `/api/transformers/{id}` | Updates the details of an existing transformer. |
| `DELETE`| `/api/transformers/{id}` | Deletes a transformer record. |
| `GET` | `/api/transformers/{id}/images` | Retrieves all images associated with a transformer. Can be filtered by `image_type`. |
| `POST` | `/api/images` | Uploads a new thermal image (baseline or maintenance) for a specific transformer. The request body includes the image file, transformer ID, type, and environmental condition. |

*Note: The user-mentioned `inspections` table and its associated endpoints (`/api/inspections`) are planned for a future phase but may have placeholder structures in the current codebase.*

-----

## Getting Started 🚀

Follow these instructions to get the project running on your local machine.

### Prerequisites

  * **Git:** For cloning the repository.
  * **Node.js & npm:** (v18 or higher) For running the React frontend.
  * **Java Development Kit (JDK):** (v17 or higher) For running the Spring Boot backend.
  * **Apache Maven:** (v3.8 or higher) For managing backend dependencies and building the project.
  * **Supabase Account:** A free account is sufficient to start.

### 1\. Supabase Setup

1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Database:** Once the project is ready, the database is automatically provisioned. No extra setup is needed for the tables; Spring Boot with JPA will handle table creation.
3.  **Storage:** In the Supabase dashboard, navigate to the **Storage** section and create a new **public bucket**. Let's name it `thermal-images`.
4.  **API Keys:** Navigate to **Project Settings \> API**. You will need the following information for your backend configuration:
      * Project URL
      * `service_role` secret key (this is a privileged key for backend use only)

### 2\. Backend Setup (Spring Boot)

```bash
# Clone the repository
git clone https://github.com/your-username/thermoscan.git
cd thermoscan/backend

# Create an application.properties file
# In `src/main/resources/`, create a file named `application.properties`
# and add the following configuration:
```

**`src/main/resources/application.properties`:**

```properties
# PostgreSQL Database Configuration (from Supabase)
spring.datasource.url=jdbc:postgresql://[YOUR_SUPABASE_HOST]:5432/[YOUR_DB_NAME]
spring.datasource.username=postgres
spring.datasource.password=[YOUR_SUPABASE_DB_PASSWORD]
spring.jpa.hibernate.ddl-auto=update

# Supabase Storage Configuration
supabase.url=[YOUR_SUPABASE_PROJECT_URL]
supabase.key=[YOUR_SUPABASE_SERVICE_ROLE_KEY]
supabase.bucket.name=thermal-images
```

```bash
# Install dependencies and run the application
mvn install
mvn spring-boot:run
```

The backend server will start, typically on `http://localhost:8080`.

### 3\. Frontend Setup (React)

```bash
# Navigate to the frontend directory
cd ../frontend

# Create a .env.local file in the root of the frontend directory
# Add the base URL for your backend API
```

**`frontend/.env.local`:**

```
REACT_APP_API_BASE_URL=http://localhost:8080
```

```bash
# Install dependencies and start the development server
npm install
npm start
```

The React application will open in your browser, usually at `http://localhost:3000`.

-----

## Usage 🖱️

Once both the frontend and backend are running:

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  You will see the main dashboard with two tabs: **Transformers** and **Inspections**.
3.  Use the **Transformers** tab to add a new transformer record, including its ID, location, and capacity.
4.  Click on a transformer in the table to view its details.
5.  On the details page, you can upload a **Baseline Image**. You will be prompted to select the environmental condition (Sunny, Cloudy, or Rainy) during the upload.
6.  You can also upload **Maintenance Images** for ongoing inspections from the same interface.

-----

## Contributing

Contributions are welcome\! If you have suggestions or want to improve the code, please feel free to:

1.  Fork the repository.
2.  Create a new feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.
