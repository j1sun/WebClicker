# WebClicker

# For Developers:
### Note: All commands must be run in the `./frontend` folder.
- Create a Firebase Project and get your own firebaseConfig. You should copy the firebaseConfig from your firebase project settings.
    > 1. Sign in to Firebase, then open your project.
    > 2. Click the Settings icon, then select Project settings.
    > 3. In the Your apps card, select the nickname of the app for which you need a config object.
    > 4. Select Config from the Firebase SDK snippet pane.
    > 5. Get the config object snippet.
    > 6. Create a file in `./frontend/src/` named `credentials.js`
    > 7. Copy the config object to that file and add this line of code before the object snippet: `export firebaseConfig = { /* Various fields */ }`
- Install the dependencies: `npm install`
- Start the development server `npm start`

# To build:
### Note: All commands must be run in the `./frontend` folder.
- Initialize the Firebase CLI: `firebase init`
    > - Select the Firestore, Hosting, and Storage options
    > - Change the default public folder to navigate to `build`
    > - Leave all other options at their default setting
- Build the project: `npm run-script build`
- Change configuration settings:
    > 1. In `./frontend/firebase.json`, replace all text with the following:
    ```
    {
    "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
    },
    "hosting": [
        {
        "target": "test",
        "public": "build",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
            "source": "**",
            "destination": "/index.html"
            }
        ]
        },
        {
        "target": "official",
        "public": "build",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
            "source": "**",
            "destination": "/index.html"
            }
        ]
        }
    ],
    "storage": {
        "rules": "storage.rules"
    }
    }
    ```
    > 2. In `./frontend/.firebaserc`, replace all text with the following:
    ```
    {
        "projects": {
            "default": "iclicker-web-c0d76"
        },
        "targets": {
            "iclicker-web-c0d76": {
                "hosting": {
                    "official": [
                        "webclicker"
                    ],
                    "test": [
                        "iclicker-web-c0d76"
                    ]
                }
            }
        }
    }
    ```
- Deploy the project: `firebase deploy` for both URLs or `firebase deploy --only hosting:TARGET` to deploy to `hosting` or `official`.