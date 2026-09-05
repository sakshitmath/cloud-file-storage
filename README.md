# Cloud File Storage

A full-stack cloud-based file storage application with secure authentication, folder organization, file sharing, and public link sharing — similar in spirit to Google Drive.

**Live App:** https://cloud-file-storage-pied.vercel.app
**Backend API:** https://cloud-file-storage-backend-9xdp.onrender.com

> The backend runs on Render's free tier and spins down after inactivity — the first request after idle time may take 30–50 seconds.

## Features

- JWT-based authentication (register/login)
- Upload, download, preview, rename, and delete files
- Nested folder organization
- Starred files for quick access
- Trash with restore support
- Search files by name
- Share files with other users (Viewer/Editor permissions)
- Public shareable links with optional password and expiry

## Tech Stack

**Backend:** Java 21, Spring Boot, Spring Security (JWT), Spring Data JPA, PostgreSQL
**Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios
**Deployment:** Backend on Render (Docker), Frontend on Vercel, PostgreSQL on Render

## Project Structure
cloud-file-storage/
├── backend/ # Spring Boot REST API
│ └── src/main/java/com/cloudstorage/backend/
│ ├── controller/ # REST endpoints
│ ├── service/ # Business logic
│ ├── model/ # JPA entities
│ └── repository/ # Data access layer
└── frontend/ # React + Vite SPA
└── src/
├── pages/ # Login, Register, Dashboard
└── api/ # Axios client config


## Author

**Sakshi** — [GitHub](https://github.com/sakshitmath)
