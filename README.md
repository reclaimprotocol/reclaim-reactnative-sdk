<div>
    <div>
        <img src="https://raw.githubusercontent.com/reclaimprotocol/.github/main/assets/banners/JS-SDK.png"  />
    </div>
</div>

# Reclaim Protocol React Native SDK Integration Guide

This guide will walk you through integrating the Reclaim Protocol React Native SDK into your application. We'll create a simple React Native application that demonstrates how to use the SDK to generate proofs and verify claims.

## Prerequisites

Before we begin, make sure you have:

1. An application ID from Reclaim Protocol.
2. An application secret from Reclaim Protocol.
3. A provider ID for the specific service you want to verify.

You can obtain these details from the [Reclaim Developer Portal](https://dev.reclaimprotocol.org/).

## Step 1: Create a new React Native application

Let's start by creating a new React Native application:

```bash
npx react-native init ReclaimApp
cd ReclaimApp
```

## Step 2: Install necessary dependencies

Install the Reclaim Protocol React Native SDK:

```bash
npm install @reclaimprotocol/reactnative-sdk
```

## Step 3: Set up your React Native component

Replace the contents of `App.tsx` with the following code:

```typescript
import * as React from 'react';
import {useEffect, useState} from 'react';
import {View, Text, Button, StyleSheet, Linking, TouchableOpacity, ScrollView} from 'react-native'; 
import {ReclaimProofRequest} from '@reclaimprotocol/reactnative-sdk';
import type { Proof } from '@reclaimprotocol/reactnative-sdk';

// Define your app's deep link scheme
const APP_SCHEME = 'reclaimexample://';

export default function App() {
  const [status, setStatus] = useState<string>('');
  const [extracted, setExtracted] = useState<string | null>(null);
  const [proofObject, setProofObject] = useState<string | null>(null);
  const [reclaimProofRequest, setReclaimProofRequest] = useState<ReclaimProofRequest | null>(null);
  const [requestUrl, setRequestUrl] = useState<string | null>(null);

  useEffect(() => {
    initializeReclaimProofRequest();
    setupDeepLinking();
  }, []);

  // Set up deep linking to handle redirects back to the app
  function setupDeepLinking() {
    Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({url});
      }
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  }

  // Handle incoming deep links
  function handleDeepLink(event: {url: string}) {
    console.log('Deep link received:', event.url);
    // You can add logic here to handle the deep link
  }

  // Initialize the ReclaimProofRequest
  async function initializeReclaimProofRequest() {
    try {
      const proofRequest = await ReclaimProofRequest.init(
        'YOUR_APP_ID',
        'YOUR_APP_SECRET',
        'YOUR_PROVIDER_ID'
      );
      setReclaimProofRequest(proofRequest);

      proofRequest.addContext('0x00000000000', 'Example context message');
      proofRequest.setRedirectUrl(`${APP_SCHEME}proof`);

      console.log('Proof request initialized:', proofRequest.toJsonString());
    } catch (error) {
      console.error('Error initializing ReclaimProofRequest:', error);
    }
  }

  // Start the Reclaim verification session
  async function startReclaimSession() {
    if (!reclaimProofRequest) {
      console.error('ReclaimProofRequest not initialized');
      return;
    }

    try {
      setStatus('Starting Reclaim session...');

      const url = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(url);
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setStatus('Session started. Waiting for proof...');
      } else {
        setStatus('Unable to open URL automatically. Please copy and open the URL manually.');
      }

      const statusUrl = reclaimProofRequest.getStatusUrl();
      console.log('Status URL:', statusUrl);

      await reclaimProofRequest.startSession({
        onSuccess: async (proof: Proof) => {
          console.log('Proof received:', proof);
          setStatus('Proof received!');
          setExtracted(JSON.stringify(proof.claimData.context));
          setProofObject(JSON.stringify(proof, null, 2));
        },
        onError: (error: Error) => {
          console.error('Error in proof generation:', error);
          setStatus(`Error in proof generation: ${error.message}`);
        },
      });
    } catch (error) {
      console.error('Error starting Reclaim session:', error);
      setStatus(`Error starting Reclaim session`);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>React Native Reclaim Demo</Text>
      <Button onPress={startReclaimSession} title="Start Reclaim Session" />
      <Text style={styles.status}>{status}</Text>
      {requestUrl && (
        <Text style={styles.url}>Request URL: {requestUrl}</Text>
      )}
      {proofObject && (
        <View style={styles.proofContainer}>
          <Text style={styles.subtitle}>Proof Data:</Text>
          <Text>{proofObject}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  status: {
    marginVertical: 10,
  },
  url: {
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  proofContainer: {
    marginTop: 20,
  },
});
```

## Step 4: Understanding the code

Let's break down what's happening in this code:

1. We initialize the Reclaim SDK with your application ID, secret, and provider ID. This happens once when the component mounts.

2. We set up deep linking to handle redirects back to the app after the verification process.

3. When the user presses the "Start Reclaim Session" button, we:
   - Generate a request URL using `getRequestUrl()`.
   - Attempt to open the URL, which starts the verification process.
   - Get the status URL using `getStatusUrl()`. This URL can be used to check the status of the claim process.
   - Start a session with `startSession()`, which sets up callbacks for successful and failed verifications.

4. We display the request URL, which can be opened manually if automatic opening fails.

5. When the verification is successful, we display the extracted data and the full proof object on the screen.

## Step 5: Run your application

Start your development server:

```bash
npx react-native run-android
# or
npx react-native run-ios
```

Your Reclaim SDK demo should now be running. Press the "Start Reclaim Session" button to begin the verification process.

## Understanding the Claim Process

1. **Creating a Claim**: When you press "Start Reclaim Session", the SDK generates a unique request for verification.

2. **Request URL**: The request URL is displayed and can be opened to start the verification process.

3. **Status URL**: This URL (logged to the console) can be used to check the status of the claim process.

4. **Verification**: The `onSuccess` callback is called when verification is successful, providing the proof data.

5. **Handling Failures**: The `onError` callback is called if verification fails, allowing you to handle errors gracefully.

## Advanced Configuration

The Reclaim SDK offers several advanced options to customize your integration:

1. **Adding Context**:
   You can add context to your proof request, which can be useful for providing additional information:
   ```typescript
   reclaimProofRequest.addContext('0x00000000000', 'Example context message');
   ```

2. **Setting Parameters**:
   If your provider requires specific parameters, you can set them like this:
   ```typescript
   reclaimProofRequest.setParams({ email: "test@example.com", userName: "testUser" });
   ```

3. **Custom Redirect URL**:
   Set a custom URL to redirect users after the verification process. You can even redirect the user back to your app by setting up the deep link scheme and adding it as the redirect URL:
   ```typescript
   reclaimProofRequest.setRedirectUrl(`${APP_SCHEME}proof`);
   ```

4. **Custom Callback URL**:
   Set a custom URL to receive proof status updates:
   ```typescript
   reclaimProofRequest.setAppCallbackUrl('https://example.com/callback');
   ```

5. **Exporting and Importing SDK Configuration**:
   You can export the entire Reclaim SDK configuration as a JSON string and use it to initialize the SDK with the same configuration on a different service or backend:
   ```typescript
   // On the client-side or initial service
   const configJson = reclaimProofRequest.toJsonString()
   console.log('Exportable config:', configJson)
   
   // Send this configJson to your backend or another service
   
   // On the backend or different service
   const importedRequest = ReclaimProofRequest.fromJsonString(configJson)
   const requestUrl = await importedRequest.getRequestUrl()
   ```
   This allows you to generate request URLs and other details from your backend or a different service while maintaining the same configuration.

## Handling Proofs on Your Backend

For production applications, it's recommended to handle proofs on your backend. You can set up a callback URL to receive proofs and status updates.

## Next Steps

Explore the [Reclaim Protocol documentation](https://docs.reclaimprotocol.org/) for more advanced features and best practices for integrating the SDK into your production applications.

Happy coding with Reclaim Protocol!

## Contributing to Our Project

We welcome contributions to our project! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## Security Note

Always keep your Application Secret secure. Never expose it in client-side code or public repositories.

## Code of Conduct

Please read and follow our [Code of Conduct](https://github.com/reclaimprotocol/.github/blob/main/Code-of-Conduct.md) to ensure a positive and inclusive environment for all contributors.

## Security

If you discover any security-related issues, please refer to our [Security Policy](https://github.com/reclaimprotocol/.github/blob/main/SECURITY.md) for information on how to responsibly disclose vulnerabilities.

## Contributor License Agreement

Before contributing to this project, please read and sign our [Contributor License Agreement (CLA)](https://github.com/reclaimprotocol/.github/blob/main/CLA.md).

## Indie Hackers

For Indie Hackers: [Check out our guidelines and potential grant opportunities](https://github.com/reclaimprotocol/.github/blob/main/Indie-Hackers.md)

## License

This project is licensed under a [custom license](https://github.com/reclaimprotocol/.github/blob/main/LICENSE). By contributing to this project, you agree that your contributions will be licensed under its terms.

Thank you for your contributions!