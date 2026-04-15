# Thrivetrip - Modern Carpooling Platform


![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=flat&logo=firebase)

**Thrivetrip** is a modern, feature-rich carpooling web application designed to connect drivers with empty seats to riders looking for a convenient and eco-friendly way to travel. Built with a stunning "Radiant Glass" aesthetic, it offers a seamless user experience for finding and offering rides.

## 🌟 Key Features

*   **find & Offer Rides**: Easily search for available rides or post your own trip details.
*   **Interactive Maps**: Integrated Leaflet maps for visualizing routes and locations.
*   **Real-time Authentication**: Secure user login and registration powered by Firebase Authentication.
*   **Role Management**: Switch seamlessly between looking for a ride and offering one.
*   **Safety First**: Dedicated safety features and emergency contacts.
*   **Modern UI/UX**: A responsive, "Radiant Glass" design with smooth animations and intuitive navigation.
*   **Voice Assistant**: Hands-free interaction support (beta).

## 📦 Project Dependencies

The project relies on the following core libraries and tools:

### Runtime Dependencies
| Package | Version | Description |
| :--- | :--- | :--- |
| `react` | ^18.3.1 | Core UI library |
| `react-dom` | ^18.3.1 | React DOM rendering |
| `react-router-dom` | ^6.30.3 | Client-side routing |
| `firebase` | ^12.9.0 | Backend-as-a-Service (Auth, Firestore) |
| `leaflet` | ^1.9.4 | Interactive maps library |
| `react-leaflet` | ^4.2.1 | React components for Leaflet maps |
| `lucide-react` | ^0.563.0 | Icon library |
| `clsx` | ^2.1.1 | Utility for constructing `className` strings |
| `tailwind-merge` | ^3.4.0 | Utility to merge Tailwind CSS classes |

### Development Dependencies
| Package | Version | Description |
| :--- | :--- | :--- |
| `vite` | ^4.5.5 | Frontend build tool and dev server |
| `tailwindcss` | ^3.4.17 | Utility-first CSS framework |
| `postcss` | ^8.5.6 | Tool for transforming CSS with JavaScript |
| `autoprefixer` | ^10.4.24 | PostCSS plugin to parse CSS and add vendor prefixes |
| `eslint` | ^9.39.1 | JavaScript linting utility |
| `@vitejs/plugin-react` | ^4.2.1 | Official React plugin for Vite |

## 🚀 Getting Started

Follow these detailed instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Make sure you have the following installed:
*   [Node.js](https://nodejs.org/) (v16 or higher) - Includes `npm`.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/thrivetrip.git
    cd thrivetrip
    ```

2.  **Install dependencies:**
    This command installs all the packages listed in the `package.json` file.
    ```bash
    npm install
    ```

# 🔑 Configuration (Firebase Setup)

This application requires a Firebase project for Authentication and Database features.

1.  **Create a Firebase Project:**
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Click "Add project" and follow the setup wizard.

2.  **Enable Authentication:**
    *   In your new project, navigate to **Build > Authentication**.
    *   Click "Get started".
    *   Enable the **Email/Password** sign-in provider.

3.  **Enable Firestore Database:**
    *   Navigate to **Build > Firestore Database**.
    *   Click "Create database".
    *   Start in **Test mode** (allows read/write access for development).
    *   Choose a location close to you.

4.  **Get Your Web App Config:**
    *   Click the **Project Overview** (gear icon) > **Project settings**.
    *   Scroll down to "Your apps" and click the web icon (</>).
    *   Register the app (nickname: "Thrivetrip").
    *   Copy the `firebaseConfig` object provided.

5.  **Configure the App:**
    *   Open `src/firebase.js` in your code editor.
    *   Replace the existing `firebaseConfig` with your own keys:

    ```javascript
    // src/firebase.js
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY_HERE",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };
    ```

> [!IMPORTANT]
> The repository may contain placeholder keys. For security and proper functionality, you **must** use your own unique Firebase project keys.

### Running the App

Start the development server:
```bash
npm run dev
```

Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

## 📦 Building for Production

To create an optimized production build:
```bash
npm run build
```
This generates a `dist` folder containing the static assets ready for deployment.

You can verify the production build locally:
```bash
npm run preview
```

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
