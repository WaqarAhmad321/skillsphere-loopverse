# SkillVerse

SkillVerse is a next-generation, AI-powered mentorship platform designed to connect learners and experts seamlessly. Built with a modern, scalable architecture, it features real-time communication and intelligent automation to create a superior learning experience.

## Key Features

- **Real-Time Video/Chat Sessions**: Direct peer-to-peer video and text chat within the browser.
- **AI Session Summaries**: Automatic, AI-generated summaries of mentoring sessions from chat transcripts.
- **AI Mentor Recommendations**: Personalized mentor suggestions based on user goals and interests.
- **Role-Based Dashboards**: Tailored dashboards for Learners, Mentors, and Admins.
- **Full Admin Panel**: Tools for mentor approval and content moderation.
- **Real-Time Notifications**: Instant updates on session requests, approvals, and summaries.

## Tech Stack

- **Framework**: Next.js (App Router) & React
- **Language**: TypeScript
- **Database & Real-time**: Firebase (Firestore, Storage, Auth)
- **Generative AI**: Google's Genkit
- **UI**: shadcn/ui, Tailwind CSS
- **Data Fetching**: TanStack Query (React Query)

## Running the Project

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run the development server**:
    ```bash
    npm run dev
    ```
3.  **Run the Genkit development server (in a separate terminal)**:
    ```bash
    npm run genkit:dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
