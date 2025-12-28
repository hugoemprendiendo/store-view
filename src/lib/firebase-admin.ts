import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeAdminApp() {
    if (getApps().length > 0) {
        const existingApp = getApps()[0];
        return {
            app: existingApp,
            firestore: getFirestore(existingApp)
        };
    }
    
    let app: App;
    try {
        // Attempt to initialize using Application Default Credentials
        app = initializeApp();
    } catch (e) {
        console.warn("Admin SDK automatic initialization failed. This is expected in local development.", e);
        // Fallback for local development or environments where ADC isn't set up
        app = initializeApp({
            credential: credential.applicationDefault(),
        });
    }

    return {
        app,
        firestore: getFirestore(app)
    };
}
