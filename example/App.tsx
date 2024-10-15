import * as React from 'react';
import {useEffect, useState} from 'react';
import {View, Text, Button, StyleSheet, Linking, TouchableOpacity, ScrollView} from 'react-native'; 
import {ReclaimProofRequest} from '../src/Reclaim';
import type { Proof } from '../src/utils/interfaces';

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


  const styles = StyleSheet.create({
    container: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    status: {
      textAlign: 'center',
      marginVertical: 20,
      fontWeight: 'bold',
    },
    extractedContainer: {
      marginTop: 20,
      width: '100%',
    },
    extractedText: {
      backgroundColor: '#f0f0f0',
      padding: 10,
      borderRadius: 5,
    },
    urlContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    urlLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 5,
    },
    url: {
      color: 'blue',
      textDecorationLine: 'underline',
    },
    proofContainer: {
      marginTop: 20,
      width: '100%',
    },
    proofText: {
      backgroundColor: '#f0f0f0',
      padding: 10,
      borderRadius: 5,
      fontFamily: 'monospace',
    },
  });


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
    // You can add logic here to handle the deep link, e.g., update app state or trigger actions
  }

  // Initialize the ReclaimProofRequest
  async function initializeReclaimProofRequest() {
    try {
      // ReclaimProofRequest Fields:
      // - applicationId: Unique identifier for your application
      // - appSecret: Secret key for your application
      // - providerId: Identifier for the specific provider you're using
      // - options: Additional configuration options (optional)
      const proofRequest = await ReclaimProofRequest.init(
        'YOUR_APP_ID', // your app ID
        'YOUR_APP_SECRET', // your app secret key
        'YOUR_PROVIDER_ID', // your provider ID
        // { log: true, acceptAiProviders: true } // options
      );
      setReclaimProofRequest(proofRequest);

      // Add context to the proof request (optional)
      proofRequest.addContext('0x00000000000', 'Example context message');

      // Set a redirect URL for after proof generation
      proofRequest.setRedirectUrl(`${APP_SCHEME}proof`);

      // You can also set parameters if needed:
      // proofRequest.setParams({ email: "test@example.com", userName: "testUser" });

      // Set a custom app callback URL if needed:
      // proofRequest.setAppCallbackUrl('https://example.com/callback');

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

      // Generate the request URL
      const url = await reclaimProofRequest.getRequestUrl();
      setRequestUrl(url);
      
      // Attempt to open the URL
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        setStatus('Session started. Waiting for proof...');
      } else {
        setStatus('Unable to open URL automatically. Please copy and open the URL manually.');
      }

      // Get the status URL for checking proof status (optional)
      const statusUrl = reclaimProofRequest.getStatusUrl();
      console.log('Status URL:', statusUrl);

      // Start the verification session
      await reclaimProofRequest.startSession({
        onSuccess: async (proof: Proof) => {
          console.log('Proof received:', proof);
          setStatus('Proof received!');
          setExtracted(JSON.stringify(proof.claimData.context));
          setProofObject(JSON.stringify(proof, null, 2)); // Format the proof object
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>React Native Reclaim Demo</Text>
      <Button onPress={startReclaimSession} title="Start Reclaim Session" />
      <Text style={styles.status}>{status}</Text>
      {requestUrl && (
        <View style={styles.urlContainer}>
          <Text style={styles.urlLabel}>Request URL:</Text>
          <TouchableOpacity onPress={() => Linking.openURL(requestUrl)}>
            <Text style={styles.url}>{requestUrl}</Text>
          </TouchableOpacity>
        </View>
      )}
      {extracted && (
        <View style={styles.extractedContainer}>
          <Text style={styles.subtitle}>Extracted Data:</Text>
          <Text style={styles.extractedText}>{extracted}</Text>
        </View>
      )}
      {proofObject && (
        <View style={styles.proofContainer}>
          <Text style={styles.subtitle}>Proof Object:</Text>
          <Text style={styles.proofText}>{proofObject}</Text>
        </View>
      )}
    </ScrollView>
  );
}
